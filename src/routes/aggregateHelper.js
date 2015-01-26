'use strict';
var moment = require('moment'),
	SensorsConf = require('../conf/sensorsConf'),
	Event = require('../models/eventModel');

// function to aggregate today values of a given sensor, according to its strategy
var today = function(sensorConf, callback) {
	// get the current date (beginning of the day: 0h00m00s000ms)
	var today = moment().startOf('day').toDate();

	var aggregate = Event.aggregate();
	if (sensorConf) {
		// match events from date and with the given name
		aggregate.match({ date: { $gte : today }, name: sensorConf.name });
	}
	else {
		// match events from date
		aggregate.match({ date: { $gte : today } });
	}
	// sort them by date
	aggregate.sort('-date');
	// group by name and calculate sum and avg, and last date, user and app
	aggregate.group({
		_id: '$name',
		avg: { $avg: '$value' },
		sum: { $sum: '$value' },
		date: { $first: '$date' },
		user: { $first: '$user' },
		app: { $first: '$app' }
	});
	// make a condition to calculate the sum or the avg according to the sensor name
	aggregate.project({
		_id: 1,
		value: {
			$cond: [
				{ $or: [
					{ $eq: [ '$_id', 'watt' ] },
					{ $eq: [ '$_id', 'sound' ] },
					{ $eq: [ '$_id', 'degrees' ] },
					{ $eq: [ '$_id', 'light' ] },
					{ $eq: [ '$_id', 'devices' ] }
				]},
				'$avg',
				'$sum'
			]
		},
		last: { $cond: [ { $eq: [ '$_id', 'undo' ] }, '$date', 0 ] },
		user: { $cond: [ { $eq: [ '$_id', 'undo' ] }, '$user', 0 ] },
		app: { $cond: [ { $eq: [ '$_id', 'undo' ] }, '$app', 0 ] }
	});
	// if it's devices, we need to return an integer average value
	aggregate.project({
		_id: 1,
		value: {
			$cond: [
				{ $eq: [ '$_id', 'devices' ] },
				{ $subtract: [ '$value' , { $mod: [ '$value', 1 ] } ] },
				'$value'
			]
		},
		last: 1,
		user: 1,
		app: 1
	});
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
	if (sensorConf) {
		// match events from date and with the given name
		aggregate.match({
			date: { $gte : yesterday },
			name: sensorConf.name
		});
	}
	else {
		// match events from date
		aggregate.match({
			date: { $gte : yesterday }
		});
	}
	// only keep the hour part of the date, since we know all matched events happened during the last 24h
	aggregate.project({
		name: 1,
		value: 1,
		hour : {'$hour' : '$date'}
	});
	// get sum and avg for each name/hour tuple
	aggregate.group({
		_id: { name: '$name', hour: '$hour' },
		sum: { $sum: '$value' },
		avg: { $avg: '$value' }
	});
	// make a condition to calculate the sum or the avg according to the sensor name
	aggregate.project({
		_id: 1,
		value: {
			$cond: [
				{ $or: [
					{ $eq: [ '$_id.name', 'watt' ] },
					{ $eq: [ '$_id.name', 'sound' ] },
					{ $eq: [ '$_id.name', 'degrees' ] },
					{ $eq: [ '$_id.name', 'light' ] },
					{ $eq: [ '$_id.name', 'devices' ] }
				]},
				'$avg',
				'$sum'
			]
		}
	});
	// if it's devices, we need to return an integer average value
	aggregate.project({
		_id: 1,
		value: {
			$cond: [
				{ $eq: [ '$_id.name', 'devices' ] },
				{ $subtract: [ '$value' , { $mod: [ '$value', 1 ] } ] },
				'$value'
			]
		}
	});
	// re-arrange data
	// calculate hour ago, instead of the plain hour
	// first subtract the hour returned by the query to the current hour
	aggregate.project({
		_id: '$_id.name',
		values: {
			hour: { $subtract: [ currentHour, '$_id.hour' ] },
			value : '$value'
		}
	});
	// then if the result of the subtraction is negative, it means it's an hour of the day ago
	// if so remove 24h, else leave the hour as is
	aggregate.project({
		_id: '$_id',
		values: {
			hourAgo: {
				$cond: [
					{ $lt: [ '$values.hour', 0 ] },
					{ $add: ['$values.hour', 24] },
					'$values.hour'
				]
			},
			value : '$values.value'
		}
	});
	// sort the result by ascending values.hourAgo
	aggregate.sort('values.hourAgo');
	// then push each values in an array
	aggregate.group({
		_id: '$_id',
		values: {
			$push: {
				hourAgo: '$values.hourAgo',
				value: '$values.value'
			}
		}
	});
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
	if (sensorConf) {
		// match events from date and with the given name
		aggregate.match({
			date: { $gte: oneMonthAgo },
			name: sensorConf.name
		});
	}
	else {
		// match events from date
		aggregate.match({
			date: { $gte: oneMonthAgo }
		});
	}
	// only keep the hour part of the date, since we know all matched events happened during the last 24h
	aggregate.project({
		name: 1,
		value: 1,
		day: { '$dayOfMonth': '$date' }
	});
	// get sum and avg for each name/hour tuple
	aggregate.group({
		_id: { name: '$name', day: '$day' },
		sum: { $sum: '$value' },
		avg: { $avg: '$value' }
	});
	// make a condition to calculate the sum or the avg according to the sensor name
	aggregate.project({
		_id: 1,
		value: {
			$cond: [
				{ $or: [
					{ $eq: [ '$_id.name', 'watt' ] },
					{ $eq: [ '$_id.name', 'sound' ] },
					{ $eq: [ '$_id.name', 'degrees' ] },
					{ $eq: [ '$_id.name', 'light' ] },
					{ $eq: [ '$_id.name', 'devices' ] }
				]},
				'$avg',
				'$sum'
			]
		}
	});
	// if it's devices, we need to return an integer average value
	aggregate.project({
		_id: 1,
		value: {
			$cond: [
				{ $eq: [ '$_id.name', 'devices' ] },
				{ $subtract: [ '$value' , { $mod: [ '$value', 1 ] } ] },
				'$value'
			]
		}
	});
	// re-arrange data
	// calculate day ago instead of plain day
	// first subtract the day returned by the query to the current day
	aggregate.project({
		_id: '$_id.name',
		values: {
			day: { $subtract: [ currentDay, '$_id.day' ] },
			value : '$value'
		}
	});
	// then if the result of the subtraction is less than 1, it means it's a day before the beginning of the current month
	// if so subtract it to the currentDay, else leave the day as is
	aggregate.project({
		_id: '$_id',
		values: {
			dayAgo: {
				$cond: [
					{ $lt: [ '$values.day', 0 ] },
					{ $subtract: [ currentDay - 1, '$values.day' ] },
					'$values.day'
				]
			},
			value : '$values.value'
		}
	});
	// sort the result by ascending values.dayAgo
	aggregate.sort('values.dayAgo');
	// then push each values in an array
	aggregate.group({
		_id: '$_id',
		values: {
			$push: {
				dayAgo: '$values.dayAgo',
				value: '$values.value'
			}
		}
	});
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
	aggregate.match({ date: { $gte : date }, name: 'undo' });
	// group by user, or by app
	if (this.groupBy === 'user') {
		aggregate.group({ _id: '$user', value: { $sum: '$value' } });
		aggregate.group({ _id: 'undo', values: { $push: { user: '$_id', value: '$value' } } });
	}
	else {
		aggregate.group({ _id: '$app', value: { $sum: '$value' } });
		aggregate.group({ _id: 'undo', values: { $push: { app: '$_id', value: '$value' } } });
	}
	aggregate.exec(callback);
};

module.exports = {
	today: today,
	last24: last24,
	last30 : last30,
	undo: undo
};
