var service = require('./service');
var routes = require('./routes');
module.exports = function(app) {
	routes(app);
	return service;
}