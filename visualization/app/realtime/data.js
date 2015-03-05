/** Anthony Guo
 * Reads data from mongodb every second, and pushes it out
 */

var MongoService = require('./../mongodb/service.js');
var moment = require('moment');

var PAGE_SIZE = 2000;
var EventIterator = MongoService.GetEventPageIterator(PAGE_SIZE);
var queue = []

var callbacks = [];

function AddTickHandler(callback){
    callbacks.push(callback);
}

function ProcessPage(){
    var promise = EventIterator.getNext(); 
    promise.success(function(docs){
        for (var i = 0; i != docs.length; ++i){
            var ev = docs[i];
            if (!ev.repo){
                return;
            }
            var id = parseInt(ev.repo.id);
            queue.push(ev);
        }
    });
}

function EmitTick(events){
    for (var i = 0; i != callbacks.length; ++i){
        callbacks[i](events);
    }
}



function StartTicking(){
    if (queue.length < 1000){
        ProcessPage();
    } else {
        var events = [];
        var ev = queue.shift();
        var first_time = moment(ev.created_at);
        console.log(first_time.format('DD:hh:mm:ss'));
        while (!ev || !ev.created_at){
            ev = queue.shift();
        }
        while (moment(ev.created_at).diff(first_time, 'seconds') < 1){
            events.push(ev);
            ev = queue.shift();
        }
        EmitTick(events);
    }
    setTimeout(StartTicking, 900);
}


StartTicking();
module.exports = {
    AddTickHandler: AddTickHandler
}
