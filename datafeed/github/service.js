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

function PollsRemaining() {
    if (GLOBAL_HEADERS) {
        return parseInt(GLOBAL_HEADERS['x-ratelimit-remaining']);
    } else {
        return -1;
    }
};

function log_state() {
    if (GLOBAL_HEADERS) {
        console.log('Polls remaining: ' + GLOBAL_HEADERS['x-ratelimit-remaining']);
    }
    setTimeout(log_state, 20000);
}

function AddListener(callback) {
    callbacks.push(callback);
}

function StartPolling() {
    client.get('/events', function (err, status, body, headers) {
        GLOBAL_HEADERS = headers;
        if (err != null) {
            console.log(err);
            setTimeout(StartPolling, 60 * 1000); // Wait a minute before trying again
        } else {
            //console.log('Polls remaining: ' + headers['x-ratelimit-remaining']);
            body.map(ProcessEvent);
            for (var p = 2; p <= 10; ++p) {
                client.get('/events', { page: p }, function (err, status, body, headers) {
                    if (body) {
                        body.map(ProcessEvent);
                    }
                });
            }
            
            //We should use below...
            var next_poll_time = parseInt(headers['x-poll-interval']) * 1000;
            //But because we don't care about github's request to not poll so much
            next_poll_time = 30 * 1000 //We poll every 30 seconds. Ha!
            setTimeout(StartPolling, next_poll_time)
        }
    });
}

function ProcessEvent(ev) {
    console.log('Processing event', ev.created_at, ':', ev.type);
    if (ev.id in processed_events) {
        return;
    } else {
        processed_events[ev.id] = true;
        for (var i = 0; i != callbacks.length; ++i) {
            callbacks[i](ev);
        }
    }
}

//We don't use this right now
function GetRepo(name, cb) {
    client.get('/repos/' + name, function (err, status, body, headers) {
        if (headers) {
            GLOBAL_HEADERS = headers;
        }
        if (err) {
            if (err.message == 'Not Found') {
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


function GetTopUsers(cb) {
    MIN_FOLLOWERS = 255;
    MAX_PAGES = 10;
    ghsearch = client.search();
    for (var page = 1; page <= 3; ++page) {
        ghsearch.users({
            page: page,
            per_page: 100,
            q: 'followers:>' + MIN_FOLLOWERS,
            sort: 'followers',
            order: 'desc'
        }, function (err, body) {
            var users = body.items;
            var processed_users = 0;
            users.map(function (user) {
                var sub_url = user.subscriptions_url;
                var start = sub_url.indexOf('/users');
                sub_url = sub_url.substr(start);
                client.get(sub_url, {}, function (err, status, body, headers) {
                    user.subscriptions = body;
                    processed_users += 1;
                    if (processed_users % 1 == 0) {
                        console.log('processed ' + processed_users + ' number of users so far');
                    }
                    if (processed_users == users.length) {
                        cb(users);
                    }
                });
            });
        });
    }
}

function GetStarredRepo(user, cb) {
    var starred_url = user.url + '/starred';
    var start = starred_url.indexOf('/users');
    starred_url = starred_url.substr(start);
    console.log(starred_url);
    client.get(starred_url, {}, function (err, status, body, headers) {
        console.log(status);
        var a = err;
        cb(body);
    });
}

function GetUserObject(user, cb){
    var user_url = user.url;
    var start = user_url.indexOf('/users');
    user_url = user_url.substr(start);
    client.get(user_url, {}, function (err, status, body, headers){
        cb(body);
    })
}

function GetTopRepos(cb) {
    MIN_STARS = 500;
    var ghsearch = client.search();
    for (var page = 1; page <= 10; ++page) {
        ghsearch.repos({
            page: page,
            per_page: 100,
            q: 'stars:>' + MIN_STARS,
            sort: 'stars',
            order: 'desc'
        }, function (err, body) {
            var repos = body.items;
            var processed_repos = 0;
            repos.map(function (repo) {
                var contrib_url = repo.contributors_url;
                var ghrepo = client.repo(repo.full_name);
                ghrepo.contributors(function (err, body, headers) {
                    repo.contributors = body;
                    processed_repos += 1;
                    if (processed_repos == repos.length) {
                        cb(repos);
                    }
                });
            });
        });
    }

}

//log_state();
module.exports = {
    //Adds a callback that will be called whenever new data is received from github 
    AddListener: AddListener,
    
    //Starts polling github for data
    StartPolling : StartPolling,
    
    //Gets a repository via the GitHub api
    GetRepo: GetRepo,
    
    GetTopUsers: GetTopUsers,
    
    GetTopRepos: GetTopRepos,
    
    GetStarredRepo: GetStarredRepo,
    
    GetUserObject: GetUserObject,
    
    PollsRemaining: PollsRemaining

}
