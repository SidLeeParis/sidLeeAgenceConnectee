'use strict';
var conf = require('../src/conf/conf'),
	mongoose = require('mongoose'),
	Event = require('../src/models/eventModel');

// clean collection before each test
beforeEach(function (done) {
	mongoose.connect(conf.MONGO_TEST_URL);
	var db = mongoose.connection;
	db.once('open', function() {
		// clear collection
		Event.remove(function(err) {
			if (err) throw err;
			done();
		});
	});
});

// close db connection after each test
afterEach(function (done) {
	mongoose.disconnect();
	done();
});
