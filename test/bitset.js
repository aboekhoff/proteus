var assert = require('assert');
var should = require('should');
var Bitset = require('../src/bitset');

// since the Bitset class truncates leading zeros but not ones in the string
// representation this is not a reliable way to test bitsets
// after a not operation

function countChars(str, ch) {
	str = '' + str;
	ch = '' + ch;
	var cnt = 0;
	for (var i=0; i<str.length; i++) {
		if (str[i] === ch) { cnt++; }
	}
	return cnt;
}

describe('Bitset', function() {
	describe('Bitset#set', function() {
		it('should set the nth bit of a new bitset', function() {
			var b1 = new Bitset();
			var b2 = b1.set(65);
			countChars(b1, '1').should.equal(0);
			countChars(b2, '1').should.equal(1);
			b1.nth(65).should.equal(0);
			b2.nth(65).should.equal(1);
		});
	});

	describe('Bitset#unset', function() {
		it('should set the nth bit of a new bitset', function() {
			var b1 = new Bitset().set(65);
			var b2 = b1.unset(65);
			b1.nth(65).should.equal(1);
			b2.nth(65).should.equal(0);
		});
	});

	describe('Bitset#or', function() {
		it('should perform bitwise or', function() {
			var b1 = new Bitset().set(1).set(32).set(64);
			var b2 = new Bitset().set(2).set(33).set(65);
			var b3 = b1.or(b2);

			countChars(b3, '1').should.equal(6);
			b3.nth(1).should.equal(1);
			b3.nth(2).should.equal(1);
			b3.nth(32).should.equal(1);
			b3.nth(33).should.equal(1);
			b3.nth(64).should.equal(1);
			b3.nth(65).should.equal(1);
		}) 
	})

	describe('Bitset#and', function() {
		it('should perform bitwise and', function() {
			var b1 = new Bitset().set(1).set(2).set(32).set(33).set(64).set(65);
			var b2 = new Bitset().set(2).set(3).set(33).set(34).set(65).set(66);
			var b3 = b1.and(b2);

			countChars(b3, '1').should.equal(3);
			b3.nth(2).should.equal(1);
			b3.nth(33).should.equal(1);
			b3.nth(65).should.equal(1);
		}) 
	})

	describe('Bitset#not', function() {
		it('should perform bitwise not', function() {
			var b1 = new Bitset().set(65);
			var b2 = b1.not();
			countChars(b2, 0).should.equal(1);
			b2.nth(65).should.equal(0);
		}) 
	})

	describe('Bitset#eachSetBitIndex', function() {
		it('should invoke callback with index of each set bit', function() {
			var indices = [3, 5, 7, 9, 33, 35, 42, 69];
			var b1 = new Bitset();
			indices.forEach(function(i) {b1 = b1.set(i)});
			b1.eachSetBitIndex(function(i) {
				indices.indexOf(i).should.not.equal(-1);	
			});
		}) 
	})
})