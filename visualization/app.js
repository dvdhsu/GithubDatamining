/** Server backend for the website
*/


var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var WebsocketHandler = require('./app/websocket/handler.js');

var RealTime = require('./app/realtime/data.js');

RealTime.AddTickHandler(function(data){
    //broadcast the data to everybody
    io.emit('realtime_data', data)
})

console.log(io);

//socket.io routing
io.on('connection', function(socket){
    console.log('a user connected');
    WebsocketHandler.HandleSocket(socket);
});

//Serve static content from the  ./www directory
app.use(express.static('www'))

var server = http.listen(2000, function () {
    var host = server.address().address
    var port = server.address().port
    console.log('Example app listening at http://%s:%s', host, port)
})
