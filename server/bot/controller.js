var service = require('./service');
exports.run = function(req, res) {
	service.run(req.body.user, req.params.bot, req.params.action);
	res.sendStatus(200);
}