var assert = require('assert');
var should = require('should');
var Engine = require('../src/engine');

describe('Engine', function() {
	var engine;

	beforeEach(function() {
		engine = new Engine();
	});

	describe("Engine#entity", function() {
		it("should return fresh entity instances", function() {
			engine.entity().id.should.equal(1); 
		});
	});

	describe("Engine.Entity#add", function() {
		it("should return create new components linked to entity", function() {
			engine.addComponent('position', {x: 0, y: 0});
			var e1 = engine.entity().add('position', {x: 1, y: 1});
			var c1 = e1.get('position');
			c1.entityId.should.equal(e1.id);
			c1.x.should.equal(1);
			c1.y.should.equal(1);
		});
	});	

});