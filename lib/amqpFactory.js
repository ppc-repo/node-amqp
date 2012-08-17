var amqp = require('./amqp');
var winston = require('winston') ;
var util = require('util');
module.exports.getConnection = getConnection;
module.exports.publish = publish;
module.exports.rpc = rpc;

exports.amqpLogger = require('./loggers/winstonAmqp').WinstonAmqp  ;

var connections = [];
//var connection = {};

function getConnection(name, config) {
    var connection = undefined;
    if(name === undefined) name = config.name;
    //var amqpConection = undefined;
    connections.forEach(function(value) {
      if(value.name === name) connection = value;
    })
    if(connection !== undefined)  return connection;

    connection = createConnection(name, config)

    return connection;
};

function createConnection(name, config) {

    var amqpConnection = {
        name : name,
        config : config,
        connection : connection,
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
        mqpConnection.hasLogger = false;
        logger = console;
    }
    var connection = amqp.createConnection(config.options, config.implOptions);
    amqpConnection.connection = connection;

    connection.on('ready', function () {
        logger.log('Connection ' + name  + ' is ready ' ) ;
        amqpConnection.isReady = true;
        if(config.exchangeConnectParams) {
            connection.exchange(config.implOptions.defaultExchangeName, config.exchangeConnectParams, function (exchange) {
                logger.log('Exchange ' + exchange.name  + ' for Connection ' + name + ' is open ' ) ;
                amqpConnection.exchange = exchange;
                if(config.queues) {
                    // TODO logic to add a logging appender
                    if(config.usedForLogging)  {
                        if(amqpConnection.hasLogger) {
                            try {
                                logger.add(config.loggerType, { connectionName: name , appName: 'amqpTest', level : 'info' }) ;
                                logger.info('Logger Transport added to Connection ' + name);
                                amqpConnection.loggerAdded = true;
                            }
                            catch (err) {
                                logger.warn('Could Not Add AMQP logger transport ['+ config.loggerType + '] to Connection ' + name + ' Error: ' + err);
                                amqpConnection.loggerAdded = false;
                            }
                        }
                    }
                    var queues = config.queues;
                    Object.keys(queues).forEach(function(value, key) {
                        var queue = queues[value];
                        if(queue.enabled) {
                            connection.queue(queue.name, queue.options, function(newQueue) {
                                logger.info(queue.name + ' On Exchange ' + exchange.name + ' for Connection ' + name + ' is open');
                                amqpConnection.queues.push(newQueue);
                                // TODO put in logic to handle more than the first routing key
                                newQueue.bind(exchange.name, queue.routingKeys[0]);
                                logger.info('Routing Key ' + queue.routingKeys[0] + ' for Queue ' + queue.name + ' bound to Exchange ' +  exchange.name + ' for Connection ' + name + ' is open');
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
        if(amqpConnection.hasLogger) {
            logger.remove(config.loggerType);
        }
        amqpConnection.loggerAdded = false;
        amqpConnection.exchange = undefined;
    });


    connection.on('heartbeat', function () {
        logger.debug('Heartbeat for Connection ' + name ) ;
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










