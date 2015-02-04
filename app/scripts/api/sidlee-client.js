/*jslint nomen: true */
/*global io */

(function(io){
	'use strict';

	var Client = function(url, eventHandler) {
		this.socket = io.connect(url, { secure: true, transports: ['websocket'] });
		this.socket.on('event', eventHandler);
		this.url = url;
		this.getUrl = this.url + 'api/1/event/';
		this.postUrl = this.url + 'api/1/event';
		this.queryParams = [];
	};

	Client.prototype.events = function(nameFilter) {
		if (nameFilter) {
			this.getUrl = this.getUrl + nameFilter;
		}
		return this;
	};

	Client.prototype.from = function(dateFilter) {
		if (dateFilter) {
			this.queryParams.push('fromDate=' + dateFilter);
		}
		return this;
	};

	Client.prototype.to = function(dateFilter) {
		if (dateFilter) {
			this.queryParams.push('toDate=' + dateFilter);
		}
		return this;
	};

	Client.prototype.limit = function(limit) {
		if (limit) {
			this.queryParams.push('limit=' + limit);
		}
		return this;
	};

	Client.prototype.today = function(nameFilter) {
		this.getUrl = this.getUrl + 'today';
		if (nameFilter) {
			this.getUrl = this.getUrl + '/' +nameFilter;
		}
		return this;
	};

	Client.prototype.lastXX = function(nameFilter, appOrUserFilter, lastXX) {
		this.getUrl = this.getUrl + lastXX;
		if (nameFilter) {
			this.getUrl = this.getUrl + '/' + nameFilter;
		}
		if (appOrUserFilter && nameFilter === 'undo') {
			this.getUrl = this.getUrl + '/' + appOrUserFilter;
		}
		return this;
	};

	Client.prototype.last24 = function(nameFilter, appOrUserFilter) {
		return this.lastXX(nameFilter, appOrUserFilter, 'last24');
	};

	Client.prototype.last30 = function(nameFilter, appOrUserFilter) {
		return this.lastXX(nameFilter, appOrUserFilter, 'last30');
	};

	Client.prototype.last12 = function(nameFilter, appOrUserFilter) {
		return this.lastXX(nameFilter, null, 'last12');
	};

	Client.prototype.oldestFirst = function() {
		this.queryParams.push('oldestFirst=true');
		return this;
	};

	Client.prototype.exec = function(callback) {
		var request = new XMLHttpRequest();
		request.onreadystatechange = function() {
			if (request.readyState === 4 && request.status === 200) {
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

	Client.prototype.postEvent = function(event, callback) {
		if (event && event.name && event.value && event.unit && event.token) {
			var request = new XMLHttpRequest();
			request.onreadystatechange = function() {
				if (request.readyState === 4) {
					if (request.status === 201) {
						callback();
					}
					else {
						callback(new Error('An error occured, recieved a ' + request.status + ' status code instead of 201'));
					}
				}
			};
			request.open('POST', this.postUrl);
			request.setRequestHeader('Content-Type', 'application/json;charset=UTF-8');
			request.send(JSON.stringify(event));
		}
		else {
			callback(new Error('You must define a name, a value, a unit and a token'));
		}
	};

	window.SidLeeClient = Client;
})(io);
