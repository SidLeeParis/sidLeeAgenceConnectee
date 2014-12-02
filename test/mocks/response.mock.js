'use strict';
var Response = function() {
	var _data, _statusCode;

	var _send = function(responseData) {
		_data = responseData;
	};

	var _status = function(statusCode) {
		_statusCode = statusCode;
		return {
			send : _send
		};
	};

	var _getData = function() {
		return _data;
	};

	var _getStatus = function() {
		return _statusCode || 200;
	};

	return {
		send: _send,
		status: _status,
		getData: _getData,
		getStatus: _getStatus
	};
};

module.exports = Response;
