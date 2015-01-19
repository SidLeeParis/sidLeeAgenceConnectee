var http = require('http');

// url, path and so on of the SID LEE facebook graph
var options = {
	hostname: 'graph.facebook.com',
	port: 80,
	path: '/203384865593',
	method: 'GET'
};

var getLikes = function(callback) {
	// request to get the # of likes
	var req = http.request(options, function(response) {
		var str = '';
		// while data is incoming, concatenate it
		response.on('data', function (chunk) {
			str += chunk;
		});
		// data is fully recieved, and now parsable
		response.on('end', function () {
			var likes = JSON.parse(str).likes;
			var data = {
				_id: 'likes',
				value: likes
			};
			callback(data);
		});
	});
	// actually send the request
	req.end();
};

module.exports = getLikes;
