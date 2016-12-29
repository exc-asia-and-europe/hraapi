var fs = require('graceful-fs');
var url = require('url');
var config = require('./config'); // get our config file
var mime = require('mime');
var sizeOf = require('image-size');
var http = require('http');
var walkSync = require('walk-sync');
var async = require('async');

var Tools = {
	fullUrl: function(req) {
	  return url.format({
	    protocol: req.protocol,
	    hostname: req.hostname,
	    port: req.app.settings.port,
	    pathname: req.originalUrl
	  });
	},

/*	getImagesFromDir: function(dir) {
		console.log(dir)
		var _this = this;  
		var results = [];
		var list = fs.readdirSync(dir)
			list.forEach(function(file) {
			file = dir + '/' + file
			console.log(file)
			var stat = fs.statSync(file)
			console.log(stat.isDirectory())
			if (stat && stat.isDirectory()) results = results.concat(Tools.getImages(file))
			else {
				if(mime.lookup(file) === "image/tiff"){
					results.push({
						file: file,
						dir : dir
					});
				} 
			}
		})
		return results
	},
*/
	getImages: function(req, res, next){
		req.images = walkSync(req.body.directory, { globs: ['Y00*/*.tif'] });
		var result = [];
		async.each(req.images, function(path) {
			var dir = path.substring(0, path.lastIndexOf("/"))
			var dirParts = dir.split("/");

			console.log(dir);
			console.log(dirParts);
			result.push({
				dir: dir,
				file: path
			})
		},
		function(err){
			req.images = result;
			next();
		});
		/*req.images = Tools.getImagesFromDir(req.body.directory).sort();*/
		
	},

	fetchUrlContent: function(url, callback) {
		var bodyarr = [];
		http.get(url, function(res) {
			res.on('data', function(chunk){
				bodyarr.push(chunk);
			});
			res.on('end', function(){
				callback(null, bodyarr.join(''));
			});
		}).on('error', function(e) {
			callback(e);
		});
	}
};

module.exports = Tools;