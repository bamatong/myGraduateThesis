/**
 * @Author bamatong
 * @Fun
 * @Time 15-4-19.
 */
var express = require('express');
var teacher = require('../dao/teacherDao');
var Busboy = require('busboy');
var router = express.Router();

router.get('/', function (req, res, next) {
    if (req.session.user) {
        res.render('unbind', {title: '添加课程', username: req.session.user, leaveNum: req.session.leaveNum});
    } else {
        res.render('back2index', {message: '抱歉,你还没有登录.'});
    }
});

router.get('/getStudentInfo', function (req, res, next) {
    if (req.session.user) {
        var studentID = req.query.studentID;
        teacher.getStudentInfo(req.session.userID, studentID, function (err, result) {
            if (err) {
                if (err == 'error')
                    res.end('fail');
                else
                    res.end('nothing');
            } else {
                res.end(JSON.stringify(result[0]));
            }
        });
    } else {
        res.render('back2index', {message: '抱歉,你还没有登录.'});
    }
});

router.post('/getStudentsInfo', function (req, res, next) {
    if (req.session.user) {
        var students = [];
        var busboy = new Busboy({headers: req.headers});
        busboy.on('file', function (fieldname, file, filename, encoding, mimetype) {
            file.on('data', function (data) {
                var line = data.toString().split(/\n|\r\n/);
                line.forEach(function (value) {
                    if (value) students.push(value);  //删除空行
                });
            });
        });
        busboy.on('finish', function () {
            teacher.getStudentsInfo(req.session.userID, students, function (err, result) {
                if (err) {
                    res.end('fail');
                } else {
                    res.end(JSON.stringify(result));
                }
            });
        });
        req.pipe(busboy);
    } else {
        res.render('back2index', {message: '抱歉,你还没有登录.'});
    }
});

router.post('/unbindSingle', function (req, res, next) {
    if (req.session.user) {
        var studentID = req.query.studentID;
        teacher.unbindSingle(studentID, function (err) {
            if (err) {
                res.end('fail');
            } else {
                res.end('success');
            }
        });
    } else {
        res.render('back2index', {message: '抱歉,你还没有登录.'});
    }
});

router.post('/unbindBatch', function (req, res, next) {
    if (req.session.user) {
        var students;
        var busboy = new Busboy({headers: req.headers});
        busboy.on('field', function (fieldname, val, fieldnameTruncated, valTruncated) {
            students = val;
        });
        busboy.on('finish', function () {
            teacher.unbindBatch(students, function (err, result) {
                if (err) {
                    res.end('fail');
                } else {
                    res.end('success');
                }
            });
        });
        req.pipe(busboy);
    } else {
        res.render('back2index', {message: '抱歉,你还没有登录.'});
    }
});

module.exports = router;