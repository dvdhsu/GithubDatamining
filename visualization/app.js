/** Server backend for the website
*/


var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var WebsocketHandler = require('./app/websocket/handler.js');

var MongoService = require('./app/mongodb/service.js');

//var RealTime = require('./app/realtime/data.js');
//RealTime.AddTickHandler(function(data){
////broadcast the data to everybody
//io.emit('realtime_data', data)
//})

console.log(io);

//socket.io routing
io.on('connection', function (socket) {
    console.log('a user connected');
    WebsocketHandler.HandleSocket(socket);
    socket.on('toprepos', function () {
        console.log('toprepos asked for ');
        var promise = MongoService.GetAllRepos();
        promise.success(function (docs) {
            socket.emit('toprepos', docs.slice(0, 200));
        });
    })
    socket.on('topusers', function () {
        console.log('topusers asked for ');
        var promise = MongoService.GetAllUsers();
        promise.success(function (docs) {
            console.log('sending down the docs!');
            console.log(docs[0]);
            docs = docs.map(function(doc){
              if (doc.starred_repos){
                doc.starred_repos = doc.starred_repos.map(function(repo){
                  return {id: repo.id}
                });
              }
              return doc;
            });
            socket.emit('topusers', docs.slice(0,200));
        });
        promise.error(function (e){
            console.log(e);
        })
    })
});

app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');

app.get('/visualisation', function (req, res) {
  res.render('pages/visualisation', {
    title: "Graph visualisation"
  });
});

//Serve static content from the  ./www directory
app.use(express.static('www'))

var server = http.listen(2000, function () {
    var host = server.address().address
    var port = server.address().port
    console.log('Example app listening at http://%s:%s', host, port)
})
