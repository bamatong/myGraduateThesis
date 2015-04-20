/**
 * @Author bamatong
 * @Fun
 * @Time 15-3-24.
 */
var express = require('express');
var Busboy = require('busboy');
var course = require('../dao/courseDao');
var router = express.Router();

router.get('/showCourse', function (req, res, next) {
    if (req.session.user) {
        course.showCourse(req.session.userID, function (err, result) {
            if (err) {
                res.render('back2home', {message: '查看课程失败.'});
            } else {
                res.render('showCourse', {
                    title: '查看课程',
                    username: req.session.user,
                    courses: result,
                    leaveNum: req.session.leaveNum
                });
            }
        });
    } else {
        res.render('back2index', {message: '抱歉,你还没有登录.'});
    }
});

router.get('/editCourse', function (req, res, next) {
    if (req.session.user) {
        if (!req.query) {
            res.end('没有选择课程');
        } else {
            var termID = req.query.termID,
                courseID = req.query.courseID,
                year = req.query.year,
                whichTerm = req.query.whichTerm,
                courseName = req.query.courseName;
            course.showStudent(courseID, function (err, result) {
                if (err) {
                    res.render('back2home', {message: '查看课程详细信息失败.'});
                } else {
                    res.render('editCourse',
                        {
                            title: '编辑课程',
                            username: req.session.user,
                            students: result,
                            termID: termID,
                            courseID: courseID,
                            year: year,
                            whichTerm: whichTerm,
                            courseName: courseName,
                            leaveNum: req.session.leaveNum
                        }
                    );
                }
            });
        }
    } else {
        res.render('back2index', {message: '抱歉,你还没有登录.'});
    }
});

router.post('/editCourse/delCourse', function (req, res, next) {
    if (req.session.user) {
        if (!req.query.courseID) {
            res.end('没有选择课程');
        } else {
            var courseID = req.query.courseID;
            course.delCourse(courseID, function (err) {
                if (err) {
                    res.end('fail');
                } else {
                    res.end('success');
                }
            });
        }
    } else {
        res.render('back2index', {message: '抱歉,你还没有登录.'});
    }
});

router.post('/editCourse/modifyCourse', function (req, res, next) {
    if (req.session.user) {
        if (!req.query) {
            res.end('没有选择课程');
        } else {
            var courseInfo = {}, oldCourseID = req.query.oldCourseID;
            var busboy = new Busboy({headers: req.headers});
            busboy.on('field', function (fieldname, val, fieldnameTruncated, valTruncated) {
                courseInfo[fieldname] = val;
            });
            busboy.on('finish', function () {
                course.modifyCourse(oldCourseID, courseInfo, function (err, itemID) {
                    if (err) {
                        res.end(err);
                    }
                    else {
                        res.end('success&' + itemID);
                    }
                });
            });
            req.pipe(busboy);
        }
    } else {
        res.render('back2index', {message: '抱歉,你还没有登录.'});
    }
});

router.post('/editCourse/delStudent', function (req, res, next) {
    if (req.session.user) {
        if (!req.query) {
            res.end('没有选择课程');
        } else {
            var courseID = req.query.courseID,
                studentID = req.query.studentID;
            course.delStudent(courseID, studentID, function (err) {
                if (err) {
                    res.end('fail');
                } else {
                    res.end('success');
                }
            });
        }
    } else {
        res.render('back2index', {message: '抱歉,你还没有登录.'});
    }
});

router.post('/editCourse/addStudent', function (req, res, next) {
    if (req.session.user) {
        if (!req.query) {
            res.end('没有选择课程');
        } else {
            var termID = req.query.termID,
                courseID = req.query.courseID,
                studentID = req.query.studentID,
                studentName = req.query.studentName;
            course.addStudent(termID, courseID, studentID, studentName, function (err) {
                if (err) {
                    res.end(err);
                } else {
                    res.end('success');
                }
            });
        }
    } else {
        res.render('back2index', {message: '抱歉,你还没有登录.'});
    }
});

module.exports = router;