/* Anthony Guo (anthony.guo@some.ox.ac.uk)
 * Code that pushes data into our mongodb
 */

var mongodb = require('mongodb');
var monk = require('monk');
var db = monk('localhost:27017/github_db')

function ProcessEvent(ev) {
    var events = db.get('events');
    
    ev._id = parseInt(ev.id);
    //Mongo ids have specific types. Simplest solution is to convert the id to an integer
    //http://stackoverflow.com/questions/26453507/argument-passed-in-must-be-a-single-string-of-12-bytes
    
    events.insert(ev, function (err, doc) {
        if (err) {
            console.log(err);
        } else {
      //console.log('Succeeded in pushing data into mongodb');
        }
    });
}

function SetIndexes() {
    var events = db.get('events');
    events.index('created_at _id');
}


function GetEventStream() {
    var events = db.get('events');
    return events.find({}, { stream: true, sort: { created_at: 1 } });
}

function GetEventPageIterator(page_size) {
    var events = db.get('events');
    var last_id = null;
    var hasNext = true;
    return {
        getNext: function () {
            //console.log('GETTING NEXT: ' + page_size);
            if (last_id == null) {
                //First page
                var promise = events.find({}, { limit: page_size, sort: { created_at: 1, _id: 1 } });
                promise.on('success', function (docs) {
                    var last_doc = docs[docs.length - 1];
                    last_id = last_doc._id;
                });
                return promise;
            } else {
                var promise = events.find({ _id: { $gt : last_id } }, { limit: page_size, sort: { created_at: 1, _id: 1 } });
                promise.on('success', function (docs) {
                    var last_doc = docs[docs.length - 1];
                    if (last_doc) {
                        last_id = last_doc._id;
                    } else {
                        hasNext = false;

                    }
                });
                return promise;
            }
        },
        hasNext: function () {
            return hasNext;
        }
    }
}


function GetRepo(repo_id) {
    var repos = db.get('repos');
    return repos.findOne({ _id: repo_id }, {});
}

function GetRepos(repo_id_list) {
    var repos = db.get('repos');
    return repos.find({ _id: { $in: repo_id_list } }, {});
}

function InsertRepo(repo) {
    var repos = db.get('repos');
    repos.insert(repo, function (err, doc) {
        if (err) {
            console.log(err);
        } else {
            console.log('Succeeded in adding repository!');
        }
    })
}

function GetAllUsers() {
    var users = db.get('users');
    return users.find({}, {});
}

function InsertUser(user) {
   var users = db.get('users');
    users.insert(user, function (err, doc) {
        if (err) {
            console.log(err);
        } else {
            console.log('Succeeded in adding user!');
        }
    });
}

function UpdateUser(user){
    var users = db.get('users');
    return users.update({ id: user.id }, user);
}

SetIndexes();

module.exports = {
    //Processes an event and pushes it to our mongodb database
    ProcessEvent: ProcessEvent,
    
    //Returns a promise object that can be iterated on for each event
    // using the syntax GetEventStream().each(function(...))
    GetEventStream: GetEventStream,
    
    //Returns an object that iterates through pages of events
    GetEventPageIterator: GetEventPageIterator,
    
    //Gets a repository
    GetRepo : GetRepo,
    
    //Gets all the users
    GetAllUsers: GetAllUsers,
    
    UpdateUser: UpdateUser, 
    //Gets a list of repositories
    GetRepos: GetRepos,
    
    //Inserts a repository into the repos database
    InsertRepo: InsertRepo,
    //Inserts a repository into the repos database
    InsertUser: InsertUser
}
