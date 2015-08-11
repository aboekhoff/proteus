var Engine = require('./src/engine');

function p(x) {
	var util = require('util');
	console.log(util.inspect(x, false, null));
}

var engine = new Engine();
engine.addComponent('transform', {x: 0, y: 0, rotation: 0, scale: 1}, true);
engine.addComponent('animation', {type: null}, false);
var e1 = engine.entity();
var t1 = e1.add('transform', {x: 10, y: 10});
var a1 = e1.add('animation', {type: 'pulse'});
var a2 = e1.add('animation', {type: 'spin'});

p(e1);
p(e1.get('transform'));
p(e1.get('animation'));

e1.remove('animation', a2.id);

p(e1.get('animation'));

var a3 = e1.add('animation', {type: 'burn'});
var a4 = e1.add('animation', {type: 'melt'});

p(e1.get('animation'));