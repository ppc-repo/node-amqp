var amqp = require('./amqp');
var winston = require('winston') ;
module.exports.getConnection = getConnection;
module.exports.publish = publish;
amqpLogger = require('./logger/winstonAmqp');
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
    var logger = process.logger || console;
    var connection = amqp.createConnection(config.options, config.implOptions);

    var amqpConnection = {
        name : name,
        config : config,
        connection : connection,
        exchange : undefined,
        queues : []
    };

    connection.on('ready', function () {
        logger.log('Connection ' + name  + ' is ready ' ) ;
        if(config.exchangeConnectParams) {
            connection.exchange(config.implOptions.defaultExchangeName, config.exchangeConnectParams, function (exchange) {
                logger.log('Exchange ' + exchange.name  + ' for Connection ' + name + ' is open ' ) ;
                amqpConnection.exchange = exchange;
                if(config.queues) {
                    // TODO logic to add a logging appender
                    if(config.usedForLogging)  logger.add(config.loggerType, { appName: 'amqpTest', level : 'info' }) ;
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
        logger.info('Connection ' + name  + ' ' + err  ) ;
    });

    connection.on('close', function () {
        logger.info('Connection ' + name  + ' has been closed ' ) ;
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



function heartbeat(connection, interval) {

}







