/**
 * @Author bamatong
 * @Fun 处理退出登录
 * @Time 15-3-16.
 */
var express = require('express');
var router = express.Router();

router.get('/', function (req, res, next) {
    if (req.session.user) {
        req.session.destroy(function (err) {
            if (err) {
                res.render('back2home', {message: '抱歉,退出失败.'});
            }
            else {
                res.render('back2index', {message: '你已经安全退出.'});
            }
        });
    } else {
        res.render('back2index', {message: '抱歉,你还没有登录.'});
    }
});

module.exports = router;