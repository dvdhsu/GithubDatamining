/* Anthony Guo (anthony.guo@some.ox.ac.uk)
 * Code that pushes data into our mongodb
 */

var mongodb = require('mongodb');
var monk = require('monk');
var db = monk('localhost:27017/github_db')

function ProcessEvent(ev){
    var events = db.get('events');

    ev._id = parseInt(ev.id); 
    //Mongo ids have specific types. Simplest solution is to convert the id to an integer
    //http://stackoverflow.com/questions/26453507/argument-passed-in-must-be-a-single-string-of-12-bytes
    
    events.insert(ev, function(err, doc){
        if (err){
            console.log(err);
        } else {
            //console.log('Succeeded in pushing data into mongodb');
        }
    });
}

function GetEventStream(){
    var events = db.get('events');
    return events.find({}, { stream: true, sort: { created_at: 1} });
}

function GetRepo(repo_id){
    var repos = db.get('repos');
    return repos.findOne({_id: repo_id}, {});
}

function InsertRepo(repo){
    var repos = db.get('repos');
    repos.insert(repo, function(err, doc){
        if (err){
            console.log(err);
        } else {
            //console.log('Succeeded in adding repository!');
        }
    })
}

module.exports = {
    //Processes an event and pushes it to our mongodb database
    ProcessEvent: ProcessEvent,

    //Returns a promise object that can be iterated on for each event
    // using the syntax GetEventStream().each(function(...))
    GetEventStream: GetEventStream,

    //Inserts a repository into the repos database
    InsertRepo: InsertRepo
}
