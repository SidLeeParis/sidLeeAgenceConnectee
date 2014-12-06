'use strict';
var conf = require('../src/conf/conf'),
	mongoose = require('mongoose'),
	Event = require('../src/models/eventModel');

beforeEach(function (done) {
	var clearDB = function() {
		for (var i in mongoose.connection.collections) {
			mongoose.connection.collections[i].remove(function() {});
		}
	};

	if (mongoose.connection.readyState === 0) {
		mongoose.connect(conf.MONGO_TEST_URL, function (err) {
			if (err) throw err;
			clearDB();
		});
	}
	else {
		clearDB();
	}
	var event = new Event({
		name: 'dummyName',
		date: new Date(),
		value: 42,
		unit: '%'
	});
	event.save(function(err, data) {
		if (err) throw err;
		Event.find().exec(function (err, events) {
			if (err) throw err;
			done();
		});
	});
});

afterEach(function (done) {
	mongoose.disconnect();
	done();
});
