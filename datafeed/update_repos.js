var MongoService = require('./mongodb/service.js')
var GithubService = require('./github/service.js');
var BATCH_SIZE = 2000;
var PAGE_SIZE = 2000;
var GITHUB_POLL_TIME = 500;
var SUSTAINABLE_POLL = true;
var GITHUB_CONSUMERS; 


if (SUSTAINABLE_POLL){
    GITHUB_CONSUMERS = 3;
} else {
    GITHUB_CONSUMERS = 10;
}

// Queue that contains raw events from the database 
var queue = []

//Queue that contains repositories that we need to get from github
var github_queue = [];

//A null repository
var NULL_REPO = {
    'name' : 'NULL_REPO',
    'null' : true,
}


//Iterate via pages
var EventIterator = MongoService.GetEventPageIterator(PAGE_SIZE);

//repo ids that we have processed
var processed_repos = {}

//Each iteration will read a page of events, and add it to the first queue
function ProcessPage(){
    if (EventIterator.hasNext()){
        var promise = EventIterator.getNext(); 
        promise.success(function(docs){
            if (docs.length == 0){
                console.log('DONE PROCESSING');
                return;
            }
            console.log(docs[0].created_at + ': processing');
            for (var i = 0; i != docs.length; ++i){
                var ev = docs[i];
                if (!ev.repo){
                    return;
                }
                var id = parseInt(ev.repo.id);
                queue.push({
                    id : id,
                    repo: ev.repo,
                    doc: ev
                });
            }
            if (github_queue.length < 100){
                setTimeout(ProcessPage, 50);
            } else {
                setTimeout(ProcessPage, 10000);
            }
        });
    }
}

//Processes the first queue, and adds repositories we need to the github_queue
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
            for (var e = 0; e != events.length; ++e){
                var ev = events[e];
                if (!ev.repo){
                    continue;
                }
                //process.stdout.write(ev.created_at + ': ');
                var have_repo = false;
                for (var i = 0; i != docs.length; ++i){
                    var repo = docs[i];
                    if (parseInt(ev.repo.id) == repo._id){
                        have_repo = true;
                        break;
                    }
                }
                if (!have_repo){
                    github_queue.push(ev);
                }
            }
        });
        promise.complete(function(){
            setTimeout(ProcessQueue, 100);
        });
    } else {
        setTimeout(ProcessQueue, 100);
    }
}

//Processes github_queue and makes github api requests
function ProcessGithubQueue(){
    if (github_queue.length > 0){
        var ev = github_queue.shift();
        var repo = ev.repo;
        //console.log(ev.created_at + ' : querying github');

        if (repo.id in processed_repos){
            setTimeout(ProcessGithubQueue, 1); //Should allow for autopilot without capping our limit
        } else {
            processed_repos[repo.id] = true;
            GithubService.GetRepo(repo.name, function(full_repo){
                console.log('Polls remaining: ' + GithubService.PollsRemaining());
                if (full_repo == 'Undefined'){
                    console.log('Unspecified error - slowing down the poll!');
                    setTimeout(ProcessGithubQueue, 30*1000); //sleep for 30 seconds
                    return;
                } else if (full_repo == 'Not Found'){
                    console.log(ev.created_at + ': Could not find full_repo, inserting null repo');
                    NULL_REPO._id = parseInt(repo.id);
                    MongoService.InsertRepo(NULL_REPO);
                } else if (repo.id != full_repo.id){ //repo deleted and replaced with another one with the same name?
                    console.log(ev.created_at + ': Repo id has changed, inserting null repo');
                    console.log(repo.id + ' : ' + full_repo.id);
                    NULL_REPO._id = parseInt(repo.id);
                    MongoService.InsertRepo(NULL_REPO);
                } else {
                    full_repo._id = parseInt(full_repo.id);
                    console.log(ev.created_at + ': Adding new repo...');
                    MongoService.InsertRepo(full_repo);
                }
                setTimeout(ProcessGithubQueue, GITHUB_POLL_TIME);
            });
        }
    } else {
        setTimeout(ProcessGithubQueue, 100); 
    }
}

//Start everything off
ProcessPage();
ProcessQueue();
ProcessQueue();
for (var i = 0; i < GITHUB_CONSUMERS; ++i){
    ProcessGithubQueue();
}
