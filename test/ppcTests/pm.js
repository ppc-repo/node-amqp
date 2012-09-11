var config = require('../config/config.js');
var riak = require('riak-js').getClient({host: '10.191.11.151', port: 8098, api: 'http'});

module.exports.processQueuedMessage = processQueuedMessage;


function processQueuedMessage(payload, headers, deliveryInfo, msg) {

    //console.info(msg);
    var bucket =  'stats';
    var key  = payload.processId + '-' + payload.timestamp;
    riak.save(bucket, key, payload, {returnbody : true},  function(err, result, meta) {



        if(meta.statusCode === 200)  {
            msg.acknowledge();
            console.info('Message Save to RIAK process ID:' + payload.processId);
        }
        else {
            if(err) console.log(err);
            msg.reject();
        }



    });

}