/**
 * @Author bamatong
 * @Fun
 * @Time 15-3-15.
 */
var teacher = {},
    pool = require('./mysqlPool');

teacher.connect = function (callback) {
    pool.getConnection(function (err, connection) {
        if (err)
            callback('与MySQL数据库建立连接失败.', connection);
        else
            callback(null, connection);
    });
};

teacher.signin = function (id, pwd, callback) {
    this.connect(function (err, connection) {
        if (err) {
            callback(err, null);
        } else {
            var queryStr = 'SELECT * FROM teacher WHERE teacherID = ? and password = ?';
            connection.query(queryStr, [id, pwd], function (err, result) {
                if (err) {
                    callback('抱歉,登录失败.');
                }
                else {
                    if (result.length) {
                        callback(null, result[0]);
                    }
                    else {
                        callback('抱歉,用户名或密码错误.');
                    }
                }
            });
        }
        connection.release();
    });
};

teacher.signup = function (name, id, pwd, callback) {
    this.findByID(id, function (err, connection, result) {
        if (err) {
            callback('抱歉,注册失败.');
        } else {
            if (result.length) {
                callback('抱歉,用户名已存在!');
            } else {
                var queryStr = 'INSERT INTO teacher SET ?';
                connection.query(queryStr,
                    {teacherID: id, teacherName: name, password: pwd},
                    function (err, result) {
                        if (err) {
                            callback('抱歉,注册失败.');
                        }
                        else {
                            console.log('注册成功.');
                            callback(null);
                        }
                });
            }
        }
        connection.release();
    });
};

teacher.findByID = function (id, callback) {
    this.connect(function (err, connection) {
        if (err) {
            callback(err, connection, null);
        } else {
            var queryStr = 'SELECT * FROM teacher WHERE teacherID = ?';
            connection.query(queryStr, [id], function (err, result) {
                if (err) {
                    callback(err, connection, null);
                } else {
                    callback(null, connection, result);
                }
            });
        }
    });
};

module.exports = teacher;