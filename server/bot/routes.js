var ctrl = require('./controller');

module.exports = function (app) {
	app.post('/bots/:action', ctrl.run);
}