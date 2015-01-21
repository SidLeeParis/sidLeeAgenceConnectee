'use strict';
/*jshint expr: true*/
var should = require('chai').should(),
	getLikes = require('../../src/misc/facebookLikes');

describe('getLikes', function() {

	it('shoud return likes', function(done) {
		getLikes(function(err, likes) {
			should.not.exist(err);
			likes._id.should.equal('likes');
			likes.value.should.exist();
			done();
		});
	});

});
