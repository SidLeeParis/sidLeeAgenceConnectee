'use strict';
/**
 * Configuration of sensors
 * @module SensorsConf
 */
var SensorsConf = {
	red: { name: 'red', sum: true },
	blue: { name: 'blue', sum: true },
	edf: { name: 'edf', sum: false },
	stairs: { name: 'stairs', sum: true },
	roomTemp: { name: 'roomTemp', sum: false },
	sound: { name: 'sound', sum: false },
	flush: { name: 'flush', sum: true },
	water: { name: 'water', sum: true },
	ctrlz: { name: 'ctrlz', sum: true },
	likes: { name: 'likes'}
};


module.exports = SensorsConf;
