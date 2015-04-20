/**
 * @Author bamatong
 * @Fun
 * @Time 15-4-6.
 */
var express = require('express');
var moment = require('moment');
var callRec = require('../dao/callRecDao');
var router = express.Router();

router.get('/', function (req, res, next) {
    if (req.session.user) {
        callRec.showCourse(req.session.userID, function (err, courses) {
            if (err) {
                res.render('back2home', {message: '查看考勤失败,请重试.'});
            } else {
                res.render('showCallRec', {title: '查看考勤', username: req.session.user, courses: courses, leaveNum: req.session.leaveNum});
            }
        });
    } else {
        res.render('back2index', {message: '抱歉,你还没有登录.'});
    }
});

router.post('/getCallRec', function (req, res, next) {
    var callRecs = [], studentCallRecs = [], retResult = [];
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
                    retResult.push(callRecs);
                    result[1].forEach(function (item) {
                        var studentCallRec = [];
                        studentCallRec.push(item.studentID);
                        studentCallRec.push(item.studentName);
                        studentCallRec.push(item.attend);
                        studentCallRec.push(item.normal);
                        studentCallRec.push(item.absence);
                        studentCallRec.push(item.leave);
                        studentCallRecs.push(studentCallRec);
                    });
                    retResult.push(studentCallRecs);
                    res.end(JSON.stringify(retResult));
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

module.exports = router;