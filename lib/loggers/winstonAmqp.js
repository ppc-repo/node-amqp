var util = require('util');
var winston = require('winston');
var  amqpFactory = require('../amqpFactory');

var WinstonAmqp = exports.WinstonAmqp = function (options) {
    //
    // Name this logger
    //
    this.name = 'winstonAmqp';

    //
    // Set the level from your options
    //
    this.appName = options.appName;
    this.level = options.level || 'info';
    this.options   = options;
    this.exchange = options.exchange;
    this.publish = options.publishOptions || {};

};

//
// Inherit from `winston.Transport` so you can take advantage
// of the base functionality and `.handleExceptions()`.
//
util.inherits(WinstonAmqp, winston.Transport);

 WinstonAmqp.prototype.log = function (level, msg, meta, callback) {

    if (this.silent) {
        return callback(null, true);
    }

    var self = this;
    var routingKey = self.appName + '.' + level + '.log';
    try {
        amqpFactory.publish(self.exchange ,routingKey, msg, self.publish);
    }
    catch(err){
        // do nothing;
    }


};


