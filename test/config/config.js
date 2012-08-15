var config = exports;
var winston = require('winston');

config.gateway = {
    enabled : true
    , name : 'gateway'
    , options : { host: 'arch-lb-01.dev.purchasingpwr.com'
        , port: 5672
        , login: 'svc-router'
        , password: 'svc-router'
        , vhost: 'communication-external'
        , heartbeat : 10
    }
    , implOptions : { defaultExchangeName: 'svc.gateway'
        , reconnect: true
        , reconnectBackoffStrategy: 'linear'
        , reconnectBackoffTime: 1000
    }
    , exchangeConnectParams: {
        type: 'direct'
        , durable: true
        , passive: false
        , autoDelete: false
    }
};


config.alerts = {
    enabled : true
    , name : 'alert'
    , usedForLogging : true
    , loggerType : winston.transports.WinstonAmqp
    , options : { host: 'arch-lb-01.dev.purchasingpwr.com'
        , port: 5672
        , login: 'alert-client'
        , password: 'alert-client'
        , vhost: 'control-channel'
        , heartbeat : 55
    }
    , implOptions : { defaultExchangeName: 'control.gateway'
        , reconnect: true
        , reconnectBackoffStrategy: 'linear'
        , reconnectBackoffTime: 1000
    }
    , exchangeConnectParams: {
        type: 'topic'
        , durable: true
        , passive: false
        , autoDelete: false
    }
    , queues: { alertsTrace : { enabled : true
        , name : 'alerts-trace'
        , options: {passive: false, durable: false, exclusive: false, autoDelete: false}
        , routingKeys: ['*.trace.log'] }
        , alertsDebug : { enabled : true
            , name : 'alerts-debug'
            , options: {passive: false, durable: false, exclusive: false, autodDlete: false}
            , routingKeys: ['*.debug.log']}
        , alertsInfo : { enabled : true
            , name : 'alerts-info'
            , options: {passive: false, durable: false, exclusive: false, autoDelete: false}
            , routingKeys: ['*.info.log']}
        , alertsWarn : { enabled : true
            , name : 'alerts-warn'
            , options: {passive: false, durable: true, exclusive: false, autoDelete: false}
            , routingKeys: ['*.warn.log']}
        , alertsError : { enabled : true
            , name : 'alerts-error'
            , options: {passive: false, durable: true, exclusive: false, autoDelete: false}
            , routingKeys: ['*.error.log']}
        , altersFatal : { enabled : true
            , name : 'alerts-fatal'
            , options: {passive: false, durable: true, exclusive: false, autoDelete: false}
            , routingKeys: ['*.fatal.log']}
    }
};
