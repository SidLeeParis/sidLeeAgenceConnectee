(function(io){

	var Client = function(url, eventHandler) {
		this.socket = io.connect(url, {secure: true});
		this.socket.on('event', eventHandler);
		this.url = url;
		this.getUrl = this.url + 'api/1/event/';
		this.queryParams = [];
	};

	Client.prototype.events = function(nameFilter) {
		if (nameFilter) this.getUrl = this.getUrl + nameFilter;
		return this;
	};

	Client.prototype.from = function(dateFilter) {
		if (dateFilter) this.queryParams.push('fromDate=' + dateFilter);
		return this;
	};

	Client.prototype.to = function(dateFilter) {
		if (dateFilter) this.queryParams.push('toDate=' + dateFilter);
		return this;
	};

	Client.prototype.limit = function(limit) {
		if (limit) this.queryParams.push('limit=' + limit);
		return this;
	};

	Client.prototype.today = function() {
		var today = new Date();
		var queryDate = today.getFullYear() + '-' + today.getMonth() +1 + '-' + today.getDate();
		this.queryParams.push('fromDate=' + queryDate);
		this.queryParams.push('toDate=' + queryDate);
		return this;
	}

	Client.prototype.exec = function(callback) {
		var request = new XMLHttpRequest();
		request.onreadystatechange = function() {
			if (request.readyState == 4 && request.status == 200) {
				callback(JSON.parse(request.responseText));
			}
		};
		var currentUrl = this.getUrl;
		if (this.queryParams.length) {
			currentUrl += '?';
			for (var i = 0; i < this.queryParams.length; i++) {
				currentUrl += this.queryParams[i] + '&';
			}
		}
		request.open('GET', currentUrl, true);
		request.send(null);
		this.getUrl = this.url + 'api/1/event/';
		this.queryParams = [];
	};

	window.SidLeeClient = Client;
})(io);
