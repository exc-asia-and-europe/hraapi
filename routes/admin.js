var express = require('express');
var ejs = require('ejs');
var adminRouter = express.Router();
var Token = require('../token');
var Manifests = require('../models/Manifests.js');
var Users = require('../models/Users.js');
var Permissions = require('../models/Permissions.js');

var bodyParser = require('body-parser');
var jsonParser = bodyParser.json();
// create application/x-www-form-urlencoded parser
var urlencodedParser = bodyParser.urlencoded({ extended: false });

/* GET /manifest */
/* get available manifests */

adminRouter.get('/', Token.check, Users.checkAdmin, function(req, res, next) {
	var	renderObject;
	renderObject = {
		subtitle: "HRA IIIF API Frontend",
		admin: req.userMetadata.admin
/*		admin: true*/
	};
	res.render('pages/admin/collectionsAndManifests', renderObject);

});

adminRouter.get('/collectionsAndManifests', Token.check, Users.checkAdmin, function(req, res, next) {
/*adminRouter.get('/collectionsAndManifests', Token.check, function(req, res, next) {*/
	Manifests.getAllManifests(function (err, manifests) {
		if(err) {
			manifests = [];
		}
		// body...
		renderObject = {
			subtitle: "collectons and manifests overview",
			manifests: manifests,
			manifestStatics: Manifests.iiifSchemaVars,
			admin: req.userMetadata.admin
		};
		/*console.log(manifests)*/
		res.render('pages/admin/collectionsAndManifests', renderObject);

	});
});

adminRouter.get('/entityPermissions/:entityId/:format?', Token.check, Users.checkAdmin, function(req, res, next) {
	//get the permissions for this entity
	Permissions.getPermissionsEntry(req.params.entityId, function(err, permissionsJson) {
        if (err) return next(err);
/*        console.log(permissionsJson);*/
        permissionsJson['defaultPermissions'] = {
			"read" : true,
			"create" : true,
			"modify" : true,
			"delete" : true
		};
/*        console.log(permissionsJson);
*/
        switch(req.params.format){
			case "templatePart":
		        ejs.renderFile('views/partials/admin/permissionsEntry.ejs', permissionsJson, function(err, rendered){
		        	if (err) return next(err);
					res.send(rendered);
		        });
		     	break;
		    case "json":
		    	res.json(permissionsJson);
		    	break;
		    default:
		        ejs.renderFile('views/partials/admin/permissionsEntry.ejs', permissionsJson, function(err, rendered){
		        	if (err) return next(err);
			    	res.json({
			    		html: rendered,
			    		json: permissionsJson
			    	})
		    	});
	    }
	});
});

/*adminRouter.post('/importFSDir', Token.check, Users.checkAdmin, urlencodedParser, function(req, res, next) {
	

});
*/
module.exports = adminRouter;
