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
 * Connection URL to mongodb test db
 * @property MONGO_TEST_URL
 * @type {String}
 */
Conf.MONGO_TEST_URL = 'mongodb://localhost/sidleeTest';
/**
 * Port
 * @property PORT
 * @type {Number}
 */
Conf.PORT = process.env.PORT || 3000;
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
/**
 * Google service email
 * @property GOOGLE_SERVICE_ACCOUNT_EMAIL
 * @type {String}
 */
Conf.GOOGLE_SERVICE_ACCOUNT_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || '197794117251-hc2jcb1n8puengrubd9nkcpbvj4b9gk6@developer.gserviceaccount.com';
/**
 * Google service pem key
 * @property GOOGLE_SERVICE_ACCOUNT_KEY_FILE
 * @type {String}
 */
Conf.GOOGLE_SERVICE_ACCOUNT_KEY_FILE = __dirname + '/../conf/dashlee.pem';
/**
 * Token used by sensors to post data
 * @property SENSOR_TOKEN
 * @type {String}
 */
Conf.SENSOR_TOKEN = 'a7485fc8-ed22-495c-51fb-2859397537ea';


module.exports = Conf;
