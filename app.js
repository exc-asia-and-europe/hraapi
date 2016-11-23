// load mongoose package
var mongoose = require('mongoose');
var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var cors = require('express-cors')
var morgan = require('morgan');
var config = require('./config'); // get the config file


var index = require('./routes/index');

var LdapStrategy = require('passport-ldapauth');
var passport = require('passport');


var annotations = require('./routes/annotations');
var users = require('./routes/users');
var manifests = require('./routes/manifests');
var tests = require('./routes/tests');

// connect to MongoDB
var connectString = 'mongodb://';
if (config.database.user){
  connectString += config.database.user + ":" + config.database.password + "@";
}
connectString += config.database.uri + ":" + config.database.port + "/" + config.database.database;
mongoose.connect(connectString);
passport.use(new LdapStrategy(config.ldapStrategyOpts));

var app = express();

app.set('superSecret', config.secret); // secret variable
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
/*app.use(logger('dev'));*/
app.use(morgan('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(passport.initialize());

app.use(function(req, res, next) {
/*    if ('OPTIONS' == req.method || 'GET' == req.method) {*/
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
      res.header('Access-Control-Allow-Headers', 'user-agent, Content-Type, Authorization, Content-Length, X-Requested-With, x-access-token');
      /*res.sendStatus(200);*/
/*    }
    else {
    }*/
      next();
});

app.use('/', index);
app.use('/annotations', annotations);
app.use('/users', users);
app.use('/manifests', manifests);
app.use('/tests', tests);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
