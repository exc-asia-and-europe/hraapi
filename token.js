var jwt = require('jsonwebtoken'); // used to create, sign, and verify tokens
var config = require('./config'); // get our config file

module.exports = {
	check: function(req, res, next) {
		if(req.headers["x-access-token"]){
			var token = req.headers["x-access-token"];
			jwt.verify(token, config.secret, function(err, decoded) {
		    	if (err) return next(err);
		    	/*console.log("%j", decoded);*/
				req.userMetadata = decoded;
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
			return next();
		}
		
  }
}