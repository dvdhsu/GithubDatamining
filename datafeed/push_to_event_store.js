var MongoService = require('./mongodb/service.js')
var EventStoreService = require('./eventstore/service.js');

var BATCH_SIZE = 1000;
var PAGE_SIZE = 1000;
var EventIterator = MongoService.GetEventPageIterator(PAGE_SIZE);
var queue = []

function ProcessPage(){
    var promise = EventIterator.getNext(); 
    promise.success(function(docs){
        console.log(docs[0].created_at);
        for (var i = 0; i != docs.length; ++i){
            var ev = docs[i];
            if (!ev.repo){
                return;
            }
            var id = parseInt(ev.repo.id);
            queue.push({
                doc: ev
            });
        }
        setTimeout(ProcessPage, 100);
    });
}

function ProcessQueue(){
    if (queue.length > BATCH_SIZE){
        var events = [];
        var repos = [];
        while (events.length < BATCH_SIZE){
            var ev = queue.shift().doc;
            if (ev.repo){
                repos.push(ev.repo);
            }
            events.push(ev);
        }
        var repo_ids = repos.map(function(repo){ return parseInt(repo.id); })

        var promise = MongoService.GetRepos(repo_ids);
        promise.success(function(docs){
            console.log("pushing " + BATCH_SIZE + " events into eventstore");
            for (var i = 0; i != docs.length; ++i){
                var repo = docs[i];
                for (var j = 0; j != events.length; ++j){
                    if (events[j].repo && events[j].repo.id == repo.id){
                        events[j].repo = repo;
                        break;
                    }
                }
            }
            EventStoreService.ProcessEvents(events);
            setTimeout(ProcessQueue, 100);
        });
        //function process_event(){
            //var length = JSON.stringify(events).length;
            //if (i >= BATCH_SIZE){
                //EventStoreService.ProcessEvents(events);
                //setTimeout(ProcessQueue, 100);
                //return;
            //}
            //++i;
            //var obj = queue.shift();
            //var ev = obj.doc;
            //console.log(obj.doc.created_at + ': processing');
            //if (ev.repo){
                //var p = MongoService.GetRepo(parseInt(ev.repo.id))
                //p.success(function(doc){
                    //if (doc != null){
                        //ev.repo = doc;
                    //}
                    //events.push(ev);
                    //process_event();
                //});
            //} else {
                //events.push(ev);
                //process_event();
            //}
        //}
        //process_event();
    } else {
        setTimeout(ProcessQueue, 100);
    }

}

ProcessQueue();
