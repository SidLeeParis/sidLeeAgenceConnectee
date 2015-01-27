var should = chai.should();

var server = 'http://sidlee.herokuapp.com/';

describe('SidLeeClient', function() {

	describe('Constructor', function() {
		this.timeout(6000);

		it('should construct the right object', function() {
			var client = new SidLeeClient(server, function(data) {});
			client.getUrl.should.equal(server + 'api/1/event/');
			client.queryParams.length.should.equal(0);
		});

		it('should connect to the websocket', function() {
			var spy = sinon.spy(io, 'connect');
			var client = new SidLeeClient(server, function(data) {});
			spy.called.should.equal(true);
		});
	});

	describe('#events()', function(){

		it('should not modify the get url', function() {
			var client = new SidLeeClient(server, function(data) {});
			client.events();
			client.getUrl.should.equal(server + 'api/1/event/');
		});

		it('should add a name filter to the get url', function() {
			var client = new SidLeeClient(server, function(data) {});
			client.events('test');
			client.getUrl.should.equal(server + 'api/1/event/' + 'test');
		});
	});

	describe('#from()', function(){

		it('should not modify the query params', function() {
			var client = new SidLeeClient(server, function(data) {});
			client.from();
			client.queryParams.length.should.equal(0);
		});

		it('should add a fromDate filter to the query params', function() {
			var client = new SidLeeClient(server, function(data) {});
			client.from('2014-12-01');
			client.queryParams[0].should.equal('fromDate=2014-12-01');
		});
	});

	describe('#to()', function(){

		it('should not modify the query params', function() {
			var client = new SidLeeClient(server, function(data) {});
			client.to();
			client.queryParams.length.should.equal(0);
		});

		it('should add a toDate filter to the query params', function() {
			var client = new SidLeeClient(server, function(data) {});
			client.to('2014-12-01');
			client.queryParams[0].should.equal('toDate=2014-12-01');
		});
	});

	describe('#limit()', function(){

		it('should not modify the query params', function() {
			var client = new SidLeeClient(server, function(data) {});
			client.limit();
			client.queryParams.length.should.equal(0);
		});

		it('should add a limit filter to the query params', function() {
			var client = new SidLeeClient(server, function(data) {});
			client.limit('10');
			client.queryParams[0].should.equal('limit=10');
		});
	});

	describe('#today()', function(){

		it('should create the right url without name filter', function() {
			var client = new SidLeeClient(server, function(data) {});
			client.today();
			client.getUrl.should.equal(server + 'api/1/event/' + 'today');
		});

		it('should create the right url with name filter', function() {
			var client = new SidLeeClient(server, function(data) {});
			client.today('test');
			client.getUrl.should.equal(server + 'api/1/event/' + 'today/test');
		});
	});

	describe('#last24()', function(){

		it('should create the right url without name filter', function() {
			var client = new SidLeeClient(server, function(data) {});
			client.last24();
			client.getUrl.should.equal(server + 'api/1/event/' + 'last24');
		});

		it('should create the right url with name filter', function() {
			var client = new SidLeeClient(server, function(data) {});
			client.last24('test');
			client.getUrl.should.equal(server + 'api/1/event/' + 'last24/test');
		});

		it('should create the right url with name filter and appOrUser filter', function() {
			var client = new SidLeeClient(server, function(data) {});
			client.last24('undo', 'app');
			client.getUrl.should.equal(server + 'api/1/event/' + 'last24/undo/app');
		});

		it('should create the right url with name filter and reject appOrUser filter', function() {
			var client = new SidLeeClient(server, function(data) {});
			client.last24('test', 'app');
			client.getUrl.should.equal(server + 'api/1/event/' + 'last24/test');
		});
	});

	describe('#last30()', function(){

		it('should create the right url without name filter', function() {
			var client = new SidLeeClient(server, function(data) {});
			client.last30();
			client.getUrl.should.equal(server + 'api/1/event/' + 'last30');
		});

		it('should create the right url with name filter', function() {
			var client = new SidLeeClient(server, function(data) {});
			client.last30('test');
			client.getUrl.should.equal(server + 'api/1/event/' + 'last30/test');
		});

		it('should create the right url with name filter and appOrUser filter', function() {
			var client = new SidLeeClient(server, function(data) {});
			client.last30('undo', 'app');
			client.getUrl.should.equal(server + 'api/1/event/' + 'last30/undo/app');
		});

		it('should create the right url with name filter and reject appOrUser filter', function() {
			var client = new SidLeeClient(server, function(data) {});
			client.last30('test', 'app');
			client.getUrl.should.equal(server + 'api/1/event/' + 'last30/test');
		});
	});

	describe('#oldestFirst()', function(){

		it('should add a oldestFirst filter to the query params', function() {
			var client = new SidLeeClient(server, function(data) {});
			client.oldestFirst();
			client.queryParams[0].should.equal('oldestFirst=true');
		});
	});

	describe('#exec()', function(){
		var fakeServer;

		before(function () {
			var fakeData = [
				{
					name: 'random',
					date: '2015-01-23T09:35:17.763Z',
					value: 1,
					unit: 'dummyUnit'
				}
			];
			// fake the server
			fakeServer = sinon.fakeServer.create();
			fakeServer.respondWith(JSON.stringify(fakeData));
		});

		it('should return some data', function() {

			var client = new SidLeeClient(server, function(data) {});
			client.events('random').limit(1).exec(function(events) {
				events.length.should.equal(1);
				events[0].name.should.equal('random');
			});
			// make the fake server respond
			fakeServer.respond();
		});

		after(function() {
			fakeServer.restore();
		});

	});

	describe('#postEvent()', function(){
		var fakeServer;

		before(function () {
			// fake the server
			fakeServer = sinon.fakeServer.create();
			fakeServer.respondWith(
				'POST',
				server + 'api/1/event',
				[201, { 'Content-Type': 'application/json' }, '']
			);
		});

		it('should post some data', function() {
			var fakeEvent = {
				name: 'random',
				value: 1,
				unit: 'dummyUnit',
				token: 'dummyToken'
			};

			var client = new SidLeeClient(server, function(data) {});
			client.postEvent(fakeEvent, function(err) {
				should.not.exist(err);
			});
			// make the fake server respond
			fakeServer.respond();
		});

		it('should fail to post some data, because of missing token', function() {
			var fakeEvent = {
				name: 'random',
				value: 1,
				unit: 'dummyUnit'
			};

			var client = new SidLeeClient(server, function(data) {});
			client.postEvent(fakeEvent, function(err) {
				should.exist(err);
			});
			// make the fake server respond
			fakeServer.respond();
		});

		after(function() {
			fakeServer.restore();
		});

	});

});
