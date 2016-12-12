var mongoose = require('mongoose');

var ManifestSchema = new mongoose.Schema({
    "@id" : {type:String, required:true, unique:true, dropDups: true},
    "@context" : {type:String, required:true, default:"http://iiif.io/api/presentation/2/context.json"},
    "@type" : {type:String, required:true, default:"sc:Manifest"},
    "owner" : {type:String, required:true}, 
    "sequences" : {type:Array, required:true}
  },{
    timestamps: true
  }
);

ManifestSchema.statics.iiifSchemaVars = {
	viewingDirection: [
	    {
	    	value: null,
	    	label: "none"
	    },
	    {
	    	value: "left-to-right",
	    	label: "left-to-right"
	    },
	    {
	    	value: "right-to-left",
	    	label: "right-to-left"
	    },
	    {
	    	value: "top-to-bottom",
	    	label: "top-to-bottom"
	    },
	    {
	    	value: "bottom-to-top",
	    	label: "bottom-to-top"
	    }
	],
	viewingHint: [
	    {
	    	value: null,
	    	label: "none"
	    },
		{
			value: "individuals",
			label: "individuals"
		},
		{
			value: "paged",
			label: "paged"
		},
		{
			value: "continuous",
			label: "continuous"
		},
		{
			value: "non-paged",
			label: "non-paged"
		},
		{
			value: "top",
			label: "top"
		},
	]
};

ManifestSchema.statics.getAllManifests = function (next) {
	this.find({}, {"_id": 0}, {lean: true}, function (err, manifestList) {
		if (err) next(err);
		return next(null, manifestList);
	});
};

module.exports = mongoose.model('Manifests', ManifestSchema);