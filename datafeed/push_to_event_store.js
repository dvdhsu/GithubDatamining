/*Anthony Guo (anthony.guo@some.ox.ac.uk)
 * Pushes data from mongodb to event store
 */

var MongoService = require('./mongodb/service.js')
var EventStoreService = require('./eventstore/service.js');

var BATCH_SIZE = 1000;
var PAGE_SIZE = 2000;
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
            console.log(docs.length);
            for (var i = 0; i != docs.length; ++i){
                var repo = docs[i];
                var found_repo = false;
                for (var j = 0; j != events.length; ++j){
                    if (events[j].repo && parseInt(events[j].repo.id) == repo._id){
                        events[j].repo.language = repo.language;
                    }
                }
            }
            EventStoreService.ProcessEvents(events);
            setTimeout(ProcessQueue, 100);
        });
    } else {
        setTimeout(ProcessQueue, 100);
    }
}

ProcessPage();
ProcessQueue();
ProcessQueue();
