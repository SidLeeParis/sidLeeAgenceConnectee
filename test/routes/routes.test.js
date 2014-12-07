'use strict';
/*jshint expr: true*/
var should = require('chai').should(),
	utils = require('../utils'),
	helpers = require('../helpers'),
	Response = require('../mocks/response.mock'),
	Event = require('../../src/models/eventModel'),
	Routes = require('../../src/routes/routes');

// dummy values for testing
var dummyName = 'dummyName',
	dummyValue = 42,
	dummyUnit = 'dummyUnit';

// mocking Routes args
var sockets = {
	emit: function(msg, data) {
		msg.should.equal('event');
		should.exist(data);
		data.name.should.equal(dummyName);
		data.value.should.equal(dummyValue);
		data.unit.should.equal(dummyUnit);
	}
};

var routes = new Routes(sockets, Event);

describe('Routes', function() {

	describe('#create()', function() {
		it('should create an event', function(done) {
			var response = new Response(function() {
				response.getStatus().should.equal(201);
				should.not.exist(response.getData());
				Event.count(function(err, count) {
					count.should.equal(1);
					done();
				});
			});

			var req = { body: {} };
			req.body.name = dummyName;
			req.body.value = dummyValue;
			req.body.unit = dummyUnit;

			routes.create(req, response);
		});
	});

	describe('#find()', function() {
		it('should retrieve all events', function(done) {
			helpers.insertEvents(5, 5, function() {
				var response = new Response(function() {
					response.getStatus().should.equal(200);
					response.getData().length.should.equal(10);
					Event.count(function(err, count) {
						count.should.equal(10);
						done();
					});
				});

				var req = {};
				req.params = req.query = {};
				routes.find(req, response);
			});
		});

		it('should retrieve all events for the given name', function(done) {
			helpers.insertEvents(5, 5, function() {
				var response = new Response(function() {
					response.getStatus().should.equal(200);
					response.getData().length.should.equal(5);
					Event.count(function(err, count) {
						count.should.equal(10);
						done();
					});
				});

				var req = {};
				req.params = req.query = {};
				req.params.name = 'dummyName1';
				routes.find(req, response);
			});
		});

		it('should retrieve 2 events because of limit', function(done) {
			helpers.insertEvents(5, 5, function() {
				var response = new Response(function() {
					response.getStatus().should.equal(200);
					response.getData().length.should.equal(2);
					Event.count(function(err, count) {
						count.should.equal(10);
						done();
					});
				});

				var req = {};
				req.params = req.query = {};
				req.query.limit = 2;
				routes.find(req, response);
			});
		});

		it('should retrieve all events between the given dates', function(done) {
			helpers.insertEvents(5, 5, function() {
				var response = new Response(function() {
					response.getStatus().should.equal(200);
					response.getData().length.should.equal(5);
					Event.count(function(err, count) {
						count.should.equal(10);
						done();
					});
				});

				var req = {};
				req.params = req.query = {};
				req.params.name = 'dummyName1';
				req.query.fromDate = '2000-01-01';
				req.query.toDate = '2020-01-01';
				routes.find(req, response);
			});
		});

	});

});
