'use strict';
/*jshint expr: true*/
var should = require('chai').should(),
	sinon = require('sinon'),
	io = require('socket.io'),
	Response = require('../mocks/response.mock'),
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
		data.type.should.equal(dummyType);
	}
};

var Event = function(data) {
	this.save = function(callback) {
		callback();
	};
};
var routes = new Routes(sockets, Event);

describe('Routes', function() {

	describe('#create()', function() {
		it('should create an event', function() {
			var response = new Response();
			var req = { body: {} };
			req.body.name = dummyName;
			req.body.value = dummyValue;
			req.body.type = dummyType;

			routes.create(req, response);
			response.getStatus().should.equal(201);
			should.not.exist(response.getData());
		});
	});

});
