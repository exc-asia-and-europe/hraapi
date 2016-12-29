var mongoose = require('mongoose');

var GroupSchema = new mongoose.Schema({
    "id" : {type:String, required:true, unique:true, dropDups: true},
    "creator" : {type:String, required:true}, 
    "members" : [
        {
            "id": { type:String, unique:true},
            "type": { type:String, enum: ["user", "group"]}
        }
    ]
  },{
    timestamps: true
  }
);

GroupSchema.statics.getUserGroups = function(req, res, next) {
    var query = { 
        $and: [
            {"members.id": req.userMetadata.userId},
            {"members.type": "user" }
        ]
    };
    var _next = next;
    this.find(query ,{"_id": 0, "id": 1, "members.id.$": 1}, function(err, post) {
        if (err) return next(err);
        post.forEach(function(group) {
            req.userMetadata.groups.local.push({
                id: group.id
            });
        });
        next(null, req, res);
    });
};

module.exports = mongoose.model('Groups', GroupSchema);