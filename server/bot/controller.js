var service = require('./service');
exports.run = function(req, res) {
	service.run(req.params('action'));
	res.sendStatus(200);
}