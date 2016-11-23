var ctrl = require('./controller');

module.exports = function (app) {
	app.post('/bots/:bot/actions/:action', ctrl.run);
}