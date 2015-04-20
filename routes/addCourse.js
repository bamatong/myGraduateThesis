/**
 * @Author bamatong
 * @Fun
 * @Time 15-3-20.
 */
var express = require('express');
var course = require('../dao/courseDao');
var Busboy = require('busboy');
var router = express.Router();

router.post('/', function (req, res, next) {
    if (req.session.user) {
        var classInfo = {};
        var busboy = new Busboy({headers: req.headers});
        busboy.on('file', function (fieldname, file, filename, encoding, mimetype) {
            file.on('data', function (data) {
                var line = data.toString().split(/\n|\r\n/);
                var student = [];
                line.forEach(function (value) {
                    if (value) student.push(value);  //删除空行
                });
                classInfo[fieldname] = student;
            });
            file.on('end', function () {
            });
        });
        busboy.on('field', function (fieldname, val, fieldnameTruncated, valTruncated) {
            classInfo[fieldname] = val;
        });
        busboy.on('finish', function () {
            course.addClass(req.session.userID, classInfo, function (err) {
                if(err) {
                    res.end(err);
                }
                else {
                    res.end('success');
                }
            });
        });
        req.pipe(busboy);
    } else {
        res.render('back2index', {message: '抱歉,你还没有登录.'});
    }
});

router.get('/', function (req, res, next) {
    if (req.session.user) {
        res.render('addCourse', {title: '添加课程', username: req.session.user, leaveNum: req.session.leaveNum});
    } else {
        res.render('back2index', {message: '抱歉,你还没有登录.'});
    }
});

module.exports = router;