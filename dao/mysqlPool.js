/**
 * @Author bamatong
 * @Fun
 * @Time 15-3-15.
 */
var mysql = require('mysql');
var pool = mysql.createPool({
    host: 'localhost',
    port: 3306,
    database: 'attendance',
    multipleStatements: true,
    user: 'admin',
    password: 'admin4attendance'
});
module.exports = pool;
