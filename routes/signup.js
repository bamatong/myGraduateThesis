/**
 * @Author bamatong
 * @Fun 用户注册
 * @Time 15-3-18.
 */
var express = require('express');
var teacher = require('../dao/teacherDao');
var router = express.Router();

router.post('/', function (req, res, next) {
    var obj = req.body;
    teacher.signup(obj.teacherName, obj.teacherID, obj.password, function (err) {
        if (err) {
            res.render('redirect', {message: err});
        } else {
            req.session.user = obj.teacherName;
            req.session.userID = obj.teacherID;
            res.render('home', {title: '控制台', username: obj.teacherName});
        }
    });
});

module.exports = router;