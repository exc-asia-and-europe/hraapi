var express = require('express');
var router = express.Router();

var mongoose = require('mongoose');
var passport = require('passport');
var token = require('../token.js');
var uuid = require('node-uuid');
var tools = require('../tools.js');
var Annotations = require('../models/Annotations.js');
var Permissions = require('../models/Permissions.js');
var bodyParser = require('body-parser');


var jsonParser = bodyParser.json();

// create application/x-www-form-urlencoded parser
var urlencodedParser = bodyParser.urlencoded({ extended: false });

/* GET Anno List. */
router.all('/:testName', token.check, urlencodedParser, function(req, res, next) {
	var isAdmin = false;
	req.userMetadata.groups.local.forEach(function(group) {
		if(group.id === "admins") isAdmin = true;
	});

	if(isAdmin){
		switch(req.params.testName){
			case "userPermissions":
				res.json(req.body);
			break;
		}
		return;
	}
	return next();

});

module.exports = router;