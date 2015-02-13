/* general functions */
function guid() {
  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  }
  return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
    s4() + '-' + s4() + s4() + s4();
}

function toASCII(chars) {
    var ascii = '';
    for(var i=0, l=chars.length; i<l; i++) {
        var c = chars[i].charCodeAt(0);

        // make sure we only convert half-full width char
        if (c >= 0xFF00 && c <= 0xFFEF) {
           c = 0xFF & (c + 0x20);
        }

        ascii += String.fromCharCode(c);
    }

    return ascii;
}

var
  http = require('http'),
  https = require('https');

var timeUntilNextEvents = 10000;
var last_created_at = new Date(); 
var overlapped = false;

var updateTimers = function() {
  if(overlapped) {
    timeUntilNextEvents += 1000;
    overlapped = false;
  } else {
    timeUntilNextEvents -= 1000;
  }
}


var fetchRepoInfo = function(name, cb) {
 var request = https.get({ host: 'api.github.com', path: '/repos/' + name, 
   headers: { 'User-Agent': 'Github-Dataminer' ,
      "Authorization" : "token " + process.env.OAUTHTOKEN
   }}, function(res) {
    var data = '';
    res.on('data', function (chunk) {
      data += chunk;
    });
    res.on('end', function() {
      cb(JSON.parse(data));
    });
  }).on('error', function(e) {
    console.error(e);
  });
};

var pushEventIntoEventStore = function(ev){
  var body = toASCII(JSON.stringify([{
    eventId: guid(),
    eventType: ev.type,
    data: ev
  }]));
  var req = http.request({
      host: "127.0.0.1",
      port: 2113,
      path: "/streams/github-stream",
      method: "POST",
      headers: {
        "Content-Type": "application/vnd.eventstore.events+json; charset=utf-8",
        "Content-Length": body.length,
        "ES-EventType" : ev.type, //May be redundant?
        "ES-EventId" : guid()  //May be redundant?
      }
  }, function(res) {
      var data = '';
      res.on('data', function (chunk) {
        data += chunk;
      });
      res.on('end', function() {
        console.log(res.headers);
      });
    // Handle this
  });

  req.write(body)
  req.end()
}

var processEvent = function(ev) {
  console.log('Processing event', ev.created_at, ':', ev.type);
  if(ev.created_at < last_created_at) {
    console.log('Skipping event', ev.created_at);
    overlapped = true;
    return;
  }
  last_created_at = ev.created_at;
  if(ev.repo) {
    fetchRepoInfo(ev.repo.name, function(repo) {
      ev.repo = repo
      pushEventIntoEventStore(ev)
    })
  } else {
    pushEventIntoEventStore(ev)
  }
};

var processData = function(data) {
  var eventArray = JSON.parse(data);
  for(var i = eventArray.length-1 ; i >= 0; i--) {
    processEvent(eventArray[i]);
  }
  updateTimers();
};

var downloadEvents = function() {
  var request = https.get({ 
    host: 'api.github.com', 
    path: '/events',
    headers: { 
      'User-Agent': 'Github-Dataminer',
      "Authorization" : "token " + process.env.OAUTHTOKEN
    }}, function(res) {
          var data = '';
          res.on('data', function (chunk) {
            data += chunk;
          });
          res.on('end', function() {
            console.log(data);
            processData(data);
          });
        }).on('error', function(e) {
          console.error(e);
  });

  setTimeout(downloadEvents, timeUntilNextEvents);
  console.log('Waiting ' + timeUntilNextEvents + ' until reading API again');
};

var authenticateMe = function(cb){
  var body ="";
  var req = https.request({
      host: "api.github.com",
      //path: "/",
      method: "GET",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "Content-Length": body.length,
        'User-Agent': 'Github-Dataminer',
        "Authorization" : "token " + process.env.OAUTHTOKEN
      }
    }, function(res) {
      var data = '';
      res.on('data', function (chunk) {
        data += chunk;
      });
      res.on('end', function() {
        cb();
      });
      // Handle this
    });

  req.write(body)
  req.end()
}

authenticateMe(downloadEvents);
