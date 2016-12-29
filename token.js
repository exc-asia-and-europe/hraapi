var jwt = require('jsonwebtoken'); // used to create, sign, and verify tokens
var config = require('./config'); // get our config file

module.exports = {
	check: function(req, res, next) {
		if(req.signedCookies['x-access-token']){
			var token = req.signedCookies['x-access-token'];
			jwt.verify(token, config.secret, function(err, decoded) {
		    	if (err) return next(err);
		    	/*console.log("%j", decoded);*/
				req.userMetadata = decoded;
				res.locals.userMetadata = req.userMetadata;
	    		next();
			});
		}else{
			req.userMetadata = {
				userId: "guest",
			    fullName: "Guest User",
    			displayName: "Guest User",
    			email: "",
    			groups: {
	      			ldap: [],
	      			local: []
    			}
			};
			res.locals.userMetadata = req.userMetadata;
			return next();
		}
		
  }
}