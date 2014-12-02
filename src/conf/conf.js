'use strict';
/**
 * Configuration store
 * @class Conf
 * @module conf
 */
var Conf = {};
/**
 * Connection URL to mongodb
 * @property MONGO_URL
 * @type {String}
 */
Conf.MONGO_URL = process.env.MONGO_URL || 'mongodb://localhost/sidlee';
/**
 * API version
 * @property API_VERSION
 * @type {Number}
 */
Conf.API_VERSION = 1;
/**
 * API prefix
 * @property API_PREFIX
 * @type {String}
 */
Conf.API_PREFIX = '/api/' + Conf.API_VERSION;


module.exports = Conf;
