/**
 * @Author bamatong
 * @Fun
 * @Time 15-4-8.
 */
var student = {},
    pool = require('./mysqlPool'),
    async = require('async');

student.connect = function (callback) {
    pool.getConnection(function (err, connection) {
        if (err)
            callback('与MySQL数据库建立连接失败.', connection);
        else
            callback(null, connection);
    });
};

student.signin = function (id, imei, callback) {
    this.connect(function (err, connection) {
        if (err) {
            callback('数据库错误');
        } else {
            async.series([
                function (callback) {
                    connection.query('SELECT * FROM student WHERE studentID = ?', [id], function (err, result) {
                        if (err) {
                            callback('数据库错误');
                        }
                        else {
                            if (!result.length) {
                                callback('抱歉,请先绑定手机!');
                            } else {
                                callback();
                            }
                        }
                    });
                },
                function (callback) {
                    connection.query('SELECT IMEI FROM student WHERE studentID = ?', [id], function (err, result) {
                        if (err) {
                            callback('数据库错误');
                        }
                        else {
                            if (result[0].IMEI === null) {
                                callback('抱歉,请先绑定手机!');
                            } else if (result[0].IMEI == imei) {
                                callback()
                            } else {
                                callback('抱歉,你的账号与已绑定的手机不一致.');
                            }
                        }
                    });
                }
            ], function (err) {
                if (err) {
                    callback(err);
                } else {
                    callback(null);
                }
            });
        }
        connection.release();
    });
};

student.signup = function (id, imei, callback) {
    this.connect(function (err, connection) {
        if (err) {
            callback('数据库错误');
        } else {
            connection.query('SELECT * FROM student WHERE studentID = ?', [id], function (err, result) {
                if (err) {
                    callback('数据库错误');
                } else {
                    if (!result.length) {
                        //新学生
                        connection.query('INSERT INTO student SET ?',
                            {studentID: id, IMEI: imei},
                            function (err, result) {
                                if (err) {
                                    if (err.code == 'ER_DUP_ENTRY') callback('这台手机已经被绑定!');
                                    else callback('数据库错误');
                                }
                                else {
                                    console.log('注册成功.');
                                    callback(null);
                                }
                            });
                    } else {
                        //旧学生
                        async.series([
                            function (callback) {
                                connection.query('SELECT IMEI FROM student WHERE studentID = ?', [id], function (err, result) {
                                    if (err) {
                                        callback('数据库错误');
                                    }
                                    else {
                                        if (result[0].IMEI !== null) {
                                            callback('抱歉,该账号已经被绑定!');
                                        } else {
                                            callback();
                                        }
                                    }
                                });
                            },
                            function (callback) {
                                connection.query('UPDATE student SET IMEI =? WHERE studentID = ?', [imei, id], function (err, result) {
                                    if (err) {
                                        if (err.code == 'ER_DUP_ENTRY') callback('这台手机已经被绑定!');
                                        else callback('数据库错误');
                                    }
                                    else {
                                        callback();
                                    }
                                });
                            }
                        ], function (err) {
                            if (err) {
                                callback(err);
                            } else {
                                callback(null);
                            }
                        });
                    }
                }
            });
        }
        connection.release();
    });
};

student.showCourse = function (studentID, callback) {
    var sqlStr = "SELECT DISTINCT " +
        "C.courseID, year, whichTerm, courseName, studentNum " +
        "FROM " +
        "term D " +
        "INNER JOIN (" +
        "(" +
        "class A " +
        "INNER JOIN student B ON A.studentID = B.studentID " +
        "AND B.studentID = ?" +
        ")" +
        "INNER JOIN course C ON A.courseID = C.courseID" +
        ") ON A.termID = D.termID " +
        "ORDER BY year, whichTerm";
    this.connect(function (err, connection) {
        if (err) {
            callback(err, null);
        } else {
            connection.query({sql: sqlStr, nestTables: '_'}, [studentID], function (err, result) {
                if (err) {
                    callback(err, null);
                } else {
                    callback(null, result);
                }
            });
        }
        connection.release();
    });
};

student.getCallRec = function (studentID, courseID, callback) {
    var sqlStr = "SELECT " +
        "C.studentName," +
        "COUNT(*) AS 'attend'," +
        "COUNT(IF(`status`=1,1,NULL)) AS 'normal'," +
        "COUNT(IF(`status`=2,1,NULL)) AS 'absence'," +
        "COUNT(IF(`status`=3,1,NULL)) AS 'leave' " +
        "FROM " +
        "callDate A " +
        "INNER JOIN (" +
        "callRecord B " +
        "INNER JOIN student C ON B.studentID = C.studentID AND C.studentID=? " +
        ") ON B.callDateID = A.callDateID AND A.courseID = ?";
    this.connect(function (err, connection) {
        if (err) {
            callback(err, null);
        } else {
            connection.query({sql: sqlStr, nestTables: '_'}, [studentID, courseID], function (err, result) {
                if (err) {
                    callback(err, null);
                } else {
                    callback(null, result);
                }
            });
        }
        connection.release();
    });
};

student.askForLeave = function (studentID, reason, leaveDate, courseID, callback) {
    this.connect(function (err, connection) {
        if (err) {
            callback(err);
        } else {
            connection.query(
                "INSERT INTO `leave` (`reason`, `leaveDate`, `status`, `studentID`, `courseID`) VALUES (" +
                connection.escape(reason) + "," + connection.escape(leaveDate) + ",'0'," + connection.escape(studentID) + "," + connection.escape(courseID) + ")"
                , function (err) {
                    if (err) {
                        console.log(err);
                        callback(err)
                    } else {
                        callback(null);
                    }
                });
        }
    });
};

module.exports = student;