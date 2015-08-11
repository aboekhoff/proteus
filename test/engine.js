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

});