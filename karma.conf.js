module.exports = function(config) {
	config.set({
		basePath: '',
		frameworks: ['mocha'],
		files: [
			'node_modules/chai/chai.js',
			'node_modules/socket.io-client/socket.io.js',
			'public/js/sidlee-client.js',
			'test/public/js/sidlee-client.spec.js'
		],
		browsers: ['PhantomJS', 'Chrome', 'Firefox'],

		reporters: ['progress', 'coverage'],

		transports: ['websocket', 'flashsocket', 'htmlfile', 'xhr-polling', 'jsonp-polling'],

		preprocessors: { 'public/js/sidlee-client.js': 'coverage' },

		coverageReporter: {
			type : 'lcovonly',
			dir : 'reports/'
		},

		singleRun: true
	});
};
