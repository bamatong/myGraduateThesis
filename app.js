//加载依赖库
var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('./logger');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');

//加载路由控制
var index = require('./routes/index');
var signin = require('./routes/signin');
var logout = require('./routes/logout');
var signup = require('./routes/signup');
var addCourse = require('./routes/addCourse');
var showAndEdit = require('./routes/showAndEdit');

//创建项目实例
var app = express();
app.use(session({secret: 'keyboard cat', resave: false, saveUninitialized: true}));

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));

//定义日志
app.use(logger.log4js.connectLogger(logger.logger('normal'), {format: ':method :url :status :response-time ms'}));
//app.use(logger('dev'));

//定义数据解析器
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

//定义cookie解析器
app.use(cookieParser());

//定义静态文件目录
app.use(express.static(path.join(__dirname, 'public')));

//匹配路径和路由
app.use('/', index);
app.use('/home', signin);
app.use('/logout', logout);
app.use('/signup', signup);
app.use('/home/addCourse', addCourse);
app.use('/home/showAndEdit', showAndEdit);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});

module.exports = app;
