var Engine = require('./src/engine');
var Bitset = require('./src/bitset');

function p(x) {
	var util = require('util');
	console.log(util.inspect(x, false, null));
}

var engine = new Engine();

// engine.addComponent('transform', {x: 0, y: 0, rotation: 0, scale: 1}, true);
// engine.addComponent('animation', {type: null}, false);
// var e1 = engine.entity();

// e1.add('transform', {x: 10, y: 10});
// e1.add('animation', {type: 'pulse'});
// e1.add('animation', {type: 'spin'});

// p(e1);
// p(e1.get('transform'));
// p(e1.get('animation'));

// var a2 = e1.get('animation')[1];
// e1.remove(a2);

// p(e1.get('animation'));

// var a3 = e1.add('animation', {type: 'burn'});
// var a4 = e1.add('animation', {type: 'melt'});

// p(e1.get('animation'));
// p(engine.db.all('animation'));

//

['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'].forEach(function(c) {
	engine.addComponent(c);
})

function rep(x) {
	if (x instanceof Bitset) {
		return x.toString();
	}

	else if (x instanceof Array) {
		return '[' + x[0] + ' ' + (x.slice(1).map(rep)).join(" ") + ']';
	}
}

function t(x) {
	console.log(rep(engine.normalizeDependencies(x)));
}

t(['a', 'b', 'c']);

t({or: ['a', 'b', 'c']})

t(['a', 'b', 'c', {or: ['d', 'e']}])

t(['a', 'b', {or: ['d']}]);

t(['a', 'b', {or: ['d', ['e', 'f']]}, {or: ['h', 'i']}, 'j']);

var p = console.log.bind(console);
var bs1 = new Bitset()
p(bs1.toString());
var bs2 = bs1.set(32);
p(bs2.toString());
var bs3 = bs2.set(33);
p(bs3.toString());
var bs4 = bs3.unset(32);
p(bs4.toString());

var t2 = function(test, mask) {
	console.log(engine.evaluateDependencies(test, mask));
}

var d1 = engine.normalizeDependencies(['a', 'b', 'c'])
var d2 = engine.normalizeDependencies(['a', 'b', {or: ['c', 'd']}]);
console.log(d2);
t2(d1, new Bitset().set(0).set(1).set(2));
t2(d1, new Bitset().set(0).set(1).set(3));
t2(d2, new Bitset().set(0).set(1).set(2));
t2(d2, new Bitset().set(0).set(1).set(3));
t2(d2, new Bitset().set(0).set(1).set(4));

var d3 = engine.normalizeDependencies(['a', 'b', {not: ['c']}])
t2(d3, new Bitset().set(0).set(1).set(3));
t2(d3, new Bitset().set(0).set(1).set(2));
