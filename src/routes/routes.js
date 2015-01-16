'use strict';
var async = require('async');

/**
 * Routes of the API
 * @class Routes
 * @constructor
 * @module routes
 * @param sockets - all connected websocket clients
 * @param Event - the Event model to store in db
 */
var Routes = function(sockets, Event, SensorsConf) {

	var _create = function(req, res) {
		// get posted data
		var postData = {
			name: req.body.name,
			date: new Date(),
			value: req.body.value,
			unit: req.body.unit
		};
		// create event to store in mongo
		var event = new Event(postData);
		// save it and when saved, broadcast its creation to all connected websockets
		event.save(function (err) {
			if (err) throw err;
			sockets.emit('event', postData);
			res.status(201).send();
		});
	};

	var _find = function(req, res) {
		var filter = {};
		if (req.params.name) filter.name = req.params.name;
		var dateFilter = {};
		if (req.query.fromDate) {
			var fromDate = new Date(req.query.fromDate);
			if (isValidDate(fromDate)) {
				dateFilter.$gte = fromDate.setHours(0,0,0,0);
			}
		}
		if (req.query.toDate) {
			var toDate = new Date(req.query.toDate);
			if (isValidDate(toDate)) {
				dateFilter.$lte = toDate.setHours(23,59,59,999);
			}
		}
		if (dateFilter.$gte || dateFilter.$lte) {
			filter.date = dateFilter;
		}
		var query = Event.find(filter);
		if (req.query.limit) query.limit(req.query.limit);
		if (!req.query.oldestFirst) query.sort('-date');
		query.exec(function (err, events) {
			if (err) throw err;
			res.status(200).send(events);
		});
	};

	var _aggregate = function(req, res) {
		// 'this' was binded in app.js, it permits to switch between the differents
		// function that share the same englobing logic
		var functionToUse;
		switch (this) {
			case 'today' : functionToUse = aggregateForToday; break;
			case 'last24' : functionToUse = aggregateForLast24h; break;
			case 'last31' : functionToUse = aggregateForLast31d; break;
		};

		var name = '';
		if (req.params.name) name = req.params.name;
		var sensorConf = SensorsConf[name];

		// a sensor name is provided, only query this one
		if (sensorConf) {
			functionToUse(sensorConf, function(err, data) {
				res.status(200).send(data[0]);
			});
		}
		// else query all sensors
		else {
			var aggregationResult = [];
			var allSensors = Object.keys(SensorsConf);
			async.each(
				allSensors,
				function(sensor, callback) {
					functionToUse(SensorsConf[sensor], function(err, data) {
						if (data.length) aggregationResult.push(data[0]);
						callback();
					});
				},
				function(err){
					res.status(200).send(aggregationResult);
				}
			);
		}
	};

	// function to aggregate today values of a given sensor, according to its strategy
	var aggregateForToday = function(sensorConf, callback) {
		// get the current date (beginning of the day: 0h00m00s000ms)
		var today = new Date();
		today.setHours(0,0,0,0);

		var aggregate = Event.aggregate();
		// match events from date and with the given name
		aggregate.match({ date: { $gte : today }, name: sensorConf.name });
		// group these events in order to sum/average the sensed values
		// according to the sensor strategy
		if (sensorConf.sum) {
			aggregate.group({ _id: '$name', value: { $sum: '$value' } });
		}
		else {
			aggregate.group({ _id: '$name', value: { $avg: '$value' } });
		}
		aggregate.exec(callback);
	};

	// function to aggregate values of the last 24h of a given sensor, according to its strategy
	var aggregateForLast24h = function(sensorConf, callback) {
		// get yesterday date (now minus 24h)
		var yesterday = new Date();
		yesterday.setHours(yesterday.getHours() - 24);

		var aggregate = Event.aggregate();
		// match events from date and with the given name
		aggregate.match({ date: { $gte : yesterday }, name: sensorConf.name })
		// only keep the hour part of the date, since we now all matched events happened during the last 24h
		aggregate.project({ name: 1, value: 1, hour : {'$hour' : '$date'} })
		// group these events in order to sum/average the sensed values
		// according to the sensor strategy
		if (sensorConf.sum) {
			aggregate.group({ _id: { name: '$name', hour: '$hour' }, value: { $sum: '$value' } })
		}
		else {
			aggregate.group({ _id: { name: '$name', hour: '$hour' }, value: { $avg: '$value' } })
		}
		// re-arrange data
		aggregate.project({ _id: '$_id.name', values: { hour: '$_id.hour', value : '$value' } })
		// then push each values in an array
		aggregate.group({ _id: '$_id', values: { $push:  { hour: '$values.hour', value: '$values.value' } } })
		aggregate.exec(callback);
	};

	// function to aggregate values of the last month of a given sensor, according to its strategy
	var aggregateForLast31d = function(sensorConf, callback) {
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
		aggregate.match({ date: { $gte : oneMonthAgo }, name: sensorConf.name })
		// only keep the hour part of the date, since we now all matched events happened during the last 24h
		aggregate.project({ name: 1, value: 1, day : {'$dayOfMonth' : '$date'} })
		// group these events in order to sum/average the sensed values
		// according to the sensor strategy
		if (sensorConf.sum) {
			aggregate.group({ _id: { name: '$name', day: '$day' }, value: { $sum: '$value' } })
		}
		else {
			aggregate.group({ _id: { name: '$name', day: '$day' }, value: { $avg: '$value' } })
		}
		// re-arrange data
		aggregate.project({ _id: '$_id.name', values: { day: '$_id.day', value : '$value' } })
		// then push each values in an array
		aggregate.group({ _id: '$_id', values: { $push:  { day: '$values.day', value: '$values.value' } } })
		aggregate.exec(callback);
	};

	var isValidDate = function(date) {
		if (Object.prototype.toString.call(date) !== "[object Date]" ) {
			return false;
		}
		else {
			return !isNaN(date.getTime());
		}
	};

	return {
		create : _create,
		find: _find,
		aggregate: _aggregate
	};
};

module.exports = Routes;
