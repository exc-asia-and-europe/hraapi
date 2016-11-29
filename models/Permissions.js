var mongoose = require('mongoose');

var PermissionSchema = new mongoose.Schema({
    "for" : {type:String, required:true, unique:true, dropDups: true},
    "creator" : {type:String, required:true},
    "resourceType": {type:String, default: ""},
    "permissions" : {
        "users" : [
            {
                "id" : {type:String, required:true, unique:true}, 
                "permissions" : {
                    "read": {type:Boolean, required:true},
                    "create": {type:Boolean, required:true},
                    "modify": {type:Boolean, required:true},
                    "delete": {type:Boolean, required:true},
                }
            }
        ],
        "groups" : [
            {
                "id" : {type:String, required:true, unique:true}, 
                "permissions" : {
                    "read": {type:Boolean, required:true},
                    "create": {type:Boolean, required:true},
                    "modify": {type:Boolean, required:true},
                    "delete": {type:Boolean, required:true},
                }
            }
        ]        
    }
  },{
    timestamps: true
  }
);

PermissionSchema.statics.createEntityPermissions = function(req, forId, entityType, next) {
    var permissionEntry = {
        "for": forId,
        "creator": req.userMetadata.userId,
        "resourceType": (entityType?entityType:""),
        "permissions": {
            "users" : [
                {
                    "id" : req.userMetadata.userId, 
                    "permissions" : {
                        "read": true,
                        "create": true,
                        "modify": true,
                        "delete": true,
                    }
                }
            ],
            "groups" : [
                {
                    "id" : "admins", 
                    "permissions" : {
                        "read": true,
                        "create": true,
                        "modify": true,
                        "delete": true,
                    }
                }
            ]
        }
    };
    return(this.create(permissionEntry, next));
};


PermissionSchema.statics.setUserPermissions = function(forId, userId, permissionsMatrix, next) {
    var _this = this;
    /*
    permission matrix needs this structure:
    {
        "read" : true,
        "create" : true,
        "modify" : true,
        "delete" : false
    }
    */
    var query = {
        $and:[
            {
                "for": forId
            },{
                "permissions.users.id": userId
            }]
        };
    var set = {
        $set: {
            "permissions.users.$.permissions" : permissionsMatrix
        }
    };
    _this.update(query, set, function(err, post) {
        if (err) return next(err);
        //if nModified === 1 an existing entry was updated. else try to insert new permission for this user
        if (post.nModified === 1){
            //return the concerning entry
            _this.getPermissionsEntry(forId, function(err, post){
                if (err) return next(err);
                return next(null, post);
            });
        }else{
            var query = {
                    "for": forId
                };

            var push = {
                $push: {
                    "permissions.users": {
                        "id": userId,
                        "permissions": permissionsMatrix
                    }
                }
            };
            _this.update(query, push, function(err, post) {
                if (err) return next(err);
                //return true if creation was successful, false if not (no permission entry for this entity yet)
                if(post.nModified===1){
                    _this.getPermissionsEntry(forId, function(err, post){
                        if (err) return next(err);
                        return next(null, post);
                    });
                }else{
                    return next(null, false);
                }
            });
        }
    });
};

PermissionSchema.statics.getPermissionsEntry = function(forId, next){
    this.findOne({"for": forId},{"_id": 0}, function(err, post) {
        if (err) return next(err);
        return next(null, post);
    });
};

PermissionSchema.statics.addGroupPermissions = function(forId, groupId, permissionMatrix, next) {
};

PermissionSchema.statics.getUserPermissionsForId = function(req, elementId, next) {
    var admin = false;
    req.userMetadata.groups.local.forEach(function(group) {
        if(group.id === "admins"){
          admin = true;
          return;
        }
    });
    if (admin){
        return next(null, {
            "read" : true,
            "create" : true,
            "modify" : true,
            "delete" : true
        });
    }else{
        var query = {"for": elementId, "permissions.users.id": req.userMetadata.userId};
        this.findOne(query,{"_id": 0, "permissions.users.permissions": 1}, function(err, post) {
            if (err) return next(err);
            var result = [];
            if (post) result = post.permissions.users[0].permissions;
            next(null, result);
        });
    }
};

module.exports = mongoose.model('Permissions', PermissionSchema);