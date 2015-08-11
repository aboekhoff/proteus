var assert = require('assert');
var should = require('should');
var DB = require('../src/db');

describe('DB', function() {
	var db;

	beforeEach(function() {
		db = new DB();
		db.addType('entity', {}, {id: true}); 
	});

	describe('DB#create', function() {
		it('should return entities with incrementing ids', function() {
			var e1 = db.create('entity', {});
			var e2 = db.create('entity', {});
			var e3 = db.create('entity', {});
			e1.id.should.equal(1);
			e2.id.should.equal(2);
			e3.id.should.equal(3);
		});
	});

	describe('DB#find', function() {
		it('should find entities by their unique index', function() {
			var e1 = db.create('entity', {});
			db.find('entity', 'id', 1).should.equal(e1);
		});
	});

	describe('DB#find', function() {
		it('should return undefined for a unique index that does not exist', function() {
			var e1 = db.create('entity', {});
			db.destroy('entity', e1.id);
			should.not.exist(db.find('entity', 'id', 1));
		});
	});

	describe('DB#find', function() {
		it('should return an array of objects by their non-unique index', function() {
			db.addType('widget', {entityId: null}, {entityId: false});
			var e1 = db.create('entity', {});
			var w1 = db.create('widget', {entityId: e1.id});
			var w2 = db.create('widget', {entityId: e1.id});
			db.find('widget', 'entityId', e1.id).length.should.equal(2);
		});
	});

	describe('DB#find', function() {
		it('should return an empty array for a non-unique index that does not exist', function() {
			db.addType('widget', {entityId: null}, {entityId: false});
			var e1 = db.create('entity', {});
			db.find('widget', 'entityId', e1.id).length.should.equal(0);
		});
	});

})