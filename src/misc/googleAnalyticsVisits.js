var googleapis = require('googleapis'),
	moment = require('moment'),
	JWT = googleapis.auth.JWT,
	analytics = googleapis.analytics('v3'),
	conf = require('../conf/conf');

// keep last call results and time of lastcall
var data, lastCall;

// query google analytics to get the number of visits today
var googleAnalyticsVisits = function(callback) {

	// if the last call was more than 30sec ago, recall GA
	// if not, return the stored value
	var now = moment.utc();
	if (data && lastCall && now.diff(lastCall, 'seconds') < 30) {
		callback(null, data);
	}
	else {
		// JSON web token conf
		var authClient = new JWT(
			conf.GOOGLE_SERVICE_ACCOUNT_EMAIL,
			conf.GOOGLE_SERVICE_ACCOUNT_KEY_FILE,
			null,
			['https://www.googleapis.com/auth/analytics.readonly']
		);

		authClient.authorize(function(err, tokens) {
			if (err) {
				callback(err, null);
			}

			var date = new Date();
			var start = date.getFullYear() + '-' + date.getMonth() +1 + '-' + date.getDate();
			var end = start;

			analytics.data.ga.get({
				auth: authClient,
				'ids': 'ga:96546222',
				'start-date': start,
				'end-date': end,
				'metrics': 'ga:pageviews'
			},
			function(err, result) {
				if (err) {
					callback(err, null);
				}
				else {
					var visits = -1;
					if (result && result.totalsForAllResults) {
						visits = parseInt(result.totalsForAllResults['ga:pageviews']);
					}
					data = {
						_id: 'visits',
						value: visits
					};
					lastCall = moment.utc();
					callback(null, data);
				}
			});
		});
	}
};

module.exports = googleAnalyticsVisits;
