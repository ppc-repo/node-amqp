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
                    if(config.usedForLogging)  q = 1;
                }
                Object.keys(config.queues).forEach(function(value, key) {
                    connection.queue(value.name, value.options, function(queue) {
                        value.routingKeys.forEach(function (routeKey, index) {
                            queue.bind(exchange.name,routeKey);
                            console.log(queue +  ' binding of ' + routeKey  + ' to ' +  exchange.name);
                        });
                    });


                });

            })
        }
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






