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
//, function(err, defaultConn)
//{
   // console.log(defaultConn);
//    var y = amqpFactory.defaultConnection();
//    console.log(y);
//    var z =  amqpFactory.getConnection('control-services');
//    console.log(z);
//});
setTimeout(pub, 10 * 1000);






function pub() {
    //console.log(amqpFactory.defaultConnection());
    //amqpFactory.publish('control.gateway', 'overseer.state-broadcast.router', {name: 'test'}, { mandatory : true,
    //    immediate : false,
    //    deliveryMode : 1 }, true);
    var router = {
        defaultTimeOut : 60
        , exchange :  'svc.gateway'
        , vhost : 'message-services' }

    amqpFactory.publishMessage(router, 'sync', '1222343434', 'test',  '</test>', {replyTo : '1222343434'}, function(err, msg) {

        console.log(err);
        console.log(msg);

    });
}
//var x = amqpFactory.defaultConnection();

//setTimeout( console.log(amqpFactory.defaultConnection()),1000 * 10);

//publishMessage(connectionOptions, transportType, guid, routingkey,  msg, options, callback) {

