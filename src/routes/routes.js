'use strict';
var async = require('async'),
	Conf = require('../conf/conf'),
	SensorsConf = require('../conf/sensorsConf'),
	getLikes = require('../misc/facebookLikes'),
	getVisits = require('../misc/googleAnalyticsVisits'),
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
		if (req.body.token === Conf.SENSOR_TOKEN ||
			(req.body.token === Conf.FRONTEND_TOKEN && req.body.name === SensorsConf.lightswitch.name)) {

			var value = req.body.value;
			// limit lightswitch values because of attacks
			if (req.body.name === SensorsConf.lightswitch.name) {
				value = Math.max(0, Math.min(50, value));
			}
			// get posted data
			var postData = {
				name: req.body.name,
				date: new Date(),
				value: value,
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
				postData._id = postData.name;
				delete postData.name;
				if (typeof postData.value === 'string') {
					if (postData.value.indexOf('.') > -1) {
						postData.value = parseFloat(postData.value);
					}
					else {
						postData.value = parseInt(postData.value);
					}
				}
				if (req.body.big) {
					postData.big = parseInt(req.body.big) === 1 ? true : false;
				}
				sockets.emit('event', postData);
				res.status(201).send();
			});
		}
		else {
			res.status(403).send({ error: 'Wrong token' });
		}
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
			case 'last12' : functionToUse = helper.last12; break;
			case 'last24/user' : functionToUse = helper.undo.bind({ groupBy: 'user', dateRange: 'last24' }); break;
			case 'last24/app' : functionToUse = helper.undo.bind({ groupBy: 'app', dateRange: 'last24' }); break;
			case 'last30/user' : functionToUse = helper.undo.bind({ groupBy: 'user', dateRange: 'last30' }); break;
			case 'last30/app' : functionToUse = helper.undo.bind({ groupBy: 'app', dateRange: 'last30' }); break;
		}

		var name = '';
		if (req.params.name) name = req.params.name;
		var sensorConf = SensorsConf[name];

		// a sensor name is provided, only query this one
		if (sensorConf) {
			if (sensorConf.name === 'likes') {
				getLikes(function(err, likes) {
					res.status(200).send(likes);
				});
			}
			else if (sensorConf.name === 'visits') {
				getVisits(function(err, visits) {
					res.status(200).send(visits);
				});
			}
			else {
				functionToUse(sensorConf, function(err, data) {
					if (data[0] && data[0]._id && data[0]._id !== 'undo') {
							delete data[0].app;
							delete data[0].user;
							delete data[0].last;
					}
					res.status(200).send(data[0] || { _id: sensorConf.name, values: [] });
				});
			}
		}
		// else query all sensors
		else {
			var aggregationResult = [];
			async.parallel([
					function(callback) {
						getVisits(function(err, visits) {
							if (!err) aggregationResult.push(visits);
							callback();
						});
					},
					function(callback) {
						getLikes(function(err, likes) {
							aggregationResult.push(likes);
							callback();
						});
					},
					function(callback) {
						functionToUse(null, function(err, data) {
							if (data.length) aggregationResult.push.apply(aggregationResult, data);
							callback();
						});
					}
				],
				function(err, results){
					aggregationResult.forEach(function(event) {
						if (event && event._id && event._id !== 'undo') {
							delete event.app;
							delete event.user;
							delete event.last;
						}
					});
					res.status(200).send(aggregationResult);
				}
			);
		}
	};

	var _tracer = function(req, res) {
		helper.tracer(function(err, data) {
			res.status(200).send(data);
		});
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
		aggregate: _aggregate,
		tracer: _tracer
	};
};

module.exports = Routes;
