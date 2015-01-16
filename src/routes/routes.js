'use strict';

/**
 * Routes of the API
 * @class Routes
 * @constructor
 * @module routes
 * @param sockets - all connected websocket clients
 * @param Event - the Event model to store in db
 */
var Routes = function(sockets, Event) {

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
		find: _find
	};
};

module.exports = Routes;
