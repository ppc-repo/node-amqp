    var util = require('util')
    , winston = require('winston')
    , amqpFactory = require('amqp')
    ;

var AmqpLogger = winston.transports.AmqpLogger = function (connectionName, options) {
    //
    // Name this logger
    //
    this.name = 'amqpLogger';

    //
    // Set the level from your options
    //
    this.level = options.level || 'info';
    this.options   = options;
    this.connectionName = connectionName;
    this.appName = options.appName || 'unknown';

};

//
// Inherit from `winston.Transport` so you can take advantage
// of the base functionality and `.handleExceptions()`.
//
util.inherits(AmqpLogger, winston.Transport);

AmqpLogger.prototype.log = function (level, msg, meta, callback) {

    if (this.silent) {
        return callback(null, true);
    }

    var self = this;
    var routingKey = self.appName || '.' + level + '.log';
    amqpFactory.publish(self.connectionName ,routingKey, msg, false);

};