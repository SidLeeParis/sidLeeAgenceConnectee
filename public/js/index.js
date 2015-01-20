(function(SidLeeClient){
	// create client
	var client = new SidLeeClient('http://localhost:3000/', function(data) {
	//var client = new SidLeeClient('https://sidlee.herokuapp.com/', function(data) {
		console.log(data);
	});

	// query events
	client.events('random')
		.from('2014-12-01')
		.to('2014-12-02')
		.limit(10)
		.exec(function(data) {
			console.log(data);
		});
})(SidLeeClient);
