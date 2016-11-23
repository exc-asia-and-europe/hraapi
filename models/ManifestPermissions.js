var mongoose = require('mongoose');

var ManifestPermissionSchema = new mongoose.Schema({
    "manifestId" : {type:String, required:true, unique:true, dropDups: true},
    "owner" : {type:String, required:true}, 
    "permissions" : {
        "users" : [
            {
                "username" : {type:String}, 
                "permissions" : {type:Array}
            }
        ]
    }
  },{
    timestamps: true
  }
);
module.exports = mongoose.model('ManifestPermissions', ManifestPermissionSchema);