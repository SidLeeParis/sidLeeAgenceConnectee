'use strict';
var Event = require('../models/eventModel');

// function to aggregate today values of a given sensor, according to its strategy
var today = function(sensorConf, callback) {
	// get the current date (beginning of the day: 0h00m00s000ms)
	var today = new Date();
	today.setHours(0,0,0,0);

	var aggregate = Event.aggregate();
	// match events from date and with the given name
	aggregate.match({ date: { $gte : today }, name: sensorConf.name });
	// group these events in order to sum/average the sensed values
	// according to the sensor strategy
	// ctrlz is a special case where most recent event is needed (date + user + app)
	if (sensorConf.name === 'ctrlz') {
		// sort by desc date (the first will be the most recent ctrlz)
		aggregate.sort('-date');
		// group by name, sum the values, and keep first date and first user
		// since ctrlz are sorted, it means the most recent ctrlz is the first one
		aggregate.group({ _id: '$name', value: { $sum: '$value' }, last: { $first: '$date' }, user: { $first: '$user' }, app: { $first: '$app' } });
	}
	else if (sensorConf.sum) {
		aggregate.group({ _id: '$name', value: { $sum: '$value' } });
	}
	else {
		aggregate.group({ _id: '$name', value: { $avg: '$value' } });
	}
	aggregate.exec(callback);
};

// function to aggregate values of the last 24h of a given sensor, according to its strategy
var last24 = function(sensorConf, callback) {
	// get yesterday date (now minus 24h)
	var yesterday = new Date();
	yesterday.setHours(yesterday.getHours() - 24);

	var aggregate = Event.aggregate();
	// match events from date and with the given name
	aggregate.match({ date: { $gte : yesterday }, name: sensorConf.name });
	// only keep the hour part of the date, since we now all matched events happened during the last 24h
	aggregate.project({ name: 1, value: 1, hour : {'$hour' : '$date'} });
	// group these events in order to sum/average the sensed values
	// according to the sensor strategy
	if (sensorConf.sum) {
		aggregate.group({ _id: { name: '$name', hour: '$hour' }, value: { $sum: '$value' } });
	}
	else {
		aggregate.group({ _id: { name: '$name', hour: '$hour' }, value: { $avg: '$value' } });
	}
	// re-arrange data
	aggregate.project({ _id: '$_id.name', values: { hour: '$_id.hour', value : '$value' } });
	// then push each values in an array
	aggregate.group({ _id: '$_id', values: { $push:  { hour: '$values.hour', value: '$values.value' } } });
	aggregate.exec(callback);
};

// function to aggregate values of the last month of a given sensor, according to its strategy
var last31 = function(sensorConf, callback) {
	// get a month ago date (same day, same time, but the month ago)
	// get the date one month ago
	var oneMonthAgo = new Date();
	var previousMonth = oneMonthAgo.getMonth() - 1;
	if (previousMonth < 0) {
		previousMonth += 12;
		oneMonthAgo.setFullYear(oneMonthAgo.getFullYear() - 1);
	}
	oneMonthAgo.setMonth(previousMonth);

	var aggregate = Event.aggregate();
	// match events from date and with the given name
	aggregate.match({ date: { $gte : oneMonthAgo }, name: sensorConf.name });
	// only keep the hour part of the date, since we now all matched events happened during the last 24h
	aggregate.project({ name: 1, value: 1, day : {'$dayOfMonth' : '$date'} });
	// group these events in order to sum/average the sensed values
	// according to the sensor strategy
	if (sensorConf.sum) {
		aggregate.group({ _id: { name: '$name', day: '$day' }, value: { $sum: '$value' } });
	}
	else {
		aggregate.group({ _id: { name: '$name', day: '$day' }, value: { $avg: '$value' } });
	}
	// re-arrange data
	aggregate.project({ _id: '$_id.name', values: { day: '$_id.day', value : '$value' } });
	// then push each values in an array
	aggregate.group({ _id: '$_id', values: { $push:  { day: '$values.day', value: '$values.value' } } });
	aggregate.exec(callback);
};

// function to aggregate today values of a given sensor, according to its strategy
var ctrlz = function(sensorConf, callback) {
	var date = new Date();
	if (this.dateRange === 'last24') {
		// get yesterday date (now minus 24h)
		date.setHours(date.getHours() - 24);
	}
	else {
		// get a month ago date (same day, same time, but the month ago)
		var previousMonth = date.getMonth() - 1;
		if (previousMonth < 0) {
			previousMonth += 12;
			date.setFullYear(date.getFullYear() - 1);
		}
		date.setMonth(previousMonth);
	}

	var aggregate = Event.aggregate();
	// match events from date and with the given name
	aggregate.match({ date: { $gte : date }, name: sensorConf.name });
	// group by user, or by app
	if (this.groupBy === 'user') {
		aggregate.group({ _id: '$user', value: { $sum: '$value' } });
		aggregate.group({ _id: sensorConf.name, values: { $push:  { user: '$_id', value: '$value' } } });
	}
	else {
		aggregate.group({ _id: '$app', value: { $sum: '$value' } });
		aggregate.group({ _id: sensorConf.name, values: { $push:  { app: '$_id', value: '$value' } } });
	}
	aggregate.exec(callback);
};

module.exports = {
	today: today,
	last24: last24,
	last31 : last31,
	ctrlz: ctrlz
};
