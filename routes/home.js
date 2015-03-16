/**
 * @Author bamatong
 * @Fun 主页路由配置
 * @Time 15-3-15.
 */
var express = require('express');
var teacher = require('../dao/teacherDao');
var router = express.Router();

/* GET home page. */
router.post('/', function (req, res, next) {
    var obj = req.body;
    teacher.login(obj.username, obj.password, function (err) {
        if (err) {
            console.log(err);
            res.redirect('/')
        } else {
            res.render('home', {stylesheet: 'home', title: '控制台', username: obj.username});
        }
    });
});

router.get('/', function (req, res, next) {

});

router.get('logout', function (req, res, next) {

});

module.exports = router;
