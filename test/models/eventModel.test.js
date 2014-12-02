'use strict';
/*jshint expr: true*/
var should = require('chai').should(),
	Event = require('../../src/models/eventModel');

describe('Event', function() {

	describe('new Event()', function() {
		it('should not validate if there is no args', function(done) {
			var dummyEvent = new Event();
			dummyEvent.validate(function(err) {
				should.exist(err);
				done();
			});
		});
		it('should not validate if there is no name', function(done) {
			var dummyEvent = new Event({
				date: new Date()
			});
			dummyEvent.validate(function(err) {
				should.exist(err);
				done();
			});
		});
		it('should not validate if there is no date', function(done) {
			var dummyEvent = new Event({
				name: 'dummyName'
			});
			dummyEvent.validate(function(err) {
				should.exist(err);
				done();
			});
		});
		it('should validate and construct an Event object with the provided name and date', function(done) {
			var dummyDate = new Date();
			var dummyEvent = new Event({
				name: 'dummyName',
				date: dummyDate
			});
			dummyEvent.name.should.equal('dummyName');
			dummyEvent.date.should.equal(dummyDate);
			dummyEvent.validate(function(err) {
				should.not.exist(err);
				done();
			});
		});
	});
});
