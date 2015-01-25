'use strict';
/*jshint expr: true*/
var should = require('chai').should(),
	nock = require('nock'),
	getLikes = require('../../src/misc/facebookLikes');

describe('getLikes', function() {

	it('shoud return likes', function(done) {
		// mock http request
		nock('http://graph.facebook.com').get('/203384865593').reply(200, {likes: 1000});

		getLikes(function(err, likes) {
			should.not.exist(err);
			likes._id.should.equal('likes');
			likes.value.should.equal(1000);
			done();
		});
	});

});
