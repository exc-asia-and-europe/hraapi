var fs = require('graceful-fs');
var url = require('url');
var config = require('./config'); // get our config file
var mime = require('mime');
var sizeOf = require('image-size');
var http = require('http');
var walkSync = require('walk-sync');

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
		req.images.forEach(function(path) {
			result.push({
				dir: path.substring(0, path.lastIndexOf("/")),
				file: path
			})
		});
		req.images = result;
		/*req.images = Tools.getImagesFromDir(req.body.directory).sort();*/
		next();
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