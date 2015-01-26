module.exports = function(config) {
	config.set({
		basePath: '',
		frameworks: ['mocha', 'chai', 'sinon'],
		files: [
			'node_modules/chai/chai.js',
			'node_modules/socket.io-client/socket.io.js',
			'app/scripts/api/sidlee-client.js',
			'test/app/js/sidlee-client.spec.js'
		],
		browsers: ['PhantomJS'],

		reporters: ['progress', 'coverage'],

		transports: ['websocket', 'flashsocket', 'htmlfile', 'xhr-polling', 'jsonp-polling'],

		preprocessors: { 'app/scripts/api/sidlee-client.js': 'coverage' },

		coverageReporter: {
			type : 'lcovonly',
			dir : 'reports/',
			subdir: function(browser) {
				return browser.toLowerCase().split(/[ /-]/)[0];
			}
		},

		singleRun: true
	});
};
