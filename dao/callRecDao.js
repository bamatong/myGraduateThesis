/**
 * @Author bamatong
 * @Fun
 * @Time 15-4-6.
 */
var callRec = {},
    pool = require('./mysqlPool'),
    async = require('async');

callRec.connect = function (callback) {
    pool.getConnection(function (err, connection) {
        if (err)
            callback('与MySQL数据库建立连接失败.', connection);
        else
            callback(null, connection);
    });
};

callRec.showCourse = function (teacherID, callback) {
    var sqlStr = "SELECT DISTINCT " +
        "B.courseID, year, whichTerm, courseName, studentNum " +
        "FROM " +
        "term A " +
        "INNER JOIN (" +
        "(" +
        "course B " +
        "INNER JOIN teacher C ON B.teacherID = C.teacherID " +
        "AND B.teacherID = ?" +
        ") " +
        "INNER JOIN class D ON D.courseID = B.courseID" +
        ") ON A.termID = D.termID " +
        "ORDER BY year, whichTerm";
    var courses = [];
    this.connect(function (err, connection) {
        if (err) {
            callback(err, null);
        } else {
            connection.query({sql: sqlStr, nestTables: '_'}, [teacherID], function (err, result) {
                if (err) {
                    callback(err, null);
                } else {
                    result.forEach(function (item) {
                        var obj = {};
                        obj.termID = item.A_termID;
                        obj.courseID = item.B_courseID;
                        obj.course = item.A_year + '年' + item.A_whichTerm + '学期' + item.B_courseName;
                        obj.courseName = item.B_courseName;
                        courses.push(obj);
                    });
                    callback(null, courses);
                }
            });
        }
        connection.release();
    });
};

callRec.showCallRec = function (courseID, callback) {
    var sqlStr1 = "SELECT callDateID, callDate, attendanceRate FROM callDate WHERE courseID = ? ORDER BY callDate";
    var sqlStr2 = "SELECT " +
        "student.studentID," +
        "student.studentName," +
        "COUNT(*) AS 'attend'," +
        "COUNT(IF(`status`=1,1,NULL)) AS 'normal'," +
        "COUNT(IF(`status`=2,1,NULL)) AS 'absence'," +
        "COUNT(IF(`status`=3,1,NULL)) AS 'leave' " +
        "FROM " +
        "callDate " +
        "INNER JOIN (" +
        "callRecord " +
        "INNER JOIN student ON callRecord.studentID = student.studentID" +
        ") ON callRecord.callDateID = callDate.callDateID AND courseID = ? " +
        "GROUP BY " +
        "studentID";
    this.connect(function (err, connection) {
        if (err) {
            callback(err, null);
        } else {
            async.series([
                function (callback) {
                    connection.query(sqlStr1, [courseID], function (err, result) {
                        if (err) {
                            callback(err);
                        } else {
                            callback(null, result);
                        }
                    });
                },
                function (callback) {
                    connection.query(sqlStr2, [courseID], function (err, result) {
                        if (err) {
                            callback(err);
                        } else {
                            callback(null, result);
                        }
                    });
                }
            ], function (err, result) {
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

callRec.getDetail = function (callDateID, callback) {
    var sqlStr = "SELECT " +
        "callRecord.studentID," +
        "student.studentName," +
        "callRecord. `status` " +
        "FROM " +
        "callRecord " +
        "INNER JOIN student ON callRecord.studentID = student.studentID " +
        "AND callDateID = ?";
    var attendNum, absence, attendance, leave;
    var callRecDetail = {}, callRecs = [];
    this.connect(function (err, connection) {
        if (err) {
            callback(err, null);
        } else {
            connection.query(sqlStr, [callDateID], function (err, result) {
                if (err) {
                    callback(err, null);
                } else {
                    absence = attendance = leave = 0;
                    result.forEach(function (item) {
                        switch (item.status) {
                            case 1:
                                attendance++;
                                break;
                            case 2:
                                absence++;
                                break;
                            case 3:
                                leave++;
                                break;
                            default :
                                throw err;
                        }
                        var callRec = [];
                        callRec.push(item.studentID);
                        callRec.push(item.studentName);
                        callRec.push(item.status);
                        callRecs.push(callRec);
                    });
                    attendNum = callRecs.length;
                    callRecDetail.students = callRecs;
                    callRecDetail.attendNum = attendNum;
                    callRecDetail.attendance = attendance;
                    callRecDetail.absence = absence;
                    callRecDetail.leave = leave;
                    callback(null, callRecDetail);
                }
            });
        }
        connection.release();
    });
};

callRec.getCallRec = function (courseID, callback) {
    var callDateIDs = [];
    async.series([
        function (callback) {
            callRec.showCallRec(courseID, function (err, result) {
                if (err) {
                    callback(err);
                } else {
                    result[0].forEach(function (item) {
                        callDateIDs.push(item.callDateID);
                    });
                    callback(null, result);
                }
            });
        },
        function (callback) {
            var callRecDetails = [];
            async.eachSeries(callDateIDs, function (item, callback) {
                callRec.getDetail(item, function (err, result) {
                    if (err) {
                        callback(err);
                    } else {
                        callRecDetails.push(result);
                        callback(null);
                    }
                });
            }, function (err) {
                if (err) {
                    callback(err);
                } else {
                    callback(null, callRecDetails);
                }
            });
        }
    ], function (err, result) {
        if (err) {
            callback(err, null);
        } else {
            callback(err, result);
        }
    });
};

callRec.modifyStatus = function (callDateID, students, attendanceRate, callback) {
    var sqlStr = "UPDATE callRecord SET status = ? WHERE studentID = ? AND callDateID = ?";
    this.connect(function (err, connection) {
        if (err) {
            callback(err, null);
        } else {
            connection.beginTransaction(function (err) {
                if (err) {
                    callback(err, null);
                } else {
                    async.eachSeries(students, function (item, callback) {
                        connection.query(sqlStr, [item.status, item.id, callDateID], function (err, result) {
                            if (err) {
                                callback(err);
                            } else {
                                callback(null);
                            }
                        });
                    }, function (err) {
                        if (err) {
                            connection.rollback(function () {
                                callback(err);
                            });
                        } else {
                            connection.query("UPDATE callDate SET attendanceRate = ? WHERE callDateID = ?", [attendanceRate, callDateID], function (err, result) {
                                if (err) {
                                    connection.rollback(function () {
                                        callback(err);
                                    });
                                } else {
                                    connection.commit(function (err) {
                                        if (err) {
                                            connection.rollback(function () {
                                                callback('抱歉,操作失败.');
                                            });
                                        }
                                        callback();
                                    });
                                }
                            });
                        }
                    });
                }
            });
        }
        connection.release();
    });
};

module.exports = callRec;