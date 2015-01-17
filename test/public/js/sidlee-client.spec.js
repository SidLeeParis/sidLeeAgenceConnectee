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

		it('should handle incoming websocket messages', function(done) {
			var client = new SidLeeClient(server, function(data) {
				data.name.should.exist();
				data.date.should.exist();
				data.value.should.exist();
				data.unit.should.exist();
				done();
			});
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
	});

	describe('#last31()', function(){

		it('should create the right url without name filter', function() {
			var client = new SidLeeClient(server, function(data) {});
			client.last31();
			client.getUrl.should.equal(server + 'api/1/event/' + 'last31');
		});

		it('should create the right url with name filter', function() {
			var client = new SidLeeClient(server, function(data) {});
			client.last31('test');
			client.getUrl.should.equal(server + 'api/1/event/' + 'last31/test');
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
		this.timeout(3000);

		it('should return some data', function(done) {
			var client = new SidLeeClient(server, function(data) {});
			client.events('random').limit(5).exec(function(events) {
				events.length.should.equal(5);
				events.forEach(function(event) {
					event.name.should.equal('random');
				});
				done();
			});
		});

	});

});
