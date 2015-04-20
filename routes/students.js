/**
 * @Author bamatong
 * @Fun
 * @Time 15-4-8.
 */
var express = require('express');
var student = require('../dao/studentDao');
var router = express.Router();

router.post('/signin', function (req, res, next) {
    var obj = req.body;
    student.signin(obj.account, obj.IMEI, function (err, userinfo) {
        if (err) {
            res.end(err);
        } else {
            req.session.student = obj.account;
            res.end('success');
        }
    });
});

router.post('/signup', function (req, res, next) {
    var obj = req.body;
    student.signup(obj.account, obj.IMEI, function (err) {
        if (err) {
            res.end(err);
        } else {
            res.end('success');
        }
    });
});

router.post('/logout', function (req, res, next) {
    if (req.session.student) {
        req.session.destroy(function (err) {
            if (err) {
                res.end('session销毁失败');
            }
            else {
                res.end('success');
            }
        });
    } else {
        res.end('你还没登录!');
    }
});

router.post('/getCourse', function (req, res, next) {
    if (req.session.student) {
        student.showCourse(req.session.student, function (err, result) {
            if (err) {
                res.end('fail');
            } else {
                res.end(JSON.stringify(result));
            }
        });
    }
    else {
        res.end('抱歉,你还没有登录');
    }
});

router.post('/getCallRec', function (req, res, next) {
    if (req.session.student) {
        if (!req.body) {
            res.end('没有选择课程');
        } else {
            var courseID = req.body.courseID;
            console.log(courseID);
            student.getCallRec(req.session.student, courseID, function (err, result) {
                if (err) {
                    res.end('fail');
                } else {
                    res.end(JSON.stringify(result));
                }
            });
        }
    }
    else {
        res.end('抱歉,你还没有登录');
    }
});

router.post('/askForLeave', function (req, res, next) {
    if (req.session.student) {
        if (!req.body) {
            res.end('没有选择课程');
        } else {
            var reason = req.body.reason,
                leaveDate = req.body.leaveDate,
                courseID = req.body.courseID;
            student.askForLeave(req.session.student, reason, leaveDate, courseID, function (err) {
                if (err) {
                    res.end('fail');
                } else {
                    res.end('success');
                }
            });
        }
    }
    else {
        res.end('抱歉,你还没有登录');
    }
});

module.exports = router;