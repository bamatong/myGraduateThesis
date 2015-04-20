/**
 * @Author bamatong
 * @Fun 用户登录
 * @Time 15-3-15.
 */
var express = require('express');
var teacher = require('../dao/teacherDao');
var student = require('../dao/studentDao');
var router = express.Router();

/* GET home page. */
router.post('/', function (req, res, next) {
    var obj = req.body;
    if (obj) {
        teacher.signin(obj.teacherID, obj.password, function (err, userinfo) {
            if (err) {
                res.render('back2index', {message: err});
            } else {
                teacher.getLeaveNum(obj.teacherID, function (err, result) {
                    if (err) {
                        res.render('back2index', {message: err});
                    } else {
                        req.session.leaveNum = result;
                        req.session.user = userinfo.teacherName;
                        req.session.userID = userinfo.teacherID;
                        res.render('home', {stylesheet: 'home', title: '控制台', username: req.session.user, leaveNum: req.session.leaveNum});
                    }
                });
            }
        });
    } else {
        res.render('back2index', {message: '抱歉,请输入用户名密码.'});
    }
});

router.get('/', function (req, res, next) {
    if (req.session.user) {
        res.render('home', {title: '控制台', username: req.session.user, leaveNum: req.session.leaveNum});
    } else {
        res.render('back2index', {message: '抱歉,你还没有登录.'});
    }
});

module.exports = router;
