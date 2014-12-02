(function(){
	var socket = io.connect('http://localhost:3000');
	socket.on('event', function (data) {
		console.log(data);
	});
})();
