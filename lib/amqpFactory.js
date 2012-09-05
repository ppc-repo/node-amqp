var amqp = require('./amqp');
var winston = require('winston') ;
var util = require('util');
module.exports.getConnection = getConnection;
module.exports.publish = publish;
module.exports.initConnection   =    initConnection;
module.exports.defaultConnection = defaultConnection ;
module.exports.publishMessage = publishMessage;
module.exports.subscribe = subscribe;
exports.amqpLogger = require('./loggers/winstonAmqp').WinstonAmqp  ;



var connections = {};
var reconnectionAttemps = {};
var defaultRouterConnection = undefined;
var exchanges = {};
var queues = {};
var initConfig = undefined;


function initConnection(configFile) {
    var logger =  process.logger || console;

    initConfig = require(configFile);
    var config = require(configFile).connections ;

    config.forEach(function (item ,key) {
       // console.log(item);
        var options = {};
        options.vhost = item.vhost;
        options.host = item.host;
        options.port = item.port;
        options.login = item.login;
        options.password = item.password;
        options.heartbeat = item.heartbeat;

        var implOtions = item.implOptions;

        switch (item.enabled) {
            case true:
                var connection = amqp.createConnection(options, implOtions);
                reconnectionAttemps[connection.options.vhost] = 0;
                connection.on('ready', function() {
                    logger.info(util.format('Connection is Open VHOST[%s], HOST[%s], PORT[%d], USER[%s], HEARTBEAT[%d], Auto Reconnect[%s]',
                                             options.vhost, options.host, options.port, options.login, options.heartbeat, implOtions.reconnect));

                    connections[connection.options.vhost] =  connection;
                    if(item.defaultRouterConnection)  defaultRouterConnection =  connection;
                    if(reconnectionAttemps[connection.options.vhost] === 0) initExchange(configFile, connection);
                    //if(defaultRouterConnection) {
                    //    callback (null, defaultRouterConnection)
                    //}

                });

                connection.on('error', function (err) {
                    var options =   connection.options;
                    logger.warn(util.format('Error %s for Connection  VHOST[%s], HOST[%s], PORT[%d], USER[%s]', err ,options.vhost, options.host, options.port, options.login )) ;
                });

                connection.on('close', function () {
                    console.log(connection);
                    var options =   connection.options;
                    logger.warn(util.format('Connection Closed VHOST[%s], HOST[%s], PORT[%d], USER[%s]', options.vhost, options.host, options.port, options.login )) ;
                    if(connection.connectionAttemptScheduled) reconnectionAttemps[connection.options.vhost] = 1;
                    //defaultExchange[options.vhost] = undefined;
                });


                connection.on('heartbeat', function () {
                    var options =   connection.options;
                    logger.info(util.format('Heartbeat sent for  Connection VHOST[%s], HOST[%s], PORT[%d], USER[%s]', options.vhost, options.host, options.port, options.login ) ) ;
                });

                break;
            case false :
                console.log('not enabled');
                break;

        }
        //if(defaultRouterConnection) callback (null, defaultRouterConnection);

    });
    //var connection = amqp.createConnection(config.options.connection, config.options.implOptions);
    //return defaultRouterConnection;
};

function initExchange(configFile, connection) {
    var logger =  process.logger || console;
    var config = require(configFile).exchanges ;


    config.forEach(function (item ,key) {
        switch (item.enabled) {

            case true :
                if(item.vhost ===  connection.options.vhost) {
                    var exchange = connection.exchange(item.name, item.options);
                    if(item.isDefault) exchanges[item.name] =  exchange;
                    exchange.on('open', function() {
                        exchanges[ exchange.name] =  item;
                        logger.info(util.format('Exchange %s Ready on Vhost %s', exchange.name, connection.options.vhost)) ;


                        if(reconnectionAttemps[connection.options.vhost] === 0)  {
                            if(item.logger) {
                                logger.add(item.logger.appender, { exchange: exchange.name , appName: item.logger.name , level : item.logger.logLevel, publishOptions : item.logger.publishOptions}) ;
                            }

                            initQueues(configFile, exchange);
                        }
                    })
                    exchange.on('close', function() {
                        logger.info(util.format('Exchange %s Closed on Vhost %s', exchange.name, connection.options.vhost)) ;
                        //if(item.isDefault) defaultExchange[exchange.name] =  undefined;
                    })
                    exchange.on('error', function(err) {
                        logger.info(util.format('Error %s Exchange %s  Vhost %s', err, exchange.name, connection.options.vhost)) ;
                    })
                    exchange.on('basic-return', function(args) {
                        var replyCode = args['replyCode'];
                        var replyText = args['replyText'];
                        var pExchange = args['exchange'];
                        var pRoutingKey = args['routingKey'];
                        switch(replyCode) {
                            case 200 :
                                break;
                            case 312 :
                                logger.error(util.format('NO Queue/Routing For Exchange %s with a RoutingKey of : %s Exchange should be Created with Alternate Exchange', pExchange, pRoutingKey));
                                break;
                            default :
                                logger.error(util.format('Error : %s - %s For Exchange %s with a RoutingKey of : %s', replyCode, replyText, pExchange, pRoutingKey));
                        }
                    })

                }
                break;

            case  false :
                break;
        }
    });
}

