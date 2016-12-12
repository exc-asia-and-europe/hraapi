var mongoose = require('mongoose');

var UserSchema = new mongoose.Schema({
	"userId": {type:String, required:true, unique:true, dropDups: true},
	"forename": {type:String, required:false},
	"lastname": {type:String, required:false},
	"email": {type:String, required:true},
	"roles": {type: Array, required:false, default:[]}
  },{
    timestamps: true
  }
);

UserSchema.statics.checkAdmin = function(req, res, next) {
  if(req.userMetadata.admin) return next();
  res.status(403);
  res.send("admins only!");
};

module.exports = mongoose.model('Users', UserSchema);