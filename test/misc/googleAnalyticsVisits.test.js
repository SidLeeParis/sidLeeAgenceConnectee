'use strict';
/*jshint expr: true*/
var should = require('chai').should(),
	getVisits = require('../../src/misc/googleAnalyticsVisits');

describe('getVisits', function() {

	it('shoud return likes', function(done) {
		getVisits(function(err, likes) {
			should.not.exist(err);
			likes._id.should.equal('visits');
			likes.value.should.exist();
			done();
		});
	});

});
