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