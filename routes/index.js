var express = require('express');
var router = express.Router();

/* GET index page. */
router.get('/', function (req, res, next) {
    res.render('index', {stylesheet: 'index', title: '首页'});
});

module.exports = router;