function initQueues(configFile, exchange) {
    var logger =  process.logger || console;
    var config = require(configFile).queues ;

    var x;

    config.forEach(function (item ,key) {
        switch (item.enabled) {

            case true :
                if(item.exchange ===  exchange.name) {
                    var connection =   connections[exchange.connection.options.vhost];
                    //x =   connection;
                    queues[item.name] =  item;
                    var queue = connection.queue(item.name, item.options, function(q) {
                        var routingKeys = item.routingKeys;
                        routingKeys.forEach(function (item, key) {
                            q.bind(exchange.name, item);

                        })
                        if(item.callback) {
                            q.subscribe(item.name, item.callback);
                        }
                    });

                    queue.on('error', function(err) {
                        logger.error(util.format('Error %s for Queue %s', err, queue.name));
                    });

                    queue.on('queueBindOk', function() {
                        logger.info(util.format('Queue %s Bound to On Exchange %s', queue.name, exchange.name));
                    });

                }

                break;

            case  false :
                break;
        }
    });

    //if(exchange.connection.options.vhost == 'message-services') console.log(x);
}


function defaultConnection() {

    if(defaultRouterConnection === undefined) throw new Error('Default Connection not set')


    return defaultRouterConnection;
};


function getConnection(name) {
    if(!name) throw new Error('Connection Name is required')

    var connection = connections[name] || undefined;

    if(!connection) throw new Error('Connection : ' + name + ' not found')

    return  connection;
}

function getExchange(name) {
    if(!name) throw new Error('Exchange Name is required')

    var exchange = exchanges[name] || undefined;

    if(!exchange) throw new Error('Exchange : ' + name + ' not found')

    return  exchange;
}



function publish(exchangeName, routingkey, msg, options) {
    var logger = process.logger || console;
    if(!exchangeName) throw new Error('Name of Exchange require')
    try {
        var exchange = getExchange(exchangeName);
        exchange.publish(routingkey, msg, options);
    }
    catch (err) {

        throw new Error(err);
    }
}

function publishMessage(connectionOptions, transportType, guid, routingkey,  msg, options, callback) {
    var logger = process.logger || console;
    try {

        //var exchange = getExchange(connectionOptions.exchange);
        publish(connectionOptions.exchange, routingkey, msg, options);
        logger.info(util.format('Message published for ID %s', guid));
        if(transportType === 'sync') {
            var connection = getConnection(connectionOptions.vhost);
            var queue = connection.queue(guid, {passive: false, exclusive: true}, function(q) {
                logger.info(util.format('Private Queue %s Created', guid));
            })
            queue.subscribe({ ack: true, prefetchCount : 1 }, function (payload, headers, deliveryInfo, msg) {
                callback(null, payload.data);
                msg.acknowledge();
                queue.unsubscribe(deliveryInfo.consumerTag);
                logger.info(util.format('Message ACKED and Private Queue %s un-subscribed', guid));
            });
            setTimeout(function() {
                logger.error(util.format('Sync Wait timed out for routingKey: %s Request Message %s', routingkey, msg));
                queue.destroy();
                callback( new Error('No Reply to Sync call on Queue:' +  queue.name + 'Connection ' +  connection.name + ' routingKey: ' + routingkey),null);
            }, connectionOptions.defaultTimeOut * 1000);

        }
        else callback(null,'Message Queued');


    }
    catch (err)
    {
        callback(err, null);
    }
}

function subscribe(queueName, cb) {
    var logger = process.logger || console;
    var queueConfig = queues[queueName];
    var exchangeConfig = exchanges[queueConfig.exchange];
    var connection = getConnection(exchangeConfig.vhost);
    var queue =   connection.queue(queueName, queueConfig.options, function(q) {
        logger.info(util.format('Queue %s Is Ready', q.name));
    })

    queue.subscribe({ ack: true, prefetchCount : 1 }, cb) ;

}






