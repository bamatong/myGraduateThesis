/**
 * @Author bamatong
 * @Fun
 * @Time 15-4-13.
 */
var express = require('express');
var moment = require('moment');
var Busboy = require('busboy');
var callRec = require('../dao/callRecDao');
var router = express.Router();

router.get('/', function (req, res, next) {
    if (req.session.user) {
        var courseID = req.query.courseID,
            callDateID = req.query.callDateID;
        callRec.showCourse(req.session.userID, function (err, courses) {
            if (err) {
                res.render('back2home', {message: '查看考勤失败,请重试.'});
            } else {
                res.render('editCallRec', {
                    title: '查看考勤',
                    username: req.session.user,
                    courses: courses,
                    courseID: courseID,
                    callDateID: callDateID,
                    leaveNum: req.session.leaveNum
                });
            }
        });
    } else {
        res.render('back2index', {message: '抱歉,你还没有登录.'});
    }
});

router.post('/getCallRec', function (req, res, next) {
    var callRecs = [];
    if (req.session.user) {
        if (!req.query.courseID) {
            res.end('没有选择课程');
        } else {
            var courseID = req.query.courseID;
            callRec.showCallRec(courseID, function (err, result) {
                if (err) {
                    res.end('fail');
                } else {
                    result[0].forEach(function (item) {
                        var callRec = [];
                        callRec.push(item.callDateID);
                        callRec.push(moment(item.callDate).format('YYYY-MM-DD h:mm'));
                        callRec.push(item.attendanceRate);
                        callRecs.push(callRec);
                    });
                    res.end(JSON.stringify(callRecs));
                }
            });
        }
    } else {
        res.render('back2index', {message: '抱歉,你还没有登录.'});
    }
});

router.post('/getCallRecDetail', function (req, res, next) {
    if (req.session.user) {
        if (!req.query.callDateID) {
            res.end('没有选择考勤记录');
        } else {
            var callDateID = req.query.callDateID;
            callRec.getDetail(callDateID, function (err, result) {
                if (err) {
                    res.end('fail');
                } else {
                    res.end(JSON.stringify(result));
                }
            });
        }
    } else {
        res.render('back2index', {message: '抱歉,你还没有登录.'});
    }
});

router.post('/modifyStatus', function (req, res, next) {
    var data = {}, students = [];
    var id, status;
    if (req.session.user) {
        if (!req.query.callDateID) {
            res.end('没有选择考勤记录');
        } else {
            var callDateID = req.query.callDateID;
            var busboy = new Busboy({headers: req.headers});
            busboy.on('field', function (fieldname, val, fieldnameTruncated, valTruncated) {
                data[fieldname] = val;
            });
            busboy.on('finish', function () {
                id = data.id.split(',');
                status = data.status.split(',');
                var attend = 0, attendanceRate;
                status.forEach(function (item) {
                    if (item == '1') attend++;
                });
                attendanceRate = (attend / status.length * 100).toFixed(2);
                for (var i = 0; i < id.length; i++) {
                    var student = {};
                    student.id = id[i];
                    student.status = status[i];
                    students.push(student);
                }
                console.log(students);
                callRec.modifyStatus(callDateID, students, attendanceRate, function (err) {
                    if (err) {
                        res.end(err);
                    }
                    else {
                        res.end('success');
                    }
                });
            });
            req.pipe(busboy);
        }
    } else {
        res.render('back2index', {message: '抱歉,你还没有登录.'});
    }
});

module.exports = router;