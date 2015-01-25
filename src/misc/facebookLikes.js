var http = require('http');

var getLikes = function(callback) {
	// request to get the # of likes
	var req = http.get('http://graph.facebook.com/203384865593', function(response) {
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
			callback(null, data);
		});
	}).on('error', function(err) {
		callback(err, null);
	});
};

module.exports = getLikes;
