/**
 * @Author bamatong
 * @Fun
 * @Time 15-4-2.
 */
var express = require('express');
var notice = require('../dao/noticeDao');
var Busboy = require('busboy');
var router = express.Router();

router.get('/', function (req, res, next) {
    if (req.session.user) {
        notice.showCourse(req.session.userID, function (err, courses) {
            if (err) {
                res.render('back2home', {message: '打开推送编辑页面失败,请重试.'});
            } else {
                res.render('editPush', {title: '编辑通知', username: req.session.user, courses: courses, leaveNum: req.session.leaveNum});
            }
        });
    } else {
        res.render('back2index', {message: '抱歉,你还没有登录.'});
    }
});

router.post('/getStudent', function (req, res, next) {
    if (req.session.user) {
        if (!req.query.courseID || !req.query.termID) {
            res.end('没有选择课程');
        } else {
            var courseID = req.query.courseID,
                termID = req.query.termID;
            notice.showStudent(termID, courseID, function (err, result) {
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

router.post('/', function (req, res, next) {
    if (req.session.user) {
        var noticeInfo = {};
        var busboy = new Busboy({headers: req.headers});
        busboy.on('field', function (fieldname, val) {
            noticeInfo[fieldname] = val;
        });
        busboy.on('finish', function () {
            notice.pushNotice(noticeInfo, function(err){
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

module.exports = router;
