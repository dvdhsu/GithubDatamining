/* Anthony Guo (anthony.guo@some.ox.ac.uk)
 * Module that polls github, and exposes an interface for registering
 * callbacks
 */


var http = require('http');
var https = require('https');
var github = require('octonode');


var client = github.client(process.env.OAUTHTOKEN);

var ghme = client.me();

var processed_events = {}; //tacky way of ensuring no duplicates. Technically a memory leak :o FIXME

var callbacks = []; //callbacks registered

var GLOBAL_HEADERS = null;

function PollsRemaining (){
    if (GLOBAL_HEADERS){
        return parseInt(GLOBAL_HEADERS['x-ratelimit-remaining']);
    } else {
        return -1;
    }
};

function log_state(){
    if (GLOBAL_HEADERS){
        console.log('Polls remaining: ' + GLOBAL_HEADERS['x-ratelimit-remaining']);
    }
    setTimeout(log_state, 20000);
}

function AddListener(callback){
    callbacks.push(callback);
}

function StartPolling(){
    client.get('/events', function(err, status, body, headers){
        GLOBAL_HEADERS = headers;
        if (err != null){
            console.log(err);
            setTimeout(StartPolling, 60*1000); // Wait a minute before trying again
        } else {
            //console.log('Polls remaining: ' + headers['x-ratelimit-remaining']);
            body.map(ProcessEvent);
            for (var p = 2; p <= 10; ++p){
                client.get('/events', { page: p }, function(err, status, body, headers){
                    if(body){
                        body.map(ProcessEvent);
                    }
                });
            }

            //We should use below...
            var next_poll_time = parseInt(headers['x-poll-interval']) * 1000;
            //But because we don't care about github's request to not poll so much
            next_poll_time = 30*1000 //We poll every 30 seconds. Ha!
            setTimeout(StartPolling, next_poll_time)
        }
    });
}

function ProcessEvent(ev){
    console.log('Processing event', ev.created_at, ':', ev.type);
    if (ev.id in processed_events){
        return;
    } else {
        processed_events[ev.id] = true;
        for (var i = 0; i != callbacks.length; ++i){
            callbacks[i](ev);
        }
    }
}

//We don't use this right now
function GetRepo(name, cb) {
    client.get('/repos/' + name, function(err, status, body, headers){
        if (headers){
            GLOBAL_HEADERS = headers;
        }
        if (err){
            if (err.message == 'Not Found'){
                cb('Not Found');
            } else {
                cb('Undefined');
            }
        } else {
            //console.log('Polls remaining: ' + headers['x-ratelimit-remaining']);
            cb(body);
        }
    });
};

//log_state();
module.exports = {
    //Adds a callback that will be called whenever new data is received from github 
    AddListener: AddListener,

    //Starts polling github for data
    StartPolling : StartPolling,

    //Gets a repository via the GitHub api
    GetRepo: GetRepo,

    PollsRemaining: PollsRemaining
}
