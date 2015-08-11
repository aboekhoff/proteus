(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
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
},{"./meta":3,"./object_pool":4}],2:[function(require,module,exports){
// the engine is usual point of contact with the api layer

var DB = require('./db');

function Engine() {
	var engine = this;
	this.db = new DB();
	this.systems = {};

	this.Entity = this.db.addType('entity', {components: {}}, {id: true});

	this.Entity.prototype.destroy = function() {
		var types = Object.keys(this.components);

		for (var i=0, ii=keys.length; i<ii; i++) {
			this.removeAll(types[i]);
		}

		engine.db.destroy('entity', this.id);

	}

	this.Entity.prototype.get = function(type) {
		return engine.db.find(type, 'entityId', this.id);
	}

	this.Entity.prototype.add = function(type, params) {
		params.entityId = this.id;
		this.components[type] = true;
		engine.db.create(type, params);
		return this;
	}

	// remove one component

	this.Entity.prototype.remove = function(type, id) {
		engine.db.destroy(type, id);

		// if last component of a given type was removed then 
		// remove the component type from the entity's component map

		if (engine.db.hasUniqueIndex(type, 'entityId') ||
			  engine.db.find(type, 'entityId', this.id).length == 0) {
			delete this.components[type];
		}

	}

	// remove all components of the given type

	this.Entity.prototype.removeAll = function(type) {
		var res = db.find(type, 'entityId', this.id);

		if (res instanceof Array) {
			for (var i=0, ii=res.length; i<ii; i++) {
				engine.db.destroy(type, res[i].id);
			}
		} else {
			engine.db.destroy(type, res.id);
		}

		delete this.components[type];

	}

}

Engine.prototype.entity = function() {
	return this.db.create('entity', null);
}

Engine.prototype.entity.find = function(id) {
	return this.db.find('entity', 'id', id);
}

Engine.prototype.addComponent = function(name, fields, unique) {
	fields.entityId = null;
	indices = {id: true, entityId: !!unique};
	this.db.addType(name, fields, indices);
	return this; 
}

module.exports = Engine;

/*


*/

},{"./db":1}],3:[function(require,module,exports){
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
},{}],4:[function(require,module,exports){
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
},{}],5:[function(require,module,exports){
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
},{"./engine":2}]},{},[5]);
