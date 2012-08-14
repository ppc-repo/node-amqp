var amqp = require('./amqp');

module.exports.getConnection = getConnection;
module.exports.publish = publish;

var connections = [];
//var connection = {};

function getConnection(config, name) {
    var connection = undefined;
    if(name === undefined) name = config.name;
    //var amqpConection = undefined;
    connections.forEach(function(value) {
      if(value.name === name) connection = value;
    })
    if(connection !== undefined)  return connection;

    connection = createConnection(config, name)

    return connection;
};

function createConnection(config, name) {
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
                    if(config.usedForLogging)  q = 1;
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
        logger.log('Connection ' + name  + ' ' + err  ) ;
    });

    connection.on('close', function () {
        logger.log('Connection ' + name  + ' has been closed ' ) ;
    });


    connection.on('heartbeat', function () {
        logger.log('Heartbeat for Connection ' + name ) ;
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







