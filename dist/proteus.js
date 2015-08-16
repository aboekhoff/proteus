(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
// simple bitset objects for handling of masks of arbitrary size

function Bitset(array) {
	this.array = array || [0];
	this.string = null;
}

Bitset.prototype.toString = function() {
	if (!this.string) {
		var r = [];
		for (var i=this.array.length-1; i>=0; i--) {
			var n = this.array[i];
			for (var j=31; j>=0; j--) {
				r.push((n >>> j) & 1);
			}
		}	
		while(r.length) {
			if (r[0] == 0) { r.shift(); }
			else { break; }
		}

		if (r.length == 0) {
			r = [0];
		}

		this.string = r.join("");
	}

	return this.string;	
}

Bitset.map = function(a, op) {
	var res = [];
	var aa = a.array;
	for (var i=0, ii=aa.length; i<ii; i++) {
		res.push(op(aa[i]));
	}
	return new Bitset(res);
}

Bitset.map2 = function(a, b, op) {
	var res = [];
	var aa = a.array;
	var bb = b.array;
	var n = Math.max(aa.length, bb.length);
	for (var i=0; i<n; i++) {
		var aan = (aa.length < i-1) ? 0 : aa[i];
		var bbn = (bb.length < i-1) ? 0 : bb[i];
		res.push(op(aan, bbn));
	}
	return new Bitset(res);
}

Bitset.defineUnaryOperator = function(name, op) {
	Bitset[name] = function(a) {return Bitset.map(a, op)};
	Bitset.prototype[name] = function() {return Bitset.map(this, op)}
}

Bitset.defineBinaryOperator = function(name, op) {
	Bitset[name] = function (a, b) {return Bitset.map2(a, b, op);}
	Bitset.prototype[name] = function(b) {return Bitset.map2(this, b, op);}
}

Bitset.defineUnaryOperator('not', function(a) {return ~a});
Bitset.defineBinaryOperator('and', function(a, b) {return a & b});
Bitset.defineBinaryOperator('or', function(a, b) {return a | b});
Bitset.defineBinaryOperator('xor', function(a, b) {return a ^ b});

Bitset.nth = function(a, n) {
	var index = Math.floor(n/32);
	if (index > a.array.length) {
		return 0;
	}
	else {
		var shift = n%32;
		return (a.array[index] >>> shift) & 1; 
	}
}

Bitset.prototype.nth = function(n) {
	return Bitset.nth(this, n);
}

Bitset.set = function(a, n) {
	var res = [];
	var index = Math.floor(n/32);
	var offset = n % 32;

	for (var i=0; i<=index; i++) {
		var m = a.array[i];
		res.push(i == index ? m | (1<<offset) : m);
	}

	return new Bitset(res);
}

Bitset.prototype.set = function(n) {
	return Bitset.set(this, n);
}

Bitset.mutatingSet = function(a, n) {
	var index = Math.floor(n/32);
	var offset = n % 32;

	for (var i=0; i<=index; i++) {
		if (i == index) { 
			a.array[i] = a.array[i] | (1<<offset);
			break; 
		}
	}

	return a;

}

Bitset.prototype.mutatingSet = function(n) {
	return Bitset.mutatingSet(this, n);
}

Bitset.unset = function(a, n) {
	var res = [];
	var index = Math.floor(n/32);
	var offset = n % 32;

	for (var i=0; i<=index; i++) {
		var m = a.array[i];
		res.push(index == i ? m & ~(1<<offset) : m)
	}

	return new Bitset(res);
}

Bitset.prototype.unset = function(n) {
	return Bitset.unset(this, n);
}

Bitset.mutatingUnset = function(a, n) {
	var index = Math.floor(n/32);
	var offset = n % 32;

	for (var i=0; i<=index; i++) {
		if (i == index) {
			var m = a.array[i];
			a.array[i] = a.array[i] & ~(1<<offset);
		}
	}

	return this;
}

Bitset.prototype.mutatingUnset = function(n) {
	return Bitset.mutatingUnset(this, n);
}

Bitset.mutatingReset = function(a) {
	for (var i=0, ii=a.array.length; i<ii; i++) {
		a.array[i] = 0;
	}
	return a;
}

Bitset.prototype.mutatingReset = function() {
	Bitset.mutatingReset(this);
}

Bitset.eachSetBitIndex = function(bitset, callback) {
	var arr = bitset.array;
	for (var i=0, ii=arr.length; i<ii; i++) {
		var mask = arr[i];
		var index = i * 32;
		while(mask) {
			if (mask & 1) {
				callback(index);
			}
			mask = mask >>> 1;
			index++;
		}
	}
};

Bitset.prototype.eachSetBitIndex = function(callback) {
	return Bitset.eachSetBitIndex(this, callback);
}

Bitset.isEmpty = function(a) {
	for (var i=0, ii=a.array.length; i<ii; i++) {
		if (a.array[i] != 0) { return false; }
	}
	return true;
}

Bitset.prototype.isEmpty = function() {
	return Bitset.isEmpty(this);
}

// test if every set bit in a is also set in b
Bitset.allIn = function(a, b) {
	var aa = a.array;
	var bb = b.array;
	var n = Math.max(aa.length, bb.length);
	for (var i=0; i<n; i++) {
		var aan = (aa.length < i-1) ? 0 : aa[i];
		var bbn = (bb.length < i-1) ? 0 : bb[i];	
		if ((aan & bbn) != aan) { return false; }
	}
	return true;
}

Bitset.prototype.allIn = function(b) {
	return Bitset.allIn(this, b);
}

// test if any bit set in a is also set in b
Bitset.anyIn = function(a, b) {
	var aa = a.array;
	var bb = b.array;
	var n = Math.max(aa.length, bb.length);
	for (var i=0; i<n; i++) {
		var aan = (aa.length < i-1) ? 0 : aa[i];
		var bbn = (bb.length < i-1) ? 0 : bb[i];
		if (aan & bbn) { return true; }
	}
	return false;
}

Bitset.prototype.anyIn = function(b) {
	return Bitset.anyIn(this, b);
}

module.exports = Bitset;
},{}],2:[function(require,module,exports){
// object pool manager with indexing
// currently non-unique indices do linear search on delete
// tailored to the needs and the limitations of the proteus ECS engine

var ObjectPool = require('./object_pool');
var meta = require('./meta');

function DB() {
	this.constructors = {};
	this.objectPools = {};
	this.indices = {};
	this.counters = {};
}

DB.prototype.addType = function(name, fields, indices) {
	if (this.constructors[name]) {
		throw Error('duplicate name ' + name);
	}

	this.constructors[name] = meta.generateConstructor(name, fields);
	this.objectPools[name] = new ObjectPool(this.constructors[name]);
	this.counters[name] = 1;
	this.indices[name] = {
		data: {},
		fields: [],
		unique: {} 
	};

	for (var field in indices) {
		this.indices[name].data[field] = {};
		this.indices[name].fields.push(field);
		this.indices[name].unique[field] = indices[field];
	}

	return this.constructors[name];

}

DB.prototype.create = function(type, params) {
	var index = this.indices[type];
	var instance = this.objectPools[type].create(params);
	instance.id = this.counters[type]; 
	this.counters[type] += 1;

	for (var i=0, ii=index.fields.length; i<ii; i++) {
		var field = index.fields[i];
		var key = instance[field];
		if (index.unique[field]) {
			index.data[field][key] = instance;
		} else {
			var coll = index.data[field][key] || (index.data[field][key] = []);
			coll.push(instance);
		}
	}

	return instance;
}

DB.prototype.destroy = function(type, id) {
	// find the instance referenced by type and id
	var index = this.indices[type];
	var instance = index.data.id[id];

	// delete the instance from all indices
	for (var i=0, ii=index.fields.length; i<ii; i++) {
		var field = index.fields[i];
		var key = instance[field];

		if (index.unique[field]) {
			delete index.data[field][key];
		} 

		// deletion of items from non-unique indexes is expensive
		// could use a specialized datastructure instead of array
		// but in general the size should never get too large

		else {
			var coll = index.data[field][key];
			for (var i=0; i<coll.length; i++) {
				if (instance == coll[i]) {
					coll.splice(i, 1);
					if (coll.length == 0) {
						delete index.data[field][key];
					} 
				}
			}
		}
	}

	instance.id = null;
	this.objectPools[type].dispose(instance);

}

DB.prototype.find = function(type, field, val) {
	var index = this.indices[type];

	if (!index) { 
		throw Error('no index on type: ' + type + ' for field: ' + field) 
	}

	if (index.unique[field]) {
		return index.data[field][val];	
	} else {
		return index.data[field][val] || [];
	}

}

DB.prototype.all = function(type) {
	return this.objectPools[type].toArray();
} 

DB.prototype.hasUniqueIndex = function(type, field) {
	return this.indices[type].unique[field];
}

module.exports = DB;
},{"./meta":4,"./object_pool":5}],3:[function(require,module,exports){
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
Engine.prototype.getEntitiesFor = function(sys, es) {
	if (!es) { es = this.db.all('entity'); }
	var res = [];
	var test = sys.getDependencyTest();
	for (var i=0, ii=es.length; i<ii; i++) {
		var e = es[i];
		if (this.evaluateDependencies(test, e.componentMask)) {
			res.push(e);
		}
	}
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
},{"./bitset":1,"./db":2}],4:[function(require,module,exports){
module.exports = {
	generateConstructor: function(name, schema) {
		var src = [
		"return function " + name + "(params) {",
		"if (this._index == null) { this._index = null }",
		"if (this.id == null) { this.id = null; }",
		];

		var withParams = ["if (params) {"];
		var withoutParams = ["} else {"];

		var keys = Object.keys(schema);

		for (var i=0; i<keys.length; i++) {
			var key = keys[i];
			var defaultValue = schema[key];
			var defaultString;

			var qkey = "'" + key + "'";
			var keySetter = "this[" + qkey + "] = ";
			var defaultValue = JSON.stringify(defaultValue);
			var setDefault = keySetter + defaultValue;
			var maybeSetDefault = 
				keySetter + 
				"(" + qkey + " in params) ? params[" + qkey + "] : " + 
				defaultValue + ";"; 

			withParams.push(maybeSetDefault);
			withoutParams.push(setDefault + ";");
		}

		src.push.apply(src, withParams);
		src.push.apply(src, withoutParams);
		src.push("}");
		src.push("}");

		return Function(src.join("\n"))();

	}
}
},{}],5:[function(require,module,exports){
// low level object pooling

function ObjectPool(klass, initialSize) {
	this.klass = klass;
	this.initialSize = initialSize || 100;
	this.pool = [];
	this.marker = 0;
	this.resizePool(this.initialSize);
}

ObjectPool.prototype.resizePool = function(newSize) {
	var oldSize = this.pool.length;
	this.pool.length = newSize;

	for (var i=oldSize; i<newSize; i++) {
		var instance = new this.klass(null);
		instance._index = i;
		this.pool[i] = instance;
	}
}

// public API

ObjectPool.prototype.toArray = function() {
	return this.pool.slice(0, this.marker);
}

// finds an instance by index
ObjectPool.prototype.get = function(index) {
	return this.pool[index];
}

// returns an index
ObjectPool.prototype.create = function(params) {
	var index = this.marker; 
	this.marker++;

	if (index >= this.pool.length) {
		this.resizePool(this.pool.length + this.initialSize);
	}

	var instance = this.pool[index];
	this.klass.call(instance, params);

	return instance;
}

ObjectPool.prototype.dispose = function(instance) {
	var index = instance._index;

	if (index < this.marker-1) {
		var swapIndex = this.marker-1;
		var swapInstance = this.pool[this.marker-1];

		this.pool[index] = swapInstance;
		swapInstance._index = index;

		this.pool[swapIndex] = instance;
		instance._index = swapIndex;
	}

	this.marker--;
}

module.exports = ObjectPool;
},{}],6:[function(require,module,exports){
var Engine = require('./engine');

module.exports = function Proteus(options) {
	this.engine = new Engine();
}

// var engine = new Engine();

// function p(x) {
// 	var util = require('util');
// 	console.log(util.inspect(x, false, null));
// }

// engine.addType('entity', {}, {id: true});
// engine.addType('transform', {x: 0, y: 0, entityId: null}, {id: true, entityId: true});
// engine.addType('animation', {entityId: null}, {id: true, entityId: false});

// p(engine.indices);

// var e1 = engine.create('entity');
// var t1 = engine.create('transform', {entityId: e1.id});
// var a1 = engine.create('animation', {entityId: e1.id});
// var a2 = engine.create('animation', {entityId: e1.id});

// p(engine.indices);

// engine.destroy('animation', a2.id);

// p(engine.indices);

// var a3 = engine.create('animation', {entityId: e1.id});

// p(engine.indices);

// engine.entity.findBy.id(1);
// engine.animation.findBy.entityId(1);
},{"./engine":3}]},{},[6]);
