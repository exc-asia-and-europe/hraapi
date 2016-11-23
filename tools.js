var url = require('url');
var config = require('./config'); // get our config file

var Tools = {
	fullUrl: function(req) {
	  return url.format({
	    protocol: req.protocol,
	    hostname: req.hostname,
	    port: req.app.settings.port,
	    pathname: req.originalUrl
	  });
	}
};

module.exports = Tools;