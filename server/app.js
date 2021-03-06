var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var bodyParser = require('body-parser');

app.use(express.static('./static'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
var bot = require('./bot')(app);

server.listen(process.env.PORT || 8000, function () {
  console.log('Server started on port 8000');
});

io.on('connection', function (socket) {
  socket.send(socket.id);

  // Notify the new user about the last state of the bots(if it's 'dance' only)
  initState(bot.getLastState());
});

// Broadcast the bot's state
bot.on('animate', function (data) {
  io.sockets.emit('animate', data);
});

function initState(state) {
  Object.keys(state)
    .filter(function (botName) {
      return state[botName] === 'dance';
    })
    .forEach(function (botName) {
      socket.emit('animate', { sender: null, name: botName, action: 'dance' });
    });
}