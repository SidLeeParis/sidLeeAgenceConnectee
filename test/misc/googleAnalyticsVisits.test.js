'use strict';
/*jshint expr: true*/
var should = require('chai').should(),
	nock = require('nock'),
	getVisits = require('../../src/misc/googleAnalyticsVisits');

describe('getVisits', function() {

	it('shoud return visits', function(done) {
		// mock http request
		var date = new Date();
		var start = date.getFullYear() + '-' + date.getMonth() +1 + '-' + date.getDate();
		var end = start;
		var fakeUrl = '/ga?ids=ga%3A96546222&start-date=' + start + '&end-date=' + end + '&metrics=ga%3Apageviews';
		var fakeData = {
			totalsForAllResults: {
				'ga:pageviews': 15
			}
		};
		nock('https://www.googleapis.com/analytics/v3/data')
			.get(fakeUrl)
			.reply(200, fakeData);

		getVisits(function(err, visits) {
			should.not.exist(err);
			visits._id.should.equal('visits');
			visits.value.should.exist();
			done();
		});
	});

});
