'use strict';
var mongoose = require('mongoose');

/**
 * Event schema
 * Contains the following infos :
 * - name : name of the sensor
 * - date : date of the event
 * - value : value of the event
 * - unit : unit of the value
 */
var eventSchema = mongoose.Schema({
	name: { type: String, required: true },
	date: { type: Date, required: true },
	value: Number,
	unit: String
});

/**
 * Event model
 * @class Event
 * @module models
 */
var Event = mongoose.model('Event', eventSchema);

module.exports = Event;
