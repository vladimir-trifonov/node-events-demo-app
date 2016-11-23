var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var bodyParser = require('body-parser');

app.use(express.static('./static'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
var bot = require('./bot')(app);

server.listen(8000, function() {
	console.log('Server started on port 8000');
});

io.on('connection', function (socket) {
  socket.send(socket.id);

  bot.on('animate', function(data) {
    socket.emit('animate', data);
  });
});