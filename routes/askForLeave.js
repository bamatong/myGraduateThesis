/**
 * @Author bamatong
 * @Fun
 * @Time 15-4-17.
 */
var express = require('express');
var leave = require('../dao/leaveDao');
var Busboy = require('busboy');
var router = express.Router();

router.get('/', function (req, res, next) {
    if (req.session.user) {
        leave.getLeave(req.session.userID, function (err, result) {
            if (err) {
                res.render('back2home', {message: '查看请假情况失败.'});
            } else {
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
                leave.getLeaveNum(req.session.userID, function(err, result){
                    if (err) {
                        res.render('back2home', {message: '获取请假申请数目失败'});
                    } else {
                        req.session.leaveNum = result;
                        res.render('askForLeave', {
                            title: '查看课程',
                            username: req.session.user,
                            unhandledLeaves: unhandledLeaves,
                            handledLeaves: handledLeaves,
                            leaveNum: req.session.leaveNum
                        });
                    }
                });
            }
        });
    } else {
        res.render('back2index', {message: '抱歉,你还没有登录.'});
    }
});

router.post('/agree', function (req, res, next) {
    if (req.session.user) {
        var leaves = {};
        var busboy = new Busboy({headers: req.headers});
        busboy.on('field', function (fieldname, val) {
            leaves[fieldname] = val;
        });
        busboy.on('finish', function () {
            leave.agree(leaves, function(err){
                if(err) {
                    res.end(err);
                }
                else {
                    leave.getLeaveNum(req.session.userID, function(err, result){
                        if (err) {
                            res.render('back2home', {message: '获取请假申请数目失败'});
                        } else {
                            req.session.leaveNum = result;
                            res.end('success');
                        }
                    });
                }
            });
        });
        req.pipe(busboy);
    }
    else {
        res.end('抱歉,你还没有登录');
    }
});

router.post('/disagree', function (req, res, next) {
    if (req.session.user) {
        var leaves = {};
        var busboy = new Busboy({headers: req.headers});
        busboy.on('field', function (fieldname, val) {
            leaves[fieldname] = val;
        });
        busboy.on('finish', function () {
            leave.disagree(leaves, function(err){
                if(err) {
                    res.end(err);
                }
                else {
                    leave.getLeaveNum(req.session.userID, function(err, result){
                        if (err) {
                            res.render('back2home', {message: '获取请假申请数目失败'});
                        } else {
                            req.session.leaveNum = result;
                            res.end('success');
                        }
                    });
                }
            });
        });
        req.pipe(busboy);
    }
    else {
        res.end('抱歉,你还没有登录');
    }
});

module.exports = router;