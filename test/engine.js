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
			engine.addComponentType('position', {x: 0, y: 0});
			var e1 = engine.entity().add('position', {x: 1, y: 1});
			var c1 = e1.get('position');
			c1.entityId.should.equal(e1.id);
			c1.x.should.equal(1);
			c1.y.should.equal(1);
		});
	});

	describe("Engine.Entity#remove", function() {
		it("should destroy the component linked to the entity", function() {
			engine.addComponentType('position', {x: 0, y: 0});
			var e1 = engine.entity().add('position', {x: 1, y: 1});
			var c1 = e1.get('position');

			e1.remove(c1);

			should.not.exist(c1.id);
			should.not.exist(e1.get('position'));
		});
	});

	describe("Engine.Entity#destroy", function() {
		it("should destroy the entity and all components linked to the entity", function() {
			engine.addComponentType('position', {x: 0, y: 0});
			engine.addComponentType('velocity', {x: 0, y: 0});
			var e1 = engine.entity();
			var c1 = e1.add('position', {x: 0, y: 0})
			var c2 = e1.add('velocity', {x: 0, y: 0})
			should.exist(e1.id);
			should.exist(c1.id);
			should.exist(c2.id);
			e1.destroy();
			should.not.exist(e1.id);
			should.not.exist(c1.id);
			should.not.exist(c2.id);
		})
	})

	describe("dependency computation", function() {
		var engine; 

		beforeEach(function() {
			engine = new Engine();
			['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k']
				.forEach(function(type) {
					engine.addComponentType(type);
				});
		});

		describe('Engine#getEntitiesFor', function() {
			it('should return the list of entities that satisfy the system\'s dependency spec', function() {
				var system = { dependencies: ['a', 'b'] };
				engine.addSystem('ab', system);

				var e1 = engine.entity().add('a').add('b');
				var e2 = engine.entity().add('a');
				var e3 = engine.entity().add('a').add('b');
				var e4 = engine.entity().add('b');

				var es = engine.getEntitiesFor(system);
				es.indexOf(e1).should.not.equal(-1);
				es.indexOf(e3).should.not.equal(-1);
			})
		})

		// describe("Engine#collectEntitiesByDependencies", function() {
		// 	engine.createComponentGroup('abc', ['a', 'b', 'c']);
		// 	engine.collectEntitiesByDependencies(['abc']);
		// });

	})

});