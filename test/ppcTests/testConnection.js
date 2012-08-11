/**
 * Created with JetBrains WebStorm.
 * User: dfennell
 * Date: 8/10/12
 * Time: 1:57 PM
 * To change this template use File | Settings | File Templates.
 */
var amqpFactory = require('../../amqpFactory');
var assert = require('assert');
var config = require('../config/config');

process.on('uncaughtException', function(err) {
    console.log(err);
});

var connection =  amqpFactory.getConnection(config.gateway);
console.log(connection);



