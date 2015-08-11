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