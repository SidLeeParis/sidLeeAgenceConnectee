var http = require('http'),
	moment = require('moment');

// keep last call results and time of lastcall
var data, lastCall;

var getLikes = function(callback) {

	// if the last call was more than 30sec ago, recall GA
	// if not, return the stored value
	var now = moment.utc();
	if (data && lastCall && now.diff(lastCall, 'seconds') < 30) {
		callback(null, data);
	}
	else {
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
				data = {
					_id: 'likes',
					value: likes
				};
				lastCall = moment.utc();
				callback(null, data);
			});
		}).on('error', function(err) {
			callback(err, null);
		});
	}
};

module.exports = getLikes;
