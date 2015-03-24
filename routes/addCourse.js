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
            //console.log('File [' + fieldname + ']: encoding: ' + encoding + ', mimetype: ' + mimetype);
            file.on('data', function (data) {
                var line = data.toString().split(/\n|\r\n/);
                var student = [];
                line.forEach(function (value) {
                    if (value) student.push(value.split(/[\t|\s]/));  //删除空行
                });
                classInfo[fieldname] = student;
                //console.log('File [' + fieldname + '] got ' + data.length + ' bytes');
            });
            file.on('end', function () {
                //console.log('File [' + fieldname + '] Finished');
            });
        });
        busboy.on('field', function (fieldname, val, fieldnameTruncated, valTruncated) {
            classInfo[fieldname] = val;
            //console.log('Field [' + fieldname + ']: value: ' + val);
        });
        busboy.on('finish', function () {
            //console.log(classInfo);
            course.addClass(req.session.userID, classInfo, function (err) {
                if(err) {
                    //console.log(err);
                    res.end(err);
                }
                else {
                    res.end('success');
                }
            });
        });
        req.pipe(busboy);
    } else {
        res.render('redirect', {message: '抱歉,你还没有登录.'});
    }
});

router.get('/', function (req, res, next) {
    if (req.session.user) {
        res.render('addCourse', {title: '添加课程', username: req.session.user});
    } else {
        res.render('redirect', {message: '抱歉,你还没有登录.'});
    }
});

module.exports = router;