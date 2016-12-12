var mongoose = require('mongoose');
var Tools = require('../tools.js');
var bodyParser = require('body-parser');
var DOMParser = require('xmldom').DOMParser;
var jsonParser = bodyParser.json();
var SvgBoundings = require("svg-boundings")

var AnnotationSchema = new mongoose.Schema({
  createdBy: {type:String, required:true},
	oaAnnotation : {
    "@id": {type:String, required:true},
		"@context": {type:String, required:true},
	    "@type": {type:String, required:true},
	    motivation:[{type:String, required:true}],
	    resource:[
        {
	      	"@type": {type:String, required:true},
	      	format: {type:String, required:false},
	      	chars: {type:String}
        }
      ],
      on:{
        	"@type": {type:String, required:true},
        	full: {type:String, required:true},
        	selector:{
          	"@type": {type:String, required:true},
            "value": {type:String, required:true}
        	},
        within:{
        		"@id": {type:String, required:true},
        		"@type": {type:String, required:true}
        }
      }
  	}
  },{
    timestamps: true
  }
);

AnnotationSchema.statics.getAnnotationData = function(annotationId, next) {
  console.log(annotationId);
  var iiifImageContexts = ['http://iiif.io/api/image/2/context.json']
  this.findOne({'oaAnnotation.@id' : annotationId}, function (err, post) {
    if (err) return next(err);
    if (post){
      //try to get the canvas informations
      Tools.fetchUrlContent(post.oaAnnotation.on.full, function(err, data){
        var canvasData = null;
        var iiifImageBaseUri = null;
        //if canvas information, get the iiif image uri
        if(data){
          canvasData = JSON.parse(data);
          if(iiifImageContexts.indexOf(canvasData.images[0].resource.service['@context']) !== -1){
            iiifImageBaseUri = canvasData.images[0].resource.service['@id'];
          };
        }
        var iiifString = "/full/full/0/default.jpg";
        var selector = post.oaAnnotation.on.selector;
        var boundingBox = {
          left:0,
          top:0,
          width: 0,
          height: 0
        };
        //analyze the selector and generate the iiif cropping string
        switch(selector['@type']){
          case "oa:SvgSelector":
            //get the svg element bounding box
            var svgDomElement = new DOMParser().parseFromString(selector.value);
            var elementBoundingBox = SvgBoundings.shape(svgDomElement.documentElement.firstChild);
            /*var elementBoundingBox*/
            //floor the bounding box coordinates:
            for (variable in elementBoundingBox){
              elementBoundingBox[variable] = Math.floor(elementBoundingBox[variable]);
            };
            iiifString = "/" + 
              elementBoundingBox.left + "," +
              elementBoundingBox.top + "," +
              elementBoundingBox.width + "," +
              elementBoundingBox.height + 
              "/full/0/default.jpg";

            boundingBox = elementBoundingBox;
            break;
        }
/*            console.log(iiifString);*/
        
        //seperate annotation resources by type (ie dctypes:Text, oa:Tag)
        var annoResources = {};
        post.oaAnnotation.resource.forEach(function(res) {
          if(!annoResources[res['@type']]) annoResources[res['@type']] = [];
          annoResources[res['@type']].push(res);
        });

        var renderData = {
          iiifBaseUri: iiifImageBaseUri,
          annoUri: post.oaAnnotation['@id'],
          manifestUri: post.oaAnnotation.on.within['@id'],
          boundingBox: boundingBox,
          partImgUri: iiifImageBaseUri + iiifString,
          annoResources: annoResources,
          annotationData: post.oaAnnotation
        };
        return next(null, renderData)
      });
    }else {
      return next(new Error('unautorized'));
    }
  });
}

module.exports = mongoose.model('Annotations', AnnotationSchema);