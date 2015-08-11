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
