var http = require('http'),
	Conf = require('../conf/conf'),
	SensorsConf = require('../conf/sensorsConf');

var options = {
	hostname: 'sidlee.herokuapp.com',
	port: 80,
	path: Conf.API_PREFIX + '/event',
	method: 'POST',
	headers: {
		'Content-Type': 'application/json'
	}
};

var postFridgeDegrees = function() {
	// create a fake degree value
	var min = 3;
	var max = 7;
	var value = Math.random() * (max - min) + min;
	var regExp = new RegExp('(\\d+\\.\\d{1})(\\d)');
	var match = value.toString().match(regExp);
	value = match ? parseFloat(match[1]) : value.valueOf();

	// object to post
	var data = {
		name: SensorsConf['fridgeDegrees'].name,
		value: value,
		unit: 'C',
		token: Conf.SENSOR_TOKEN
	};
	var stringData = JSON.stringify(data);

	// add content length to header
	options.headers['Content-Length'] = stringData.length;

	// create the request
	var req = http.request(options, function(res) {});

	// write data to request body
	req.write(stringData);
	req.end();
};

module.exports = postFridgeDegrees;
