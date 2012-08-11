var config = exports;

config.gateway = {
    enabled : false
    , name : 'gateway'
    , options : { host: 'arch-lb-01.dev.purchasingpwr.com'
                , port: 5672
                , login: 'http-router'
                , password: 'http-router'
                , vhost: 'communication-external'
                }
    , implOptions : { defaultExchangeName: 'svc.gateway'
                    , reconnect: true
                    , reconnectBackoffStrategy: 'linear'
                    , reconnectBackoffTime: 1000
                    , heartbeat : 5
                    , heartbeatIntervalSec : 60
                    }
    , exchangeConnectParams: {
         type: 'direct'
        , durable: true
        , passive: false
        , autoDelete: false
    }
};