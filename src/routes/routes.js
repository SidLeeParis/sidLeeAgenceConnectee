'use strict';
var async = require('async'),
	helper = require('./aggregateHelper');

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
			unit: req.body.unit,
			app: req.body.app,
			user: req.body.user,
			trackerVersion: req.body.trackerVersion
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
		// functions that share the same englobing logic
		var functionToUse;
		switch (this) {
			case 'today' : functionToUse = helper.today; break;
			case 'last24' : functionToUse = helper.last24; break;
			case 'last30' : functionToUse = helper.last30; break;
			case 'last24/user' : functionToUse = helper.ctrlz.bind({ groupBy: 'user', dateRange: 'last24' }); break;
			case 'last24/app' : functionToUse = helper.ctrlz.bind({ groupBy: 'app', dateRange: 'last24' }); break;
			case 'last30/user' : functionToUse = helper.ctrlz.bind({ groupBy: 'user', dateRange: 'last30' }); break;
			case 'last30/app' : functionToUse = helper.ctrlz.bind({ groupBy: 'app', dateRange: 'last30' }); break;
		}

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
