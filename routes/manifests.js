var fs = require('fs');
var url = require('url');
var express = require('express');
var manifestsRouter = express.Router();

var mongoose = require('mongoose');
var Manifests = require('../models/Manifests.js');
var Permissions = require('../models/Permissions.js');
var Users = require('../models/Users.js');
var token = require('../token');
var Tools = require('../tools');
var http = require('http');
var uuid = require('node-uuid');

var probe = require('probe-image-size');
var async = require('async');
var sizeOf = require('image-size');


/*var util = require('util');
*/
var bodyParser = require('body-parser');

var jsonParser = bodyParser.json();
// create application/x-www-form-urlencoded parser
var urlencodedParser = bodyParser.urlencoded({ extended: false });

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
manifestsRouter.get('/:id', token.check, function(req, res, next) {
  Permissions.getUserPermissionsForId(req, req.params.id, function(err, permissions) {
    if(typeof(permissions.read) !== "undefined"  && permissions.read === true){
      Manifests.findOne({'@id' : {$regex: req.params.id}}, '-_id', function (err, post) {
        if (err) return next(err);
        if (post) res.json(post);
        else {
            res.status(404);
            res.send("not found");
        }
      });
    }else{
      res.status(403);
      res.json("You don't have permissions to read this entity");
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

manifestsRouter.post('/admin/generateManifestFromDirectory', token.check, Users.checkAdmin, urlencodedParser, Tools.getImages, function(req, res, next) {
  var chunkSize = 50;
  var fsPrefix = "/media/";
  var iiifServer = "kjc-sv010.kjc.uni-heidelberg.de";
  var iiifPath = "/fcgi-bin/iipsrv.fcgi";
  var prefixLength = fsPrefix.length;
  var validResponseTypes = ["application/json", "application/ld+json"];

  req.images = req.images.slice(0, 1);
  var jobs = [];
  var chunks = [];
  console.info(req.images);

  req.images.forEach(function(imageObj, imageIdx) {
    var imageUrl = req.body.directory + "/" + imageObj.file;
    console.log(imageUrl);
    var iiifId = imageUrl.substr(fsPrefix.length);
    var iiifString = encodeURIComponent(encodeURIComponent(iiifId)) + "/info.json";
    var infoURI = iiifPath + "?IIIF=" + iiifString;
    var requestOptions = {
      protocol: 'http:',
      hostname: iiifServer,
      port: 8080,
      path: iiifPath + "?IIIF=" + iiifString,
      pathname: iiifPath + "?IIIF=" + iiifString,
      method: "get",
      cache: false,
      headers: { 
        'Content-Type': 'application/json', 
        'Cache-Control': 'private, no-cache, no-store, must-revalidate, max-age=0',
        'Pragma': 'no-cache'
      }
    };
    imageObj.iiifInfoUri = requestOptions.protocol + "//" + requestOptions.hostname + ":" + requestOptions.port + infoURI;
    var jobResponse = {
      imageId: imageUrl,
      imageIdx: imageIdx,
      result: false
    };

    jobs[imageIdx] = function(callback) {
      var getReq = http.request(requestOptions,
      function(response) {
        response.setEncoding('utf8');
        // Continuously update stream with data
        var body = '';
        response.on('data', function(d) {
            body += d;
        });
        response.on('end', function() {
          if(response.statusCode !== 200){
            console.log(response.statusCode);
            console.log(url.format(requestOptions));
          } 
          var contentType = response.headers['content-type'];
          if(validResponseTypes.indexOf(contentType) === -1){
            jobResponse.result = {
              error: {
                msg: "wrong content type: " + contentType,
                body: body
              }
            };
            return callback(null, jobResponse);
          }else{
            try{
              var parsed = JSON.parse(body);
              /*jobResponse.result = parsed;*/
              imageObj.iiifInfo = parsed;
              jobResponse.iiifInfo = parsed;
              return callback(null, jobResponse);
            }catch(err){
              console.log("ERROR");
              console.log(err);
              console.log(body);

              return callback(null, err);
            }
          }
          
        });
      });
      getReq.on('error', function(err) {
        console.log("ERROR");
        jobResponse.result = {
          error:{
            msg: "http-request on IIIF info dropped an error",
            body: err
          }
        };
        callback(null, jobResponse);
      });
      getReq.end();      
    };
  });


  var jobChunks = [];
  for(var i=0; i < Math.ceil(jobs.length/chunkSize); i++){
    var slicedJobs = jobs.slice(i * chunkSize, ((i+1) *chunkSize));
    jobChunks.push(slicedJobs);
  };

  var seriesParts = [];
  jobChunks.forEach(function(jobChunk) {
    seriesParts.push(function(callback){
      async.parallel(jobChunk, function(err, result) {
        return callback(err, result);
      });
    });
  });

  async.series(seriesParts, function(err, imageObjects) {
    var apiUri = req.protocol + "://" + req.hostname + ":" + req.app.settings.port + req.baseUrl;
    var manifestId = req.protocol + "://" + req.hostname + ":" + req.app.settings.port + req.baseUrl + "/" + uuid();
    //all Chunks done, so create the manifest and iterate over the images
    var manifests = [];

    req.images.forEach(function(imageObj, idx) {
      console.log(idx);
      if(imageObj.error !== undefined || imageObj.iiifInfo === undefined){
        console.log("Error: " + imageObj.iiifInfoUri);
        /*console.log(imageObj.iiifInfo);*/
        return;
      };

      //add manifest object for dir
      if(manifests[imageObj.dir] === undefined){
        console.log(imageObj.dir + " = undefined");

        manifests[imageObj.dir] = { 
          "@context" : "http://iiif.io/api/presentation/2/context.json", 
          "@id" : manifestId,
          "@type" : "sc:Manifest", 
          "label" : req.body.directory.substr(fsPrefix.length), 
          "logo" : "https://pbs.twimg.com/profile_images/1894450439/Cluster-Asia-and-Europetwitter.jpg", 
          "viewingDirection" : "left-to-right", 
          "viewingHint" : "individuals", 
          "sequences" : [{
            "@id" : apiUri + "/sequence/normal.json", 
            "@type" : "sc:Sequence", 
            "label" : req.directory, 
            "canvases" : []
          }]
        };
      }
      console.log(manifests[imageObj.dir]);

      var canvasId = apiUri + "/canvas/p" + idx;
      manifests[imageObj.dir].sequences[0].canvases.push({
        "@id" : canvasId, 
        "@type" : "sc:Canvas", 
        "label" : imageObj.file, 
        "height" : parseInt(imageObj.iiifInfo.height),
        "width" : parseInt(imageObj.iiifInfo.width),
        "images" : [
          {
            "@type" : "oa:Annotation", 
            "motivation" : "sc:painting", 
            "resource" : {
              "@id" : imageObj.iiifInfo["@id"] + "/full/full/0/default.jpg", 
              "@type" : "dctypes:Image", 
              "format" : "image/jpeg", 
              "height" : parseInt(imageObj.iiifInfo.height),
              "width" : parseInt(imageObj.iiifInfo.width),
              "service" : {
                "@context" : "http://iiif.io/api/image/2/context.json", 
                "@id" : imageObj.iiifInfo["@id"], 
                "profile" : "http://iiif.io/api/image/2/level2.json"
              }
            }, 
            "on" : canvasId
          }
        ]
      });
    });
    console.log(manifests);
    console.log("HIER");
    console.log(manifests.length);
    res.json(manifests.length);
  });

});

module.exports = manifestsRouter;
