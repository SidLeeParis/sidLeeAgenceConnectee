var googleapis = require('googleapis'),
	JWT = googleapis.auth.JWT,
	analytics = googleapis.analytics('v3'),
	conf = require('../conf/conf');

// query google analytics to get the number of visits today
var googleAnalyticsVisits = function(callback) {

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
		}, function(err, result) {
			if (err) callback(err, null);
			var visits = -1;
			if (result && result.totalsForAllResults) {
				visits = parseInt(result.totalsForAllResults['ga:pageviews']);
			}
			var data = {
				_id: 'visits',
				value: visits
			};
			callback(null, data);
		});
	});
};

module.exports = googleAnalyticsVisits;
