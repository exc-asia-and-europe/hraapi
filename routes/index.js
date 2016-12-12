var express = require('express');
var router = express.Router();
var Token = require('../token');

/* GET home page. */
router.get('/', Token.check, function(req, res, next) {
/*	console.log(req.userMetadata)*/
	var renderObject = {
		title: "HRA IIIF API Frontend",
		userMetadata: req.userMetadata,
/*		admin: req.userMetadata.admin*/
		admin: true
	};
	res.render('pages/index', renderObject);
});

module.exports = router;
