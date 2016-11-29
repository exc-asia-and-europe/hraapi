var url = require('url');
var express = require('express');
var usersRouter = express.Router();

var mongoose = require('mongoose');
var passport = require('passport');
var jwt = require('jsonwebtoken'); // used to create, sign, and verify tokens
var config = require('../config'); // get config file
var token = require('../token');

var Users = require('../models/Users.js');
var Groups = require('../models/Groups.js');
var Permissions = require('../models/Permissions.js');
var bodyParser = require('body-parser');

var jsonParser = bodyParser.json();
// create application/x-www-form-urlencoded parser
var urlencodedParser = bodyParser.urlencoded({ extended: false });


function fullUrl(req) {
  return url.format({
    protocol: req.protocol,
    hostname: req.hostname,
    port: req.app.settings.port,
    pathname: req.originalUrl
  });
};

usersRouter.post('/authenticate', passport.authenticate('ldapauth', {session: false}), function(req, res) {
  var userMetadata = {
    userId: req.user.sAMAccountName + config.ldapIdSuffix,
    fullName: req.user.name,
    displayName: req.user.displayName,
    email: req.user.mail,
    groups: {
      ldap: req.user.memberOf,
      local: []
    }
  };
  req.userMetadata = userMetadata;
  // get local groups
  Groups.getUserGroups(req, res, function(err, req, res, next) {
    if (err) return next(err);
    // create a token
    var token = jwt.sign(userMetadata, config.secret, {
      expiresIn: "24h" // expires in 24 hours
    });
    res.json({
      /*metadata: userMetadata,*/
      message: "welcome " + userMetadata.fullName,
      token: token
    });
  });
});


usersRouter.post('/verifyToken', token.check, function(req, res, next) {
  if(typeof(req.userMetadata) !== "undefined"){
    res.json({userMetadata: req.userMetadata});
  }else{
    res.status(401);
    res.send("Token/User not accepted!");
  }
});

usersRouter.get('/permissionsFor/:entityid', token.check, function(req, res, next) {
  Permissions.getUserPermissionsForId(req, req.params.entityid, function(err, post) {
    if (err) return next(err);
    res.json(post);
  }); 
});

usersRouter.get('/localGroups', token.check, function(req, res, next) {
  res.send(req.userMetadata.groups.local);
});

/*urlencodedParser*/
usersRouter.post('/admin/generateStandardPermissionsFor', token.check, Users.checkAdmin, function(req, res, next) {
  res.send("ADMIN!");
/*  Permissions.createEntityPermissions(req, req.body.entityId, entityType, function(err, post) {
    console.log(req.body.entityId);
    if (err) return next(err);
    res.status(200);
    res.send(true);
  });  */
});

usersRouter.post('/admin/setUserPermissions', token.check, Users.checkAdmin, urlencodedParser, function(req, res, next) {
  Permissions.setUserPermissions(req.body.entityId, req.body.userId, req.body.permissions, function (err, post) {
    if (err) return next(err);
    //if false there is no permission entry for this entity yet
    if (post === false){
      res.status(404);
      res.send("no permission entry for this entity yet.");
      return;
    }
    else res.json(post);
  });
});

module.exports = usersRouter;