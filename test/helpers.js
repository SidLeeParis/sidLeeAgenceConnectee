'use strict';
var async = require('async'),
	Event = require('../src/models/eventModel');

module.exports.insertEvents = function(countOne, countTwo, callback) {
	var events = [],
		event;
	for (var i = 0; i < countOne; i++) {
		event = new Event({
			name: 'dummyName1',
			date: new Date(),
			value: Math.floor(Math.random() * 10),
			unit: 'dummyUnit'
		});
		events.push(event);
	}
	for (i = 0; i < countTwo; i++) {
		event = new Event({
			name: 'ctrlz',
			date: new Date(),
			value: 1,
			unit: 'ctrlz',
			user: 'user' + Math.floor(Math.random() * 10),
			app: 'app' + Math.floor(Math.random() * 10),
			trackerVersion: 'v' + Math.floor(Math.random() * 10)
		});
		events.push(event);
	}
	async.each(
		events,
		function(event, callback) {
			event.save(function(err) {
				if (err) throw err;
				callback();
			});
		},
		function(err) {
			callback();
		}
	);
};
