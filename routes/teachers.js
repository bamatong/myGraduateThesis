/**
 * @Author bamatong
 * @Fun
 * @Time 15-4-9.
 */
var express = require('express');
var teacher = require('../dao/teacherDao');
var leave = require('../dao/leaveDao');
var router = express.Router();

router.post('/signin', function (req, res, next) {
    var obj = req.body;
    teacher.signin(obj.account, obj.password, function (err, userinfo) {
        if (err) {
            res.end(err);
        } else {
            req.session.teacher = obj.account;
            req.session.teacherName = userinfo.teacherName;
            res.end('success');
        }
    });
});

router.post('/getCourse', function (req, res, next) {
    if (req.session.teacher) {
        teacher.showCourse(req.session.teacher, function (err, result) {
            if (err) {
                res.end('fail');
            } else {
                res.end(JSON.stringify(result));
            }
        });
    } else {
        res.end('抱歉,你还没有登录');
    }
});

router.post('/getStudent', function (req, res, next) {
    if (req.session.teacher) {
        if (!req.body) {
            res.end('没有选择课程');
        } else {
            var courseID = req.body.courseID;
            teacher.showStudent(courseID, function (err, result) {
                if (err) {
                    res.end('fail');
                } else {
                    res.end(JSON.stringify(result));
                }
            });
        }
    } else {
        res.end('抱歉,你还没有登录');
    }
});

router.post('/getCallRec', function (req, res, next) {
    if (req.session.teacher) {
        if (!req.body) {
            res.end('没有选择课程');
        } else {
            var courseID = req.body.courseID;
            teacher.getCallRec(courseID, function (err, result) {
                if (err) {
                    res.end('fail');
                } else {
                    res.end(JSON.stringify(result));
                }
            });
        }
    } else {
        res.end('抱歉,你还没有登录');
    }
});

router.post('/modifyCallRec', function (req, res, next) {
    if (req.session.teacher) {
        if (!req.body) {
            res.end('没有选择考勤记录');
        } else {
            var callDateID = req.body.callDateID,
                studentID = req.body.studentID,
                status = req.body.status;
            teacher.modifyCallRec(callDateID, studentID, status, function (err) {
                if (err) {
                    res.end(err);
                } else {
                    res.end('success');
                }
            });
        }
    } else {
        res.end('抱歉,你还没有登录');
    }
});

router.get('/getUserInfo', function(req,res,next){
    if (req.session.teacher) {
        var userInfo = {};
        userInfo.id = req.session.teacher;
        userInfo.name = req.session.teacherName;
        res.end(JSON.stringify(userInfo));
    } else {
        res.end('抱歉,你还没有登录');
    }
});

router.post('/modifyPwd', function (req, res, next) {
    if (req.session.teacher || req.session.userID) {
        var oldPassword = req.body.oldPassword,
            newPassword = req.body.newPassword,
            confirmPassword = req.body.confirmPassword,
            teacherID;
        if (newPassword === confirmPassword) {
            if (req.session.teacher)
                teacherID = req.session.teacher;
            else
                teacherID = req.session.userID;
            teacher.modifyPwd(teacherID, oldPassword, newPassword, function (err) {
                if (err) {
                    if (req.session.teacher)
                        res.end(err);
                    else
                        res.render('back2home', {message: err});
                } else {
                    if (req.session.teacher)
                        res.end('success');
                    else
                        res.render('back2index', {message: '已修改密码,请重新登录.'});
                }
            });
        } else {
            if (req.session.teacher)
                res.end('两次输入的密码不一致.');
            else
                res.render('back2home', {message: '两次输入的密码不一致.'});
        }
    } else {
        res.end('抱歉,你还没有登录');
    }
});

router.get('/getLeaves', function(req,res,next){
    if (req.session.teacher) {
        leave.getLeave(req.session.teacher, function (err, result) {
            if (err) {
                res.end('查看请假情况失败');
            } else {
                var leaves = {};
                var unhandledLeaves = [], i;
                for (i = 0; i < result[0][0].length; i++) {
                    result[0][0][i]['course'] = result[0][1][i];
                    unhandledLeaves.push(result[0][0][i]);
                }
                var handledLeaves = [];
                for (i = 0; i < result[1][0].length; i++) {
                    result[1][0][i]['course'] = result[1][1][i];
                    handledLeaves.push(result[1][0][i]);
                }
                leaves.unhandledLeaves = unhandledLeaves;
                leaves.handledLeaves = handledLeaves;
                res.end(JSON.stringify(leaves));
            }
        });
    } else {
        res.end('抱歉,你还没有登录');
    }
});

router.post('/agreeLeave', function(req,res,next) {
    if (req.session.teacher) {
        if (!req.body) {
            res.end('没有选择请假记录');
        } else {
            var leaveID = req.body.leaveID,
                courseName = req.body.courseName,
                leaveDate = req.body.leaveDate,
                studentID = req.body.studentID;
            teacher.agreeLeave(leaveID, courseName, leaveDate, studentID, function(err){
                if (err) {
                    res.end(err);
                } else {
                    res.end('success');
                }
            })
        }
    }
});

router.post('/disagreeLeave', function(req,res,next) {
    if (req.session.teacher) {
        if (!req.body) {
            res.end('没有选择请假记录');
        } else {
            var leaveID = req.body.leaveID,
                courseName = req.body.courseName,
                leaveDate = req.body.leaveDate,
                studentID = req.body.studentID;
            teacher.disagreeLeave(leaveID, courseName, leaveDate, studentID, function(err){
                if (err) {
                    res.end(err);
                } else {
                    res.end('success');
                }
            })
        }
    }
});

module.exports = router;