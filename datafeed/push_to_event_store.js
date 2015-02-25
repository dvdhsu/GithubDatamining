var MongoService = require('./mongodb/service.js')
var EventStoreService = require('./eventstore/service.js');

MongoService.GetEventStream()
    .each(EventStoreService.ProcessEvent)
    .error(function(err){
        console.log(err);
    });
