'use strict';
/*jshint expr: true*/
var should = require('chai').should(),
	nock = require('nock'),
	utils = require('../utils'),
	helpers = require('../helpers'),
	Response = require('../mocks/response.mock'),
	Event = require('../../src/models/eventModel'),
	Routes = require('../../src/routes/routes'),
	Conf = require('../../src/conf/conf'),
	SensorsConf = require('../mocks/sensorsConf.mock');

// dummy values for testing
var dummyName = 'dummyName',
	dummyValue = 42,
	dummyUnit = 'dummyUnit';

// mocking Routes args
var sockets = {
	emit: function(msg, data) {
		msg.should.equal('event');
		should.exist(data);
		data._id.should.equal(dummyName);
		data.value.should.equal(dummyValue);
		data.unit.should.equal(dummyUnit);
	}
};

var routes = new Routes(sockets, Event, SensorsConf);

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
			req.body.token = Conf.SENSOR_TOKEN;

			routes.create(req, response);
		});

		it('should return a 403 (forbidden) if no token provided', function(done) {
			var response = new Response(function() {
				response.getStatus().should.equal(403);
				Event.count(function(err, count) {
					count.should.equal(0);
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

	describe('#aggregate()', function() {

		beforeEach(function() {
			// mock GA
			var fakeUrl = '/ga?ids=ga%3A96546222&start-date=today&end-date=today&metrics=ga%3Apageviews';
			var fakeData = {
				totalsForAllResults: {
					'ga:pageviews': 15
				}
			};
			nock('https://www.googleapis.com/analytics/v3/data')
				.get(fakeUrl)
				.reply(200, fakeData);
			// mock facebook graph
			nock('http://graph.facebook.com')
				.get('/203384865593')
				.reply(200, {likes: 1000});
		});

		describe('- today routes', function() {

			it('should group events in two categories when called for today', function(done) {
				helpers.insertEvents(5, 5, function() {
					var response = new Response(function() {
						response.getStatus().should.equal(200);
						response.getData().length.should.equal(4);
						done();
					});

					var req = {};
					req.params = req.query = {};
					routes.aggregate.call('today', req, response);
				});
			});

			it('should only return events for \'dummyName1\' when called for today', function(done) {
				helpers.insertEvents(5, 5, function() {
					var response = new Response(function() {
						response.getStatus().should.equal(200);
						response.getData()._id.should.equal('dummyName1');
						done();
					});

					var req = {};
					req.params= { name: 'dummyName1' };
					routes.aggregate.call('today', req, response);
				});
			});

			it('should count the right amount for event called \'undo\' when called for today', function(done) {
				helpers.insertEvents(5, 5, function() {
					var response = new Response(function() {
						response.getStatus().should.equal(200);
						response.getData().forEach(function(currentSensor) {
							if (currentSensor && currentSensor._id === 'undo') {
								currentSensor.value.should.equal(5);
								should.exist(currentSensor.last);
								should.exist(currentSensor.user);
								done();
							}
						});
					});

					var req = {};
					req.params = req.query = {};
					routes.aggregate.call('today', req, response);
				});
			});
		});

		describe('- last24 routes', function() {

			it('should group events in two categories when called for last24', function(done) {
				helpers.insertEvents(5, 5, function() {
					var response = new Response(function() {
						response.getStatus().should.equal(200);
						response.getData().length.should.equal(4);
						done();
					});

					var req = {};
					req.params = req.query = {};
					routes.aggregate.call('last24', req, response);
				});
			});

			it('should only return events for \'dummyName1\' when called for last24', function(done) {
				helpers.insertEvents(5, 5, function() {
					var response = new Response(function() {
						response.getStatus().should.equal(200);
						response.getData()._id.should.equal('dummyName1');
						done();
					});

					var req = {};
					req.params= { name: 'dummyName1' };
					routes.aggregate.call('last24', req, response);
				});
			});

			it('should count the right amount for event called \'undo\' when called for last24', function(done) {
				helpers.insertEvents(5, 5, function() {
					var response = new Response(function() {
						response.getStatus().should.equal(200);
						response.getData().forEach(function(currentSensor) {
							if (currentSensor && currentSensor._id === 'undo') {
								currentSensor.values[0].hourAgo.should.equal(0);
								currentSensor.values[0].value.should.equal(5);
								done();
							}
						});
					});

					var req = {};
					req.params = req.query = {};
					routes.aggregate.call('last24', req, response);
				});
			});

			it('should count the right amount for event called \'undo\' when called for last24 with user filter', function(done) {
				helpers.insertEvents(5, 5, function() {
					var response = new Response(function() {
						response.getStatus().should.equal(200);
						response.getData().forEach(function(currentSensor) {
							if (currentSensor._id === 'undo') {
								should.exist(currentSensor.values[0].user);
								should.exist(currentSensor.values[0].value);
								done();
							}
						});
					});

					var req = {};
					req.params = req.query = {};
					routes.aggregate.call('last24/user', req, response);
				});
			});

			it('should count the right amount for event called \'undo\' when called for last24 with app filter', function(done) {
				helpers.insertEvents(5, 5, function() {
					var response = new Response(function() {
						response.getStatus().should.equal(200);
						response.getData().forEach(function(currentSensor) {
							if (currentSensor._id === 'undo') {
								should.exist(currentSensor.values[0].app);
								should.exist(currentSensor.values[0].value);
								done();
							}
						});
					});

					var req = {};
					req.params = req.query = {};
					routes.aggregate.call('last24/app', req, response);
				});
			});
		});

		describe('- last30 routes', function() {

			it('should group events in two categories when called for last30', function(done) {
				helpers.insertEvents(5, 5, function() {
					var response = new Response(function() {
						response.getStatus().should.equal(200);
						response.getData().length.should.equal(4);
						done();
					});

					var req = {};
					req.params = req.query = {};
					routes.aggregate.call('last30', req, response);
				});
			});

			it('should only return events for \'dummyName1\' when called for last30', function(done) {
				helpers.insertEvents(5, 5, function() {
					var response = new Response(function() {
						response.getStatus().should.equal(200);
						response.getData()._id.should.equal('dummyName1');
						done();
					});

					var req = {};
					req.params= { name: 'dummyName1' };
					routes.aggregate.call('last30', req, response);
				});
			});

			it('should count the right amount for event called \'undo\' when called for last30', function(done) {
				helpers.insertEvents(5, 5, function() {
					var response = new Response(function() {
						response.getStatus().should.equal(200);
						response.getData().forEach(function(currentSensor) {
							if (currentSensor._id === 'undo') {
								currentSensor.values[0].dayAgo.should.equal(0);
								currentSensor.values[0].value.should.equal(5);
								done();
							}
						});
					});

					var req = {};
					req.params = req.query = {};
					routes.aggregate.call('last30', req, response);
				});
			});

			it('should count the right amount for event called \'undo\' when called for last30 with user filter', function(done) {
				helpers.insertEvents(5, 5, function() {
					var response = new Response(function() {
						response.getStatus().should.equal(200);
						response.getData().forEach(function(currentSensor) {
							if (currentSensor._id === 'undo') {
								should.exist(currentSensor.values[0].user);
								should.exist(currentSensor.values[0].value);
								done();
							}
						});
					});

					var req = {};
					req.params = req.query = {};
					routes.aggregate.call('last30/user', req, response);
				});
			});

			it('should count the right amount for event called \'undo\' when called for last30 with app filter', function(done) {
				helpers.insertEvents(5, 5, function() {
					var response = new Response(function() {
						response.getStatus().should.equal(200);
						response.getData().forEach(function(currentSensor) {
							if (currentSensor._id === 'undo') {
								should.exist(currentSensor.values[0].app);
								should.exist(currentSensor.values[0].value);
								done();
							}
						});
					});

					var req = {};
					req.params = req.query = {};
					routes.aggregate.call('last30/app', req, response);
				});
			});
		});

	});

});
