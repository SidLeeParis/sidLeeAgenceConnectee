(function(SidLeeClient){
	// create client
	//var client = new SidLeeClient('http://localhost:3000/', function(data) {
	var client = new SidLeeClient('https://sidlee.herokuapp.com/', function(data) {
		console.log(data);
	});

})(SidLeeClient);
