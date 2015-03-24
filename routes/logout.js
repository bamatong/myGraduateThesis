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
                console.log('session销毁失败');
                res.render('redirect', {message: '抱歉,退出失败.'});
            }
            else {
                console.log('session被销毁');
                res.render('redirect', {message: '你已经安全退出.'});
            }
        });
    } else {
        res.render('redirect', {message: '抱歉,你还没有登录.'});
    }
});

module.exports = router;