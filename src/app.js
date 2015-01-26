'use strict';
var express = require('express'),
	app = express(),
	server = require('http').Server(app),
	io = require('socket.io')(server),
	bodyParser = require('body-parser'),
	cors = require('cors'),
	compression = require('compression'),
	mongoose = require('mongoose'),
	CronJob = require('cron').CronJob,
	moment = require('moment'),
	Event = require('./models/eventModel'),
	Routes = require('./routes/routes'),
	conf = require('./conf/conf'),
	getLikes = require('./misc/facebookLikes'),
	getVisits = require('./misc/googleAnalyticsVisits'),
	postFridgeDegrees = require('./misc/fridgeDegrees'),
	SensorsConf = require('./conf/sensorsConf');

// connect to mongo
mongoose.connect(conf.MONGO_URL);
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'Connection error:'));
db.once('open', function() {
	console.log('Connected to mongo');
});

// app conf
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
	extended: true
}));
app.use(compression());
// development only : set a NODE_ENV=development env variable on your dev machine
// or run with NODE_ENV=development node app.js
// production only : run with NODE_ENV=production node app.js
var env = process.env.NODE_ENV || 'development';
if (env === 'development') {
	app.use(express.static(__dirname + '/../public'));
	app.use('/bower_components', express.static(__dirname + '/../bower_components'));
} else if (env === 'production') {
	app.use(express.static(__dirname + '/../dist'));
}

// routes configuration
var routes = new Routes(io.sockets, Event, SensorsConf),
	router = express.Router();
app.use(conf.API_PREFIX, router);
router.post('/event', routes.create);
// the bind function permits to specify what will be the 'this' in the context of the function
router.get('/event/today/:name?', routes.aggregate.bind('today'));
router.get('/event/last24/:name?', routes.aggregate.bind('last24'));
router.get('/event/last24/:name?/user', routes.aggregate.bind('last24/user'));
router.get('/event/last24/:name?/app', routes.aggregate.bind('last24/app'));
router.get('/event/last30/:name?', routes.aggregate.bind('last30'));
router.get('/event/last30/:name?/user', routes.aggregate.bind('last30/user'));
router.get('/event/last30/:name?/app', routes.aggregate.bind('last30/app'));
router.get('/event/:name?', routes.find);

// cron configuration
// remove events that are one month old every day at 0h05
// except for the tracer paper printer
new CronJob('5 0 * * *', function(){
	console.log('Removing events older than a month');
	var oneMonthAgo = moment().startOf('day').subtract(1, 'M').toDate();
	Event.remove({ name: { $ne: SensorsConf.tracer.name }, date : { $lt : oneMonthAgo } }).exec(function(err) {
		console.log('Done removing old events');
	});
}, null, true, 'Europe/Paris');

// query facebook graph to get likes, every minutes
var previousLikes = 0;
new CronJob('* * * * *', function(){
	getLikes(function(err, likes) {
		// only send data if changed
		if (likes.value !== previousLikes) {
			// update previous likes
			previousLikes = likes.value;
			// construct data
			var data = {
				_id: likes._id,
				date: new Date(),
				value: likes.value,
				unit: 'likes'
			};
			io.sockets.emit('event', data);
		}
	});
}, null, true, 'Europe/Paris');

// query google analytics to get visits, every minutes
var previousVisits = -1;
new CronJob('* * * * *', function(){
	getVisits(function(err, visits) {
		// only send data if changed
		if (visits.value !== previousVisits) {
			// update previous visits
			previousVisits = visits.value;
			// construct data
			var data = {
				_id: visits._id,
				date: new Date(),
				value: visits.value,
				unit: 'visits'
			};
			io.sockets.emit('event', data);
		}
	});
}, null, true, 'Europe/Paris');

// post fake fridge degrees, every minutes
new CronJob('* * * * *', function() {
	postFridgeDegrees();
}, null, true, 'Europe/Paris');

// websocket configuration
io.on('connection', function (socket) {
	console.log('client connected');
});

// start the server
server.listen(conf.PORT, function () {
	var host = server.address().address;
	var port = server.address().port;
	console.log('Sid Lee x Agence Connectée listening at http://'+ host + ':' + port);
});

