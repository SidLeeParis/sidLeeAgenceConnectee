'use strict';
var express = require('express'),
	app = express(),
	server = require('http').Server(app),
	io = require('socket.io')(server),
	bodyParser = require('body-parser'),
	mongoose = require('mongoose'),
	Event = require('./models/eventModel'),
	Routes = require('./routes/routes'),
	conf = require('./conf/conf');

// connect to mongo
mongoose.connect(conf.MONGO_URL);
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'Connection error:'));
db.once('open', function() {
	console.log('Connected to mongo');
});

// app conf
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
	extended: true
}));
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
var routes = new Routes(io.sockets, Event),
	router = express.Router();
app.use(conf.API_PREFIX, router);
router.post('/event', routes.create);
router.get('/event/:name?', routes.find);

// websocket configuration
io.on('connection', function (socket) {
	console.log('client connected');
});

// start the server
server.listen(3000, function () {
	var host = server.address().address;
	var port = server.address().port;
	console.log('Sid Lee x Agence Connectée listening at http://%s:%s', host, port);
});

