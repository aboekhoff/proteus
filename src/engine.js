// the engine is first point of contact with the high level api

var DB = require('./db');
var Bitset = require('./bitset');

function Engine() {
	var engine = this;
	this.db = new DB();
	this.systems = {};
	this.systemList = [];
	this.componentTypes = {};
	this.componentTypeList = [];
	this.componentGroups = {};

	this.Entity = this.db.addType('entity', {}, {id: true});

	this.Entity.prototype.destroy = function() {
		var entity = this;

		this.componentMask.eachSetBitIndex(function(i) {
			entity.removeAll(engine.componentTypeList[i].name);
		});

		this.componentMask.mutatingReset();
		engine.db.destroy('entity', this.id);

	}

	this.Entity.prototype.get = function(type) {
		return engine.db.find(type, 'entityId', this.id);
	}

	this.Entity.prototype.add = function(type, params) {
		params = params || {};
		params.entityId = this.id;
		this.componentMask.mutatingSet(engine.componentTypes[type].id);
		engine.db.create(type, params);
		return this;
	}

	// remove one component

	this.Entity.prototype.remove = function(instance) {
		var type = instance.constructor.name;
		engine.db.destroy(type, instance.id);

		// if last component of a given type was removed then 
		// remove the component type from the entity's component map

		if (engine.db.hasUniqueIndex(type, 'entityId') ||
			  engine.db.find(type, 'entityId', this.id).length == 0) {
			this.componentMask.mutatingUnset(engine.componentTypes[type].id);
		}

	}

	// remove all components of the given type

	this.Entity.prototype.removeAll = function(type) {
		var res = engine.db.find(type, 'entityId', this.id);

		if (res instanceof Array) {
			for (var i=0, ii=res.length; i<ii; i++) {
				engine.db.destroy(type, res[i].id);
			}
		} else {
			engine.db.destroy(type, res.id);
		}

		this.componentMask.mutatingUnset(engine.componentTypes[type].id);

	}

}

Engine.prototype.entity = function() {
	var entity = this.db.create('entity', null);
	if (!entity.componentMask) {
		entity.componentMask = new Bitset();
	}
	return entity;
}

Engine.prototype.entity.find = function(id) {
	return this.db.find('entity', 'id', id);
}

Engine.prototype.addComponentType = function(name, fields, multiple) {
	fields = fields || {};
	fields.entityId = null;
	indices = {id: true, entityId: !multiple};
	var componentType = this.db.addType(name, fields, indices);
	componentType.id = this.componentTypeList.length;
	componentType.mask = new Bitset().set(componentType.id);
	this.componentTypeList.push(componentType);
	this.componentTypes[name] = componentType;
	return this; 
}

Engine.prototype.addSystem = function(name, system) {
	var engine = this;
	system.id = this.systemList.length;
	this.systemList.push(system);
	this.systems[name] = system;
	system.getDependencyTest = function() {
		if (!system.dependencyTest) {
			system.dependencyTest = engine.normalizeDependencies(system.dependencies || []);
		}
		return system.dependencyTest;
	}
}

// definite optimization opportunities here
// since engine dependencies can now be complicated
// defer on trying to filter entities beforehand

// one possible optimization is to avoid the array
// allocation and execute each system in the each loop
Engine.prototype.getEntitiesFor = function(sys) {
	var engine = this;
	var res = [];
	var test = sys.getDependencyTest();
	this.db.objectPools['entity'].forEach(function(e) {
		if (engine.evaluateDependencies(test, e.componentMask)) {
			res.push(e);
		}
	})
	return res;
}

// mini compiler that does minimal optimization of dependency specs
// most systems should have relatively simple dependencies so this should
// be sufficient
// presumably more sophisticated optimization of logical operations is
// possible but the performance impact is probably negligible

Engine.prototype.normalizeDependencies = function(deps) {
	function raiseHell(msg) {
		throw Error(msg || 'malformed dependencies');
	}

	var engine = this;

	// first convert to normal form
	function normalize(x) {
		if (typeof x == 'string') {
			var val = engine.componentTypes[x] ? engine.componentTypes[x].mask : engine.componentGroups[x];
			if (val == null) { raiseHell('no component or componentGroup named: ' + x); }
			return val;
		}
		if (x instanceof Array) {
			return ['and'].concat(x.map(normalize))
		}
		if (x instanceof Object) {
			var key = Object.keys(x)[0];
			if (!['and', 'or', 'not'].indexOf(key) == -1) {
				raiseHell('keys must be on of and, or, or not');
			}
			return [key].concat(x[key].map(normalize));
		}
	}

	// then combine masks where possible and produce a sequence of tests
	// that can be executed by the entity harvester
	function flatten(obj) {
		var op = obj[0];
		var args = obj.slice(1);
		
		var mask = new Bitset();
		var next = [];

		var i=0;
		while (args.length) {
			i++;
			var arg = args.shift();
			if (arg instanceof Bitset) {
				mask = mask.or(arg);
			}
			else if (arg instanceof Array) {
				if (arg[0] == op) {
					args.push.apply(arg.slice(1));
				}
				else {
					next.push(flatten(arg));
				}
			}
			else throw Error('malformed input')
		}

		return [op, mask].concat(next);

	}

	return flatten(normalize(deps));

}

Engine.prototype.evaluateDependencies = function(test, mask) {

	function ev(test) {
		var op = test[0];
		switch(op) {
			case 'and': return and(test); 
			case 'or': return or(test);
			case 'not': return not(test);
		}
	}

	function and(xs) {
		for (var j=1; j<xs.length; j++) {
			var x = xs[j];
			if (x instanceof Bitset) {
				if (!x.allIn(mask)) {
					return false;
				}
			} else if (!ev(x)) {
				return false 
			}
		}
		return true;
	}

	function or(xs) {
		for (var j=1; j<xs.length; j++) {
			var x = xs[j];
			if (x instanceof Bitset) {
				if (x.anyIn(mask)) {
					return true;
				}
			} else if (ev(x)) {
				return true;
			}
		}
		return false;
	}

	function not(xs) {
		for (var j=1; j<xs.length; j++) {
			var x = xs[j];
			if (x instanceof Bitset) {
				if (x.anyIn(mask)) {
					return false;
				}
			} else if (ev(x)) {
				return false;
			}
		}
		return true;
	}

	return ev(test);

}

// components map to a single AND mask
// predicates map to possibly complex mask combinations
// each system compiles it's requirement definition
// into an executable logic test

// since and is by far the most common operation
// make and the default operator
//

/*
Engine.prototype.addComponentGroup(
	physics: ['transform', 'velocity', 'acceleration']
)

Engine.prototype.addComponentGroup(
	renderable: ['transform', or('shape', 'sprite')]
)

Engine.addSystem({
	renderer: {
		dependences: ['renderable', not('invisible')]
	}
})

*/

module.exports = Engine;