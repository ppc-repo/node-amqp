var amqp = require('./amqp');
var winston = require('winston') ;
var util = require('util');
module.exports.getConnection = getConnection;
module.exports.publish = publish;
module.exports.rpc = rpc;
module.exports.subscribe = subscribe;
module.exports.initConnection   =    initConnection;
module.exports.defaultConnection = defaultConnection ;
exports.amqpLogger = require('./loggers/winstonAmqp').WinstonAmqp  ;

var connections = [];
//var connection = {};

//function getConnection(name, config) {
//    var connection = undefined;
//    if(name === undefined) name = config.name;
//    //var amqpConection = undefined;
//    connections.forEach(function(value) {
//      if(value.name === name) connection = value;
//    })
//    if(connection !== undefined)  return connection;
//
//    connection = createConnection(name, config)
//
//    return connection;
//};

function createConnection(name, config) {

    var amqpConnection = {
        name : name,
        config : config,
        connection : undefined,
        exchange : undefined,
        queues : [],
        loggerAdded : false,
        isReady : false,
        hasLogger : false
    };
    var logger = undefined;

    if(process.logger) {
        amqpConnection.hasLogger = true;
        logger = process.logger;
    }
    else
    {
        amqpConnection.hasLogger = false;
        logger = console;
    }
    var connection = amqp.createConnection(config.options.connection, config.options.implOptions);
    amqpConnection.connection = connection;

    connection.on('ready', function () {
        logger.info('Connection ' + name  + ' is ready ' ) ;
        amqpConnection.isReady = true;
        if(config.options.alternateExchange) {
            var alternateExchange =  config.options.alternateExchange;
            logger.info(util.format('This Connection has an alternate exchange %s to queue un-routable messages',alternateExchange.name));
            createExchange(amqpConnection.connection, alternateExchange, false);
        }

        if(config.exchangeConnectParams) {
            connection.exchange(config.implOptions.defaultExchangeName, config.exchangeConnectParams, function (exchange) {
                logger.info('Exchange ' + exchange.name  + ' for Connection ' + name + ' is open ' ) ;
                amqpConnection.exchange = exchange;
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
                exchange.on('open', function() {
                    logger.info('Exchange is open') ;
                })
                exchange.on('close', function() {
                    logger.info('Exchange is closed');
                })
                exchange.on('error', function(err) {
                    logger.info('Exchange is closed');
                })
                if(config.queues) {
                    var queues = config.queues;
                    Object.keys(queues).forEach(function(value, key) {
                        var queue = queues[value];
                        if(queue.enabled) {
                            var newQueue = connection.queue(queue.name, queue.options, function(q) {
                                q.bind(exchange.name, queue.routingKeys[0]);
                                //amqpConnection.loggerAdded = true;
                            });
                            newQueue.on('error', function(err) {
                                //amqpConnection.loggerAdded = true;
                                logger.error(util.format('Queue %s not Ready  %s', queue.name, err));
                            });

                            newQueue.on('queueBindOk', function() {
                                //amqpConnection.loggerAdded = true;
                                //logger.info(util.format('Queue %s On Exchange %s for Connection %s  is open', queue.name, exchange.name, name));
                                logger.info(util.format('Routing Key %s for Queue %s bound to Exchange %s for Connection %s is open',
                                    queue.routingKeys[0], queue.name, exchange.name, name ));
                                amqpConnection.queues.push(newQueue);
                                if(config.usedForLogging)  {
                                    if(amqpConnection.hasLogger) {
                                        try {
                                            //TODO fix appname, do I need to do something with level for the different queues
                                            logger.add(config.loggerType, { connectionName: name , appName: 'amqpTest', level : 'info' }) ;
                                            logger.info(util.format('Logger Transport added to Connection %s Queue %s' , name, newQueue.name));
                                            amqpConnection.loggerAdded = true;
                                            //TODO make sure logging to queue works level needs to be part of the routing key and add the appname
                                            logger.info('this is a fatal test');
                                            //
                                        }
                                        catch (err) {
                                            logger.warn('Could Not Add AMQP logger transport ['+ config.loggerType + '] to Connection ' + name + ' Error: ' + err);
                                            //amqpConnection.loggerAdded = false;
                                        }
                                    }
                                }
                            });

                        };
                    });
                };
            });
        };
    });

    connection.on('error', function (err) {
        logger.warn('Connection ' + name  + ' ' + err  ) ;
    });

    connection.on('close', function () {
        logger.warn('Connection ' + name  + ' has been closed ' ) ;
        amqpConnection.isReady = false;
        if(amqpConnection.loggerAdded) {
            logger.remove(config.loggerType);
            amqpConnection.loggerAdded = false;
        }
        amqpConnection.exchange = undefined;
    });


    connection.on('heartbeat', function () {
        logger.info('Heartbeat for Connection ' + name ) ;
    });



    connections.push(amqpConnection);

    return amqpConnection;

}


function publish(name, routingkey, msg, options, skipIfNotConnected) {
    var logger = process.logger || console;
    if(!name) throw new Error('Name of connection require')
    var connection = getConnection(name);
    if(!connection) throw new Error('No Connection found with Name ' + name);
    if(!connection.exchange) {
        if(!skipIfNotConnected) throw new Error('No Exchange is Open for Connection with Name ' + name);
        logger.info('Connection ' + name + ' IS Not ready to publish to. SkipINotConnected = ' + skipIfNotConnected + ' message for routing key ' + routingkey + ' not sent')
        return;
    }
    connection.exchange.publish(routingkey, msg, options);

}

function rpc(name, routingkey,  msg, options, queueName, callback) {
    var logger = process.logger || console;
    if(!name) callback(new Error('Name of connection require'),null);
    var connection = getConnection(name);
    if(!connection) callback(new Error('No Connection found with Name ' + name),null);
    if(!connection.connection) callback(new Error('Connection ' + name + ' is not currently Open'),null);
    connection.connection.queue(queueName, {passive: false, exclusive: true}, function(queue) {
        if(!connection.exchange) {
            queue.destroy();
            callback( new Error('No Exchange is Open for Connection with Name ' + name),null);
        }
        try{
            connection.exchange.publish(routingkey, msg, {replyTo: queue.name}) ;
            setTimeout(function() {
                logger.error(util.format('Sync Wait timed out for routingKey: %s Request Message %s', routingkey, msg));
                queue.destroy();
                callback( new Error('No Reply to Sync call on Queue:' +  queue.name + 'Connection ' +  connection.name + ' routingKey: ' + routingkey),null);
            }, connection.config.syncWaitSec * 1000)
            queue.subscribe({ ack: true, prefetchCount : 1 }, function (payload, headers, deliveryInfo, msg) {
                callback(null, payload.data);
                msg.acknowledge();
                queue.unsubscribe(deliveryInfo.consumerTag);
            });
        }
        catch (err) {
            queue.destroy();
            callback( err, null);
        }


    });

}


function subscribe(name, queueName, listener) {
    var self = this;
    var logger = process.logger || console;
    if(!name) throw new Error('Name of connection require')
    var connection = getConnection(name);
    if(!connection)throw new Error('No Connection found with Name ' + name);
    var queues = connection.queues;
    queues.forEach(function(queue,index) {
        console.info(queue.name)
        if(queue.name === queueName) {
            queue.subscribe({ ack: true, prefetchCount : 1 },listener);
        }
    });


}

function createExchange(connection, exchangeOptions, isDefaultQueue) {
    var logger = process.logger || console;
    //var connection =  amqpConnection.connection;
    var eOptions = {};
    eOptions.type =  exchangeOptions.type;
    eOptions.durable =  exchangeOptions.durable;
    eOptions.passive =  exchangeOptions.passive;
    eOptions.autoDelete =  exchangeOptions.autoDelete;

    connection.exchange(exchangeOptions.name, eOptions, function (exchange) {
        logger.info(util.format('Exchange %s for Connection %s is open ', exchange.name, connection.name )) ;
        if(isDefaultQueue) amqpConnection.exchange = exchange;

        createQueue(connection, exchange, exchangeOptions.queue)

    });


}

function createQueue(connection, exchange, queueOptions) {


    var queue = connection.queue(queueOptions.name, queueOptions.options, function(q) {
        q.bind(exchange.name, queueOptions.options, queueOptions.routingKey);

    });

    queue.on('error', function(err) {
        //amqpConnection.loggerAdded = true;
        logger.error(util.format('Queue %s not Ready  %s', queue.name, err));
    });

    queue.on('queueBindOk', function() {
        //amqpConnection.loggerAdded = true;
        //logger.info(util.format('Queue %s On Exchange %s for Connection %s  is open', queue.name, exchange.name, name));
        logger.info(util.format('Routing Key %s for Queue %s bound to Exchange %s for Connection %s is open',
            queue.routingKey, queue.name, exchange.name, amqpConnection.name ));
    });


}

var xconnections = {};
var reconnectionAttemps = {};
var defaultRouterConnection = undefined;
//var connectionCnt = 0;

function initConnection(configFile, callback) {
    var logger =  process.logger || console;
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
                    //connections.push(connection);
                    //vhostConnection.isReady = true
                    //var reconnect = false;
                    //if(xconnections[connection.options.vhost]) {
                    ////    reconnect = true;
                    //    console.log(connection);
                    //}
                    xconnections[connection.options.vhost] =  connection;
                    if(item.defaultRouterConnection)  defaultRouterConnection =  connection;
                    if(reconnectionAttemps[connection.options.vhost] === 0) initExchange(configFile, connection);
                    if(defaultRouterConnection) {
                        callback (null, defaultRouterConnection)
                    }

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
        if(defaultRouterConnection) callback (null, defaultRouterConnection);

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
                    exchange.on('open', function() {
                        logger.info(util.format('Exchange %s Ready on Vhost %s', exchange.name, connection.options.vhost)) ;
                        //if(item.isDefault) defaultExchange[connection.options.vhost] =  exchange;
                        //var reconnect = false;
                        //if(xconnections[connection.options.vhost]) reconnect = true;
                        if(reconnectionAttemps[connection.options.vhost] === 0)  initQueues(configFile, exchange);
                    })
                    exchange.on('close', function() {
                        logger.info(util.format('Exchange %s Closed on Vhost %s', exchange.name, connection.options.vhost)) ;
                        //if(item.isDefault) defaultExchange[exchange.name] =  undefined;
                    })
                    exchange.on('error', function(err) {
                        logger.info(util.format('Error %s Exchange %s  Vhost %s', err, exchange.name, connection.options.vhost)) ;
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
                    var connection =   xconnections[exchange.connection.options.vhost];
                    x =   connection;
                    var queue = connection.queue(item.name, item.options, function(q) {
                        var routingKeys = item.routingKeys;
                        routingKeys.forEach(function (item, key) {
                            q.bind(exchange.name, item);

                        })
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
    var connection = xconnections[name] || undefined;

    if(!connection) throw new Error('Connection : ' + name + ' not found')

    return  connection;
}





