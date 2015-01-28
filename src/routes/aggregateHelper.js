'use strict';
var moment = require('moment'),
	SensorsConf = require('../conf/sensorsConf'),
	Event = require('../models/eventModel');

// function to aggregate today values of a given sensor, according to its strategy
var today = function(sensorConf, callback) {
	// get the current date
	// if it is less than 5h utc, set the day as the day before
	// else keep the current day
	var currentTime = moment().utc();
	var today;
	if (currentTime.hour() < 5) {
		currentTime = currentTime.subtract(1, 'd');
	}
	today = currentTime.startOf('day').add(5,'h').toDate();

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
	var current = moment().utc();
	var currentHour = current.hour();
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
		hour : { $hour: '$date'}
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
	// begining of the day when the request has been done
	var today = moment().utc().startOf('day');
	// get 30 days before date (starting at 5h utc)
	var oneMonthAgo = moment().utc().startOf('day').subtract(30, 'd').add(5, 'h').toDate();

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
	// only keep the day and hour part of the date, since we know all matched events happened during the last 24h
	aggregate.project({
		name: 1,
		value: 1,
		year: { $year: '$date' },
		month: { $month: '$date' },
		day: { $dayOfMonth: '$date' },
		hour: { $hour: '$date' }
	});
	// if hour < 5, then it should be considered as the day before
	aggregate.project({
		name: 1,
		value: 1,
		year: 1,
		month: 1,
		day: {
			$cond: [
				{ $lt: [ '$hour', 5 ] },
				{ $subtract: [ '$day', 1 ]},
				'$day'
			]
		}
	});
	// if day equals 0, replace it by the according last day of previous month
	aggregate.project({
		name: 1,
		value: 1,
		year: 1,
		month: {
			$cond: [
				{ $eq: [ '$day', 0 ] },
				{ $subtract: [ '$month', 1 ]},
				'$month'
			]
		},
		day: {
			$cond: [
				{ $eq: [ '$day', 0 ] },
				{
					$cond: [
						{ $or: [
							{ $eq: [ '$month', 1 ] },
							{ $eq: [ '$month', 2 ] },
							{ $eq: [ '$month', 4 ] },
							{ $eq: [ '$month', 6 ] },
							{ $eq: [ '$month', 8 ] },
							{ $eq: [ '$month', 9 ] },
							{ $eq: [ '$month', 11 ] }
						]},
						31,
						{
							$cond: [
								{ $eq: [ '$month', 3 ] },
								28,
								30
							]
						}
					]
				},
				'$day'
			]
		}
	});
	// if month equals 0, make it point to the last month of the previous year and remove 1 to the current year
	aggregate.project({
		name: 1,
		value: 1,
		year: {
			$cond: [
				{ $eq: [ '$month', 0 ] },
				{ $subtract: [ '$year', 1 ]},
				'$year'
			]
		},
		month: {
			$cond: [
				{ $lt: [ '$month', 1 ] },
				{ $add: [ '$month', 12 ]},
				'$month'
			]
		},
		day: 1
	});

	// get sum and avg for each name/hour/month/year combination
	aggregate.group({
		_id: { name: '$name', day: '$day', month: '$month', year: '$year' },
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
			day: '$_id.day',
			month: '$_id.month',
			year: '$_id.year',
			value : '$value'
		}
	});
	// sort the result by dates (newest first)
	aggregate.sort('-values.year -values.month -values.day');
	// then push each values in an array
	aggregate.group({
		_id: '$_id',
		values: {
			$push: {
				day: '$values.day',
				month: '$values.month',
				year: '$values.year',
				value: '$values.value'
			}
		}
	});
	aggregate.exec(function(err, events) {
		// for each events, replace the triple year/month/date by a dayAgo property
		events.forEach(function(event) {
			event.values.forEach(function(value) {
				var computedDate = moment().utc().startOf('day').date(value.day).month(value.month - 1).year(value.year);
				var diff = today.diff(computedDate, 'd');
				delete value.day;
				delete value.month;
				delete value.year;
				value.dayAgo = diff;
			});
		});
		callback(err, events);
	});
};

// function to aggregate values of the last year of a given sensor, according to its strategy
var last12 = function(sensorConf, callback) {
	// get current day in order to make some relatie calculations
	var current = moment();
	// months in js go from 0 to 11, in mongo from 1 to 12, so add 1 to match mongo
	var currentMonth = current.utc().month() + 1;
	// get a year ago date
	var oneYearAgo = current.startOf('month').add(1, 'M').subtract(1, 'y').toDate();

	var aggregate = Event.aggregate();
	if (sensorConf) {
		// match events from date and with the given name
		aggregate.match({
			date: { $gte: oneYearAgo },
			name: sensorConf.name
		});
	}
	else {
		// match events from date
		aggregate.match({
			date: { $gte: oneYearAgo }
		});
	}
	// only keep the month part of the date
	aggregate.project({
		name: 1,
		value: 1,
		month: { '$month': '$date' }
	});
	// get sum and avg for each name/month tuple
	aggregate.group({
		_id: { name: '$name', month: '$month' },
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
	// calculate month ago instead of plain month
	// first subtract the month returned by the query to the current month
	aggregate.project({
		_id: '$_id.name',
		values: {
			month: { $subtract: [ currentMonth, '$_id.month' ] },
			value : '$value'
		}
	});
	// then if the result of the subtraction is less than 0, it means it's a month before the beginning of the current year
	// if so do (currentMonth - $values.month) + 12, else do currentMonth - $values.month
	// example: if currentMonth is April (4), and $values.month = October (10)
	// (4 - 10) + 12 = 6, October is 6 month before April
	aggregate.project({
		_id: '$_id',
		values: {
			monthAgo: {
				$cond: [
					{ $lt: [ '$values.month', 0 ] },
					{ $add: [ '$values.month', 12 ] },
					'$values.month'
				]
			},
			value : '$values.value'
		}
	});
	// sort the result by ascending values.monthAgo
	aggregate.sort('values.monthAgo');
	// then push each values in an array
	aggregate.group({
		_id: '$_id',
		values: {
			$push: {
				monthAgo: '$values.monthAgo',
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
	aggregate.match({
		date: { $gte : date },
		name: 'undo'
	});
	// group by user, or by app
	if (this.groupBy === 'user') {
		aggregate.group({
			_id: '$user',
			value: { $sum: '$value' }
		});
		aggregate.group({
			_id: 'undo',
			values: {
				$push: {
					user: '$_id',
					value: '$value'
				}
			}
		});
	}
	else {
		aggregate.group({
			_id: '$app',
			value: { $sum: '$value' }
		});
		aggregate.group({
			_id: 'undo',
			values: {
				$push: {
					app: '$_id',
					value: '$value'
				}
			}
		});
	}
	aggregate.exec(callback);
};

module.exports = {
	today: today,
	last24: last24,
	last30 : last30,
	last12: last12,
	undo: undo
};
