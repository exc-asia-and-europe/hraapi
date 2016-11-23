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


module.exports = mongoose.model('Manifests', ManifestSchema);