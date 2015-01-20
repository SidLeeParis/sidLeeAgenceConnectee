'use strict';
var moment = require('moment'),
	Event = require('../models/eventModel');

// function to aggregate today values of a given sensor, according to its strategy
var today = function(sensorConf, callback) {
	// get the current date (beginning of the day: 0h00m00s000ms)
	var today = moment().startOf('day').toDate();

	var aggregate = Event.aggregate();
	// match events from date and with the given name
	aggregate.match({ date: { $gte : today }, name: sensorConf.name });
	// group these events in order to sum/average the sensed values
	// according to the sensor strategy
	// undo is a special case where most recent event is needed (date + user + app)
	if (sensorConf.name === 'undo') {
		// sort by desc date (the first will be the most recent undo)
		aggregate.sort('-date');
		// group by name, sum the values, and keep first date and first user
		// since undo are sorted, it means the most recent undo is the first one
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
	// get current hour in order to make some relative calculations
	var current = moment();
	var currentHour = current.utc().hour();
	// get yesterday date (from h-23 to h+1 to get the running hour, e.g. from 2h yesterday to 2h today when it's 1h)
	var yesterday = current.startOf('hour').add(1, 'h').subtract(24, 'h').toDate();

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
	// calculate hour ago, instead of the plain hour
	// first subtract the hour returned by the query to the current hour
	aggregate.project({ _id: '$_id.name', values: { hour: { $subtract: [ currentHour, '$_id.hour' ] }, value : '$value' } });
	// then if the result of the subtraction is negative, it means it's an hour of the day ago
	// if so remove 24h, else leave the hour as is
	aggregate.project({ _id: '$_id', values: { hourAgo: { $cond: [ { $lt: [ '$values.hour', 0 ] }, { $add: ['$values.hour', 24] }, '$values.hour' ] }, value : '$values.value' } });
	// sort the result by ascending values.hourAgo
	aggregate.sort('values.hourAgo');
	// then push each values in an array
	aggregate.group({ _id: '$_id', values: { $push:  { hourAgo: '$values.hourAgo', value: '$values.value' } } });
	aggregate.exec(callback);
};

// function to aggregate values of the last month of a given sensor, according to its strategy
var last30 = function(sensorConf, callback) {
	// get current day in order to make some relatie calculations
	var current = moment();
	var currentDay = current.utc().date();
	// get a month ago date (from d+1/M-1 to d/M, e.g. from 19/12 to 18/01)
	var oneMonthAgo = current.startOf('day').add(1, 'd').subtract(1, 'M').toDate();

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
	// calculate day ago instead of plain day
	// first subtract the day returned by the query to the current day
	aggregate.project({ _id: '$_id.name', values: { day: { $subtract: [ currentDay, '$_id.day' ] }, value : '$value' } });
	// then if the result of the subtraction is less than 1, it means it's a day before the beginning of the current month
	// if so subtract it to the currentDay, else leave the day as is
	aggregate.project({ _id: '$_id', values: { dayAgo: { $cond: [ { $lt: [ '$values.day', 0 ] }, { $subtract: [currentDay - 1, '$values.day'] }, '$values.day' ] }, value : '$values.value' } });
	// sort the result by ascending values.dayAgo
	aggregate.sort('values.dayAgo');
	// then push each values in an array
	aggregate.group({ _id: '$_id', values: { $push:  { dayAgo: '$values.dayAgo', value: '$values.value' } } });
	aggregate.exec(callback);
};

// function to aggregate today values of a given sensor, according to its strategy
var undo = function(sensorConf, callback) {
	var date;
	if (this.dateRange === 'last24') {
		// get yesterday date (from h-23 to h+1 to get the running hour, e.g. from 2h yesterday to 2h today when it's 1h)
		date = moment().startOf('hour').add(1, 'h').subtract(24, 'h').toDate();
	}
	else {
		// get a month ago date (from d+1/M-1 to d/M, e.g. from 19/12 to 18/01)
		date = moment().startOf('day').add(1, 'd').subtract(1, 'M').toDate();
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
	last30 : last30,
	undo: undo
};
