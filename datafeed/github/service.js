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
function AddListener(callback){
    callbacks.push(callback);
}

function DownloadEvents(){
    client.get('/events', function(err, status, body, headers){
        if (err != null){
            console.log(err);
            setTimeout(DownloadEvents, 60*1000); // Wait a minute before trying again
        } else {
            console.log('Polls remaining: ' + headers['x-ratelimit-remaining']);
            body.map(ProcessEvent);
            for (var p = 2; p <= 10; ++p){
                client.get('/events', { page: p }, function(err, status, body, headers){
                    body.map(ProcessEvent);
                });
            }

            //We should use below...
            var next_poll_time = parseInt(headers['x-poll-interval']) * 1000;
            //But because we don't care about github's request to not poll so much
            next_poll_time = 30*1000 //30 seconds
            setTimeout(DownloadEvents, next_poll_time)
        }
    });
}

function ProcessEvent(ev){
    console.log('Processing event', ev.created_at, ':', ev.type);
    if (ev.id in processed_events){
        console.log('DUPLICATE EVENT');
        return;
    } else {
        processed_events[ev.id] = true;
        for (var i = 0; i != callbacks.length; ++i){
            callbacks[i](ev);
        }
    }
}

//We don't use this right now
function fetchRepoInfo(name, cb) {
    var request = https.get({
        host: 'api.github.com',
        path: '/repos/' + name,
        headers: {
            'User-Agent': 'Github-Dataminer',
            "Authorization": "token " + process.env.OAUTHTOKEN
        }
    }, function(res) {
        var data = '';
        res.on('data', function(chunk) {
            data += chunk;
        });
        res.on('end', function() {
            cb(JSON.parse(data));
        });
    }).on('error', function(e) {
        console.error(e);
    });
};

module.exports = {
    //Adds a callback that will be called whenever new data is received from github 
    AddListener: AddListener,

    //Starts polling github for data
    StartPolling : DownloadEvents
}
