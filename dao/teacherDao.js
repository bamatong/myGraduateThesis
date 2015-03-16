/**
 * @Author bamatong
 * @Fun
 * @Time 15-3-15.
 */
var teacher = {},
    pool = require('./mysqlPool');

teacher.login = function (name, pwd, callback) {
    pool.getConnection(function (err, connection) {
        if (err) console.log('与MySQL数据库建立连接失败.');
        else {
            console.log('与MySQL数据库建立连接成功.');
            var queryStr = 'select * from teacher where teacherName = ? and password = ?';
            connection.query(queryStr, [name, pwd], function (err, result) {
                if (err) {
                    callback(err);
                }
                else {
                    if (result.length) {
                        connection.release();
                        callback(null);
                    }
                    else {
                        err = '登录失败.'
                        callback(err);
                    }
                }
            });
        }
    });
};
module.exports = teacher;