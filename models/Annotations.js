var mongoose = require('mongoose');

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
module.exports = mongoose.model('Annotations', AnnotationSchema);