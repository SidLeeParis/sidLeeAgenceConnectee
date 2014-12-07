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
			vale: Math.floor(Math.random() * 10),
			unit: 'dummyUnit'
		});
		events.push(event);
	}
	for (i = 0; i < countTwo; i++) {
		event = new Event({
			name: 'dummyName2',
			date: new Date(),
			vale: Math.floor(Math.random() * 10),
			unit: 'dummyUnit'
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
