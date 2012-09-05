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
var util = require('util');

//process.on('uncaughtException', function(err) {
//    console.log(err);
//});

var logger = new (winston.Logger)({
    transports: [
        new (winston.transports.Console)({colorize: 'true', handleExceptions: false, levels: 'info', timestamp:true})
    ]
});
process.logger = logger;
var riak = require('riak-js').getClient(config.riak);
amqpFactory.initConnection('../test/config/config.js');

setTimeout(delay, 10 * 1000);






function delay() {
    //console.log(amqpFactory.defaultConnection());
    //amqpFactory.publish('control.gateway', 'overseer.state-broadcast.router', {name: 'test'}, { mandatory : true,
    //    immediate : false,
    //    deliveryMode : 1 }, true);
    amqpFactory.subscribe('admin.overseer', riakMessage);


}
//var x = amqpFactory.defaultConnection();

//setTimeout( console.log(amqpFactory.defaultConnection()),1000 * 10);

//publishMessage(connectionOptions, transportType, guid, routingkey,  msg, options, callback) {


function riakMessage(payload, headers, deliveryInfo, msg) {

    console.info(payload);
    var bucket =  'stats';
    var key  = payload.type + '-' + payload.processId;
    console.info(key);
    payload.savetime = new Date().toJSON();
    riak.save(bucket, key, payload, config.riak.metaOptions,  function(err, result, meta) {

        //console.log('result:' + util.inspect(result));
        //console.log('meta:' + util.inspect(meta));

        if(meta.statusCode === 200)  {
            msg.acknowledge();
        }
        else {
            if(err) console.log(err);
            msg.reject();
        }



    });

   // client.post(bucket,key, payload, options , function(){
   //     console.log('fff');
   // });
}