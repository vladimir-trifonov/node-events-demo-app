var util = require('util');
var EventEmitter = require('events');

function BotService() {
	EventEmitter.call(this);
}
util.inherits(BotService, EventEmitter);

BotService.prototype.run = function (user, bot, action) {
	this.emit('animate', { sender: user, name: bot, action: action });
}

module.exports = new BotService();