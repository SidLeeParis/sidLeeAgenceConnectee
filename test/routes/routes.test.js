'use strict';
/*jshint expr: true*/
var should = require('chai').should(),
	utils = require('../utils'),
	Response = require('../mocks/response.mock'),
	Event = require('../../src/models/eventModel'),
	Routes = require('../../src/routes/routes');

// dummy values for testing
var dummyName = 'dummyName',
	dummyValue = 42,
	dummyType = 'dummyType';

// mocking Routes args
var sockets = {
	emit: function(msg, data) {
		msg.should.equal('event');
		should.exist(data);
		data.name.should.equal(dummyName);
		data.value.should.equal(dummyValue);
		data.unit.should.equal(dummyType);
	}
};

var routes = new Routes(sockets, Event);

describe('Routes', function() {

	describe('#create()', function() {
		it('should create an event', function(done) {
			var response = new Response(function() {
				response.getStatus().should.equal(201);
				should.not.exist(response.getData());
				done();
			});

			var req = { body: {} };
			req.body.name = dummyName;
			req.body.value = dummyValue;
			req.body.type = dummyType;

			routes.create(req, response);
		});
	});

	describe('#find()', function() {
		it('should retrieve all events', function(done) {
			var response = new Response(function() {
				response.getStatus().should.equal(200);
				done();
			});

			var req = {};
			req.params = req.query = {}
			routes.find(req, response);
		});

	});

});
