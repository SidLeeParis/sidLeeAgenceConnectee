'use strict';
/**
 * Configuration of sensors
 * @module SensorsConf
 */
var SensorsConf = {
	red: { name: 'red', sum: true },
	blue: { name: 'blue', sum: true },
	watt: { name: 'watt', sum: false },
	stairs: { name: 'stairs', sum: true },
	roomTemp: { name: 'roomTemp', sum: false },
	sound: { name: 'sound', sum: false },
	flush: { name: 'flush', sum: true },
	water: { name: 'water', sum: true },
	undo: { name: 'undo', sum: true },
	coffee: { name: 'coffee', sum: true },
	lightswitch: { name: 'lightswitch', sum: true },
	fridgeDegrees : { name: 'fridgeDegrees', sum: false },
	likes: { name: 'likes' },
	visits: { name: 'visits' }
};


module.exports = SensorsConf;
