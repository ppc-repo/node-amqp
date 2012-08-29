var config = exports;


config.connections = [{ vhost : 'message-services'
                       , host: 'arch-lb-01.dev.purchasingpwr.com'
                       , port: 5672
                       , login: 'svc-router'
                       , password: 'svc-router'
                       , heartbeat : 0
                       , enabled : true
                       , defaultRouterConnection : true
                       , implOptions: {defaultExchangeName: 'svc.gateway', reconnect: true, reconnectBackoffStrategy: 'linear', reconnectBackoffTime: 1000}
                    },
                     { vhost : 'control-services'
                       , host: 'arch-lb-01.dev.purchasingpwr.com'
                       , port: 5672
                       , login: 'svc-router'
                       , password: 'svc-router'
                       , heartbeat : 0
                       , enabled : true
                       , defaultRouterConnection : false
                       , implOptions: {defaultExchangeName: 'control.gateway', reconnect: true, reconnectBackoffStrategy: 'linear', reconnectBackoffTime: 1000}
                    }];


config.exchanges = [
                    { name : 'svc.gateway'
                    , vhost : 'message-services'
                    , isDefault : true
                    , enabled : true
                    , options : {type: 'direct', durable: true , passive: false, autoDelete: false, arguments : {'alternate-exchange' :	'undeliverable.gateway'}}
                    },
                    { name : 'undeliverable.gateway'
                     , vhost : 'message-services'
                     , isDefault : false
                     , enabled : true
                     , options : {type: 'topic', durable: true , passive: false, autoDelete: false, arguments : {}}
                    },
                    { name : 'control.gateway'
                    , vhost : 'control-services'
                    , isDefault : true
                    , enabled : true
                    , options : {type: 'topic', durable: true , passive: false, autoDelete: false, arguments :  {}}
                    , logger : { appender : require('../../lib/amqpFactory').amqpLogger
                        , logLevel : 'info'
                        , name : 'queueLogger'
                        , appName : 'router'
                        , publishOptions : { mandatory : true, immediate : false, deliveryMode : 1}
                    }
                    }
                   ];


config.queues = [
                 { name : 'undeliverable.messages'
                 , exchange : 'svc.gateway'
                 , enabled : true
                 , options: {passive: false, durable: true, exclusive: false, autoDelete: false}
                 , routingKeys: ['#']
                 },
                 { name : 'alert.trace'
                 , exchange : 'control.gateway'
                 , enabled : true
                 , options: {passive: false, durable: true, exclusive: false, autoDelete: false}
                 , routingKeys: ['*.alter.log']
                 },
                 { name : 'alert.debug'
                 , exchange : 'control.gateway'
                 , enabled : true
                 , options: {passive: false, durable: true, exclusive: false, autoDelete: false}
                 , routingKeys: ['*.debug.log']
                 },
                 { name : 'alert.info'
                 , exchange : 'control.gateway'
                 , enabled : true
                 , options: {passive: false, durable: true, exclusive: false, autoDelete: false}
                 , routingKeys: ['*.info.log']
                 },
                 { name : 'alert.warn'
                 , exchange : 'control.gateway'
                 , enabled : true
                 , options: {passive: false, durable: true, exclusive: false, autoDelete: false}
                 , routingKeys: ['*.warn.log']
                 },
                 { name : 'alert.error'
                 , exchange : 'control.gateway'
                 , enabled : true
                 , options: {passive: false, durable: true, exclusive: false, autoDelete: false}
                 , routingKeys: ['*.error.log']
                 } ,
                 { name : 'alert.fatal'
                 , exchange : 'control.gateway'
                 , enabled : true
                 , options: {passive: false, durable: true, exclusive: false, autoDelete: false}
                 , routingKeys: ['*.fatal.log']
                 }
];
