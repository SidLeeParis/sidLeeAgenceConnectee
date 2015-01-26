'use strict';
/**
 * Configuration of sensors
 * @module SensorsConf
 */
var SensorsConf = {};

// Sensors

// baby foot : arduino ethernet
SensorsConf.red = { name: 'red', sum: true };
SensorsConf.blue = { name: 'blue', sum: true };
// edf + door : arduino ethernet
SensorsConf.watt = { name: 'watt', sum: false };
SensorsConf.door = { name: 'door', sum: true };
// stairs : arduino ethernet
SensorsConf.stairs = { name: 'stairs', sum: true };
// temp + sound + light : arduino ethernet
SensorsConf.sound = { name: 'sound', sum: false };
SensorsConf.degrees = { name: 'degrees', sum: false };
SensorsConf.light  = { name: 'light', sum: false };
// flush : spark core
SensorsConf.flush = { name: 'flush', sum: true };
// water : arduino ethernet
SensorsConf.water = { name: 'water', sum: true };
// coffe : arduino ethernet
SensorsConf.coffee = { name: 'coffee', sum: true };
// fridge door : spark core
SensorsConf.fridge = { name: 'fridge', sum: true };
// tracer : arduino ethernet
SensorsConf.tracer = { name: 'tracer', sum: true };

// Not sensors

// printer
SensorsConf.printer = { name: 'printer', sum: true };
// switch button on the web page
SensorsConf.lightswitch = { name: 'lightswitch', sum: true };
// undo
SensorsConf.undo = { name: 'undo', sum: true };
// connected devices in the agency
SensorsConf.devices = { name: 'devices', sum: false };
// facebook likes
SensorsConf.likes = { name: 'likes' };
// page visits
SensorsConf.visits = { name: 'visits' };


module.exports = SensorsConf;
