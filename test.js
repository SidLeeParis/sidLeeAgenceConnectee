'use strict';
var mongoose = require('mongoose'),
	moment = require('moment'),
	async = require('async'),
	Event = require('./src/models/eventModel'),
	conf = require('./src/conf/conf'),
	agg = require('./src/routes/aggregateHelper');

// connect to mongo
mongoose.connect(conf.MONGO_URL);
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'Connection error:'));
db.once('open', function() {
	console.log('connected to mongo');

	var event = {
		name: 'red',
		value: 1,
		unit: 'goal'
	};

	var events = [];
	var i;
	for(i=0; i<32; i++) {
		var day = 28 + i;
		var month = 11;
		var year = 2014;
		if(day > 31) {
			month = 0;
			year = 2015;
		}
		var myDate = moment().utc().date(day).month(month).year(year).hour(4).toDate();
		event.date = myDate;
		console.log(myDate);
		var curr = new Event(event);
		events.push(curr);
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
			process.exit();
		}
	);

	//event.save(function(err) {
		// agg.last30({ name: 'red' }, function(err, data) {
		// 	//console.log(JSON.stringify(data));
		// 	data.forEach(function(current) {
		// 		current.values.forEach(function(value) {
		// 			var currentDate = moment().utc().startOf('day').date(value.day).month(value.month - 1).year(value.year);
		// 			console.log('===============');
		// 			console.log(currentDate.toDate());
		// 			var v = moment().utc().startOf('day');
		// 			var diff = v.diff(currentDate, 'd')
		// 			console.log(diff);
		// 			console.log('===============');
		// 			delete value.day;
		// 			delete value.month;
		// 			delete value.year;
		// 			value.dayAgo = diff;
		// 		});
		// 	});
		// 	console.log(JSON.stringify(data));


		// 	process.exit();
		// });
		// process.exit();
	//});

});
