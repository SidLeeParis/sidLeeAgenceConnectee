[![Build Status](https://travis-ci.org/SidLeeParis/sidLeeAgenceConnectee.svg)](https://travis-ci.org/SidLeeParis/sidLeeAgenceConnectee)
[![Test Coverage](https://codeclimate.com/github/xseignard/sidLeeAgenceConnectee/badges/coverage.svg)](https://codeclimate.com/github/xseignard/sidLeeAgenceConnectee)

# Using the JS api

## Connect a client:
```javascript
var client = new SidLeeClient('http://dashboard.sidlee.com/', function(data) {
	console.log(data);
});
```
The function passed as a callback will be called each time a new event is recieved.

## Request the events of the day
```javascript
client.today().exec(function(data) {
	console.log(data);
});
```
`data` returns an aggregated view of the events of the current day (6am to 6am):
```json
[
	{
		"_id": "visits",
		"value": 2
	},
	{
		"_id": "likes",
		"value": 86818
	},
	{
		"_id": "undo",
		"value": 160,
		"date": "DATE_OF_LAST_EVENT",
		"app": "my app",
		"user": "user"
	}
]
```
For each sensors, and APIs, the client returns an object containing the name of the event and a value, which can be a sum or an average, according to the sensor configuration. The `undo` event is a particular one since it also returns the last `undo` event (`date`, `app` and `user`).

The list of the sensors and APIs is available [here](https://github.com/xseignard/sidLeeAgenceConnectee/blob/master/src/conf/sensorsConf.js).

## Request the events of the last 24h
```javascript
client.last24().exec(function(data) {
	console.log(data);
});
```
`data` returns an object containing an aggregated view of the events that happened during the last 24h. The events are sorted by hour ranges.
```json
[
	{
		"_id": "red",
		"values": [
			{
				"hourAgo": 0,
				"value": 1
			},
			{
				"hourAgo": 12,
				"value": 5
			},
			{
				"hourAgo": 17,
				"value": 14
			},
			{
				"hourAgo": 18,
				"value": 2
			},
			{
				"hourAgo": 21,
				"value": 12
			},
			{
				"hourAgo": 22,
				"value": 2
			}
		]
	},
	...
]
```
It returns a sum or an average, hour by hour. In the example, 1 "red" event happened in the running hour, 5 "red" event happened 12h ago, and so on.

## Requeter les mesures des derniers 30 jours
```javascript
client.last30().exec(function(data) {
	console.log(data);
});
```
Similar to last 24, but the sum or average is a daily one: `hourAgo` becomes `dayAgo`.

It' a [fluent interface](http://martinfowler.com/bliki/FluentInterface.html) API, so don't forget to call `exec` in order to execute the request!

A jsfiddle: [http://jsfiddle.net/07acad0b/6/](http://jsfiddle.net/07acad0b/6/)
