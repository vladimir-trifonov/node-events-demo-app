var util = require('util');
var EventEmitter = require('events');

function BotService () {
	EventEmitter.call(this);
}
util.inherits(BotService, EventEmitter);

BotService.prototype.run = function(action) {
	console.log(action);
}

module.exports = new BotService();