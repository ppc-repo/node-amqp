var amqp = require('./amqp');

module.exports.getConnection = getConnection;

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
    var connection = amqp.createConnection(config.options, config.implOptions);

    var amqpConnection = {
        name : name,
        config : config,
        connection : connection,
        exchange : undefined,
        queues : undefined
    };

    connection.on('ready', function () {
        console.log('Connection ' + name  + ' is ready ' ) ;
        if(config.exchangeConnectParams) {
            connection.exchange(config.implOptions.defaultExchangeName, config.exchangeConnectParams, function (exchange) {
                console.log('Exchange ' + exchange.name  + ' for Connection ' + name + ' is open ' ) ;
                amqpConnection.exchange = exchange;
                if(config.queues) {
                    // TODO logic to add a logging appender
                    if(config.usedForLogging)  q = 1;
                    var queues = config.queues;
                    Object.keys(queues).forEach(function(value, key) {
                        console.log (queues[value]);
                        var queue = queues[value];
                        if(queue.enabled) {
                            connection.queue(queue.name, queue.options, function(newQueue) {
                                console.info(queue.name + ' On Exchange ' + exchange.name + ' for Connection ' + name + ' is open');
                                amqpConnection.queues.push(newQueue);
                                // TODO put in logic to handle more than the first routing key
                                newQueue.bind(exchange.name, queue.routingKeys[0]);
                                console.info('Routing Key ' + queue.routingKeys[0] + ' for Queue ' + queue.name + ' bound to Exchange ' +  exchange.name + ' for Connection ' + name + ' is open');
                            });
                        };
                    });
                };
            });
        };
    });

    connection.on('error', function (err) {
        console.log('Connection ' + name  + ' ' + err  ) ;
    });

    connection.on('close', function () {
        console.log('Connection ' + name  + ' has been closed ' ) ;
    });


    connection.on('heartbeat', function () {
        console.log('Heartbeat for Connection ' + name ) ;
    });



    connections.push(amqpConnection);

    return amqpConnection;

}






