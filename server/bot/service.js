var util = require('util');
var EventEmitter = require('events');
var state = {};

function BotService() {
	EventEmitter.call(this);
}
util.inherits(BotService, EventEmitter);

BotService.prototype.run = function (user, bot, action) {
	state[bot] = action;
	this.emit('animate', { sender: user, name: bot, action: action });
}

BotService.prototype.getLastState = function () {
	return state;
}

module.exports = new BotService();