var express = require('express');
var router = express.Router();

var mongoose = require('mongoose');
var passport = require('passport');
var token = require('../token');
var uuid = require('node-uuid');
var Tools = require('../tools.js');
var Annotations = require('../models/Annotations.js');
var Permissions = require('../models/Permissions.js');
var bodyParser = require('body-parser');
var DOMParser = require('xmldom').DOMParser;

var jsonParser = bodyParser.json();
// create application/x-www-form-urlencoded parser
var urlencodedParser = bodyParser.urlencoded({ extended: false });

/* POST /annotations */
/* creates a new annotation */
router.post('/oaAnno', token.check, function(req, res, next) {
/*  console.log(req.body);*/
  try{
    var canvasId = req.body.on.full;
    Permissions.getUserPermissionsForId(req, canvasId, function(err, permissions) {
      if(typeof(permissions.create) !== "undefined"  && permissions.create === true){
        var anno = {
            createdBy: req.userMetadata.userId,
            oaAnnotation: req.body
          };
        var annoId = Tools.fullUrl(req) + "/" + uuid();
        anno.oaAnnotation["@id"] = annoId;
        //Create the annotation
        Annotations.create(anno, function (err, post) {
          var storedAnno = post;
          if (err) next(err);
          //create permissions with full access for creating user and admin group
          Permissions.createEntityPermissions(req, annoId, "oa:Annotation", function(err, post) {
            if (err) return next(err);
            res.status(200);
            res.send(storedAnno.oaAnnotation);
          });  
        });
      }else{
        res.status(403);
        res.json("You don't have permissions to CREATE annotations to this entity");
      }
    });
  }catch (err){
    next(err);
  }
});


/* GET /annotations/:id */
// Get the annotation by id
router.get('/oaAnno/:id', token.check, function(req, res, next) {
  Permissions.getUserPermissionsForId(req, req.params.id, function(err, permissions){
    if (err) return next(err);
    if(typeof(permissions.read) !== "undefined" && permissions.read === true){
      Annotations.findOne({'oaAnnotation.@id' : req.params.id}, function (err, post) {
        if (err) return next(err);
        if(post) res.json(post.oaAnnotation);
        else res.json([]);
      });
    }else res.json([]);
  });
});

/* PUT /annotations/:id */
// Updates an annotation
router.put('/oaAnno/:id', token.check, function(req, res, next) {
  Permissions.getUserPermissionsForId(req, req.params.id, function(err, permissions) {
    if(typeof(permissions.modify) !== "undefined" && permissions.modify === true){
      var anno = {
        oaAnnotation : req.body
      };
      Annotations.findOneAndUpdate({'oaAnnotation.@id' : req.params.id}, anno, function (err, post) {
        if (err) return next(err);
        res.json(post.oaAnnotation);
      });
    }else{
      res.status(403);
      res.json("You don't have permissions to MODIFY annotations to this entity");
    }
  });
});

/* DELETE /annotations/:id */
router.delete('/oaAnno/:id', token.check, function(req, res, next) {
  Permissions.getUserPermissionsForId(req, req.params.id, function(err, permissions) {
    if(typeof(permissions.delete) !== "undefined" && permissions.delete === true){
      Annotations.findOneAndRemove({'oaAnnotation.@id': req.params.id}, function (err, post) {
        // ToDo: Delete permissions for this as well
        if (err) return next(err);
        res.json(true);
      });
    }else{
      res.status(403);
      res.json("You don't have permissions to DELETE annotations to this entity");
    }
  });
});


router.get('/searchCanvasAnnotations/:canvasid', token.check, function(req, res, next) {
  //Check if token was submitted and check returned an username
  Permissions.getUserPermissionsForId(req, req.params.canvasid, function(err, permissions) {
    if (err) return next(err);
    // get annotations if user has read permissions for annotations
    if(typeof(permissions.read) !== "undefined" && permissions.read === true){
      var query = {"oaAnnotation.on.full": req.params.canvasid};
      Annotations.find(query, {"_id": 0}).select("oaAnnotation").exec(function (err, annotations) {
        if (err) return next(err);
        res.json(annotations);
      });
    }else{
      res.json([]);
/*      res.status(403);
      res.json("You don't have permissions to READ annotations to this entity");
*/    }
  });
});

/* GET /annotations/canvasAnno:id */
// Frontend: Display the annotation
router.get('/displayAnno/:id/:format?', token.check, function(req, res, next) {
  Permissions.getUserPermissionsForId(req, req.params.id, function(err, permissions){
    if (err) return next(err);
    if(typeof(permissions.read) !== "undefined" && permissions.read === true){
      Annotations.getAnnotationData(req.params.id, function(err, annoData) {
        if (err) return next(err);
          var regionString = annoData.boundingBox.left + "," + annoData.boundingBox.top + "," + annoData.boundingBox.width + "," + annoData.boundingBox.height;
          var imgThumbnailIIIFUri = annoData.iiifBaseUri + "/" + regionString + "/!200,200/0/default.jpg";
          annoData.imgThumbnailIIIFUri = imgThumbnailIIIFUri;
/*        console.log(annoData);*/

        switch(req.params.format){
          case "json":
            res.json(annoData);
            break;
          case "annoInlinePreview":
            res.render('partials/annotations/annoInlinePreview', annoData);
            break;
          default:
            res.render('pages/displaySingleAnnotation', annoData);
        }
      });
    }else{
      res.status(403)
      res.end();
    }
  })
});

/* GET /annotations/displayAnno:id */
// Frontend: Display the annotation
/*router.get('/displayAnno/:id', token.check, function(req, res, next) {
  Permissions.getUserPermissionsForId(req, req.params.id, function(err, permissions){
    if (err) return next(err);
    if(typeof(permissions.read) !== "undefined" && permissions.read === true){
      Annotations.getAnnotationData(req.params.id, function(err, annoData) {
        if (err) return next(err);
        res.render('pages/displaySingleAnnotation', annoData);
      });
    }else {
      res.status(403)
      res.end();
    }
  });
});*/


module.exports = router;
