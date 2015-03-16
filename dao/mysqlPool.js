/**
 * @Author bamatong
 * @Fun
 * @Time 15-3-15.
 */
var mysql = require('mysql');
var pool = mysql.createPool({
    host: 'localhost',
    port : 3306,
    database: 'graduateThesis',
    user : 'tzhongwei',
    password : 'chongwai'
});
module.exports = pool;
