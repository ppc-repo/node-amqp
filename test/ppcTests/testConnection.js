/**
 * Created with JetBrains WebStorm.
 * User: dfennell
 * Date: 8/10/12
 * Time: 1:57 PM
 * To change this template use File | Settings | File Templates.
 */
var amqpFactory = require('../../lib/amqpFactory');
var assert = require('assert');
var config = require('../config/config');
var winston = require('winston');

//process.on('uncaughtException', function(err) {
//    console.log(err);
//});

var logger = new (winston.Logger)({
    transports: [
        new (winston.transports.Console)({colorize: 'true', handleExceptions: false, levels: 'info', timestamp:true})
    ]
});
process.logger = logger;

//logger.add(winston.transports.WinstonAmqp , { appName: 'amqpTest', level : 'info' }) ;

//var connection =  amqpFactory.getConnection(undefined, config.gateway);
//amqpFactory.initConnection(config.connections);
amqpFactory.initConnection('../test/config/config.js');
//console.log(connection);



