var url = require('url');
var express = require('express');
var manifestsRouter = express.Router();

var mongoose = require('mongoose');
var Manifests = require('../models/Manifests.js');
var Permissions = require('../models/Permissions.js');
var Users = require('../models/Users.js');
var token = require('../token');
var async = require('async');
/*var util = require('util');
*/
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
}

/* GET /manifest */
/* get available manifests */

manifestsRouter.get('/', token.check, function(req, res, next) {
  //get the manifests where user is owner or user has read permissions
  var query = {
    $and:
      [
          {"resourceType": "sc:Manifest"},
          {"permissions.users.id": req.userMetadata.userId},
          {"permissions.users.permissions.read": true}
      ]
  };
  Permissions.find(query).distinct('for').exec(function (err, manifestList) {
    if (err) return next(err);
    res.json(manifestList);
  });
});

/* GET /manifest/:id */
/*ToDo: Permission check*/
manifestsRouter.get('/:id', function(req, res, next) {
  Manifests.findOne({'@id' : {$regex: req.params.id}}, '-_id', function (err, post) {
    if (err) return next(err);
    if (post) res.json(post);
    else {
        res.status(404);
        res.send("not found");
    }
  });
});

//adds Permissions for Manifest and Canvases
manifestsRouter.post('/admin/addPermissions', token.check, Users.checkAdmin, urlencodedParser, function(req, res, next) {
  // get the manifest data
  Manifests.findOne({'@id' : req.body.manifestId}, {'_id': 0}, function (err, post) {
    if (err) return next(err);
    var allPermissions = [];

    //default: full access
    var permissions = {"read": true, "create": true, "modify": true, "delete": true};
    if(req.body.permissions){
      permissions = req.body.permissions;
    };

    //add permissions for manifest
    Permissions.createEntityPermissions(req, req.body.manifestId, "sc:Manifest");


    //add permissions for each canvas
    /*console.log("%j", post);*/
    post.sequences[0].canvases.forEach(function(canvas, idx) {
      var permissionsObj = {
        "creator": "SYSTEM",
        "for": canvas["@id"],
        "resourceType": "sc:Canvas",
        permissions: {}
      };

      var userPermissions = [];
      if (req.body.userIds){
        req.body.userIds.forEach(function(userId, idx) {
          userPermissions.push({
            id: userId, 
            permissions: permissions
          });
        });
      }

      var groupPermissions = [];
      groupPermissions.push({
        id: "admins",
        permissions:{"read": true, "create": true, "modify": true, "delete": true}
      });

      if (req.body.groupIds){
        req.body.groupIds.forEach(function(groupId, idx) {
          groupPermissions.push({
            id: groupId, 
            permissions: permissions
          });
        });
      }

      if (userPermissions.length > 0) permissionsObj.permissions.users = userPermissions;
      if (groupPermissions.length > 0) permissionsObj.permissions.groups = groupPermissions;
      allPermissions.push(permissionsObj);
    });
    Permissions.create(allPermissions, function (err, post){
      if (err) return next(err);
      res.status(200);
      res.json(post);
    });
  });
});

module.exports = manifestsRouter;
