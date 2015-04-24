/**
 * @Author bamatong
 * @Fun
 * @Time 15-4-17.
 */
var leave = {},
    pool = require('./mysqlPool'),
    async = require('async'),
    Xinge = require('Xg-Push-SDK'),
    moment = require('moment');

leave.connect = function (callback) {
    pool.getConnection(function (err, connection) {
        if (err)
            callback('与MySQL数据库建立连接失败.', connection);
        else
            callback(null, connection);
    });
};

leave.getHandledLeave = function (teacherID, callback) {
    var sqlStr1 = "SELECT " +
        "A.studentID,A.studentName,C.courseID,B.reason,B.leaveDate,B.leaveID,B.`status` " +
        "FROM " +
        "student A " +
        "INNER JOIN (" +
        "`leave` B " +
        "INNER JOIN (" +
        "course C " +
        "INNER JOIN teacher D ON C.teacherID = D.teacherID AND D.teacherID = ? " +
        ") ON B.courseID = C.courseID AND `status` <> 0 " +
        ") ON A.studentID = B.studentID " +
        "ORDER BY B.leaveDate";
    var sqlStr2 = "SELECT DISTINCT " +
        "A.`year`,A.whichTerm,C.courseName " +
        "FROM " +
        "term A " +
        "INNER JOIN ( " +
        "class B " +
        "INNER JOIN course C ON B.courseID = C.courseID " +
        "AND C.courseID = ?" +
        ") ON B.termID = A.termID";
    var courseIDs = [];
    this.connect(function (err, connection) {
        if (err) {
            callback(err, null);
        } else {
            async.series([
                function (callback) {
                    connection.query({sql: sqlStr1, nestTables: '_'}, [teacherID], function (err, result) {
                        if (err) {
                            callback(err, null);
                        } else {
                            result.forEach(function (item) {
                                courseIDs.push(item.C_courseID);
                                item.B_leaveDate = moment(item.B_leaveDate).format('YYYY-MM-DD');
                            });
                            callback(null, result);
                        }
                    });
                },
                function (callback) {
                    var courses = [];
                    async.eachSeries(courseIDs, function (item, callback) {
                        connection.query({sql: sqlStr2, nestTables: '_'}, [item], function (err, result) {
                            if (err) {
                                callback(err, null);
                            } else {
                                courses.push(result[0].A_year + '年' + result[0].A_whichTerm + '学期' + result[0].C_courseName);
                                callback(null);
                            }
                        });
                    }, function (err, result) {
                        if (err) {
                            callback(err);
                        } else {
                            callback(null, courses);
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

leave.getUnhandledLeave = function (teacherID, callback) {
    var sqlStr1 = "SELECT " +
        "A.studentID,A.studentName,C.courseID,B.reason,B.leaveDate,B.leaveID " +
        "FROM " +
        "student A " +
        "INNER JOIN (" +
        "`leave` B " +
        "INNER JOIN (" +
        "course C " +
        "INNER JOIN teacher D ON C.teacherID = D.teacherID AND D.teacherID = ? " +
        ") ON B.courseID = C.courseID AND `status` = 0 " +
        ") ON A.studentID = B.studentID " +
        "ORDER BY B.leaveDate";
    var sqlStr2 = "SELECT DISTINCT " +
        "A.`year`,A.whichTerm,C.courseName " +
        "FROM " +
        "term A " +
        "INNER JOIN ( " +
        "class B " +
        "INNER JOIN course C ON B.courseID = C.courseID " +
        "AND C.courseID = ?" +
        ") ON B.termID = A.termID";
    var courseIDs = [];
    this.connect(function (err, connection) {
        if (err) {
            callback(err, null);
        } else {
            async.series([
                function (callback) {
                    connection.query({sql: sqlStr1, nestTables: '_'}, [teacherID], function (err, result) {
                        if (err) {
                            callback(err, null);
                        } else {
                            result.forEach(function (item) {
                                courseIDs.push(item.C_courseID);
                                item.B_leaveDate = moment(item.B_leaveDate).format('YYYY-MM-DD');
                            });
                            callback(null, result);
                        }
                    });
                },
                function (callback) {
                    var courses = [];
                    async.eachSeries(courseIDs, function (item, callback) {
                        connection.query({sql: sqlStr2, nestTables: '_'}, [item], function (err, result) {
                            if (err) {
                                callback(err, null);
                            } else {
                                courses.push(result[0].A_year + '年' + result[0].A_whichTerm + '学期' + result[0].C_courseName);
                                callback(null);
                            }
                        });
                    }, function (err, result) {
                        if (err) {
                            callback(err);
                        } else {
                            callback(null, courses)
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

leave.getLeave = function (teacherID, callback) {
    async.series([
        function (callback) {
            leave.getUnhandledLeave(teacherID, function (err, result) {
                if (err)
                    callback(err);
                else
                    callback(null, result);
            });
        },
        function (callback) {
            leave.getHandledLeave(teacherID, function (err, result) {
                if (err)
                    callback(err);
                else
                    callback(null, result);
            });
        }
    ], function (err, result) {
        if (err) {
            callback(err, null);
        } else {
            callback(null, result);
        }
    });
};

leave.getLeaveNum = function (teacherID, callback) {
    var sqlStr = "SELECT" +
        " A.studentID,A.studentName,C.courseID,B.reason,B.leaveDate " +
        "FROM " +
        "student A " +
        "INNER JOIN (" +
        "`leave` B " +
        "INNER JOIN (" +
        "course C " +
        "INNER JOIN teacher D ON C.teacherID = D.teacherID AND D.teacherID = ? " +
        ") ON B.courseID = C.courseID " +
        ") ON A.studentID = B.studentID " +
        "WHERE `status` = 0";
    this.connect(function (err, connection) {
        if (err) {
            callback(err, null);
        } else {
            connection.query({sql: sqlStr, nestTables: '_'}, [teacherID], function (err, result) {
                if (err) {
                    callback(err, null);
                } else {
                    callback(null, result.length);
                }
            });
        }
        connection.release();
    });
};

leave.agree = function (leaves, callback) {
    var leaveIDs, studentIDs, leaveCourses, leaveDates, i = 0;
    leaveIDs = leaves.leaveIDs.split(',');
    studentIDs = leaves.studentIDs.split(',');
    leaveCourses = leaves.leaveCourses.split(',');
    leaveDates = leaves.leaveDates.split(',');
    console.log(leaveIDs);
    this.connect(function (err, connection) {
        if (err) {
            callback('抱歉,操作失败.');
        } else {
            async.series([
                function (callback) {
                    connection.beginTransaction(function (err) {
                        if (err) {
                            callback('抱歉,操作失败.');
                        } else {
                            async.eachSeries(leaveIDs, function (item, callback) {
                                connection.query('UPDATE `leave` SET `status` = 2 WHERE leaveID = ?', [item], function (err) {
                                    if (err) {
                                        callback('抱歉,操作失败.');
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
                },
                function (callback) {
                    async.each(leaveIDs, function (item, callback) {
                        //推送消息
                        var accessId = 2100098776;
                        var secretKey = '72d2de3691f5b2b3005023bbdb33a710';
                        var XingeApp = new Xinge.XingeApp(accessId, secretKey);

                        //Android message start.
                        var style = new Xinge.Style();
                        style.ring = 1;
                        style.vibrate = 1;
                        style.builderId = 77;

                        var action = new Xinge.ClickAction();
                        action.actionType = Xinge.ACTION_TYPE_ACTIVITY;  //打开应用

                        var androidMessage = new Xinge.AndroidMessage();
                        androidMessage.type = Xinge.MESSAGE_TYPE_NOTIFICATION;
                        androidMessage.title = '恭喜,您的请假申请已经被批准.';
                        androidMessage.content = '请假的课程:' + leaveCourses[i] + '.\n时间为:' + leaveDates[i];
                        androidMessage.style = style;
                        androidMessage.action = action;

                        XingeApp.pushToSingleAccount(studentIDs[i], androidMessage, function (err) {
                            if (err) {
                                callback('抱歉,发送通知失败!');
                            } else {
                                callback(null);
                            }
                        });
                        i++;
                    }, function (err) {
                        if (err) {
                            callback(err)
                        } else {
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
        connection.release();
    });
};

leave.disagree = function (leaves, callback) {
    var leaveIDs, studentIDs, leaveCourses, leaveDates, i = 0;
    leaveIDs = leaves.leaveIDs.split(',');
    studentIDs = leaves.studentIDs.split(',');
    leaveCourses = leaves.leaveCourses.split(',');
    leaveDates = leaves.leaveDates.split(',');
    this.connect(function (err, connection) {
        if (err) {
            callback('抱歉,操作失败.');
        } else {
            async.series([
                function (callback) {
                    connection.beginTransaction(function (err) {
                        if (err) {
                            callback('抱歉,操作失败.');
                        } else {
                            async.eachSeries(leaveIDs, function (item, callback) {
                                connection.query('UPDATE `leave` SET `status` = 3 WHERE leaveID = ?', [item], function (err) {
                                    if (err) {
                                        callback('抱歉,操作失败.');
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
                },
                function (callback) {
                    async.each(leaveIDs, function (item, callback) {
                        //推送消息
                        var accessId = 2100098776;
                        var secretKey = '72d2de3691f5b2b3005023bbdb33a710';
                        var XingeApp = new Xinge.XingeApp(accessId, secretKey);

                        //Android message start.
                        var style = new Xinge.Style();
                        style.ring = 1;
                        style.vibrate = 1;
                        style.builderId = 77;

                        var action = new Xinge.ClickAction();
                        action.actionType = Xinge.ACTION_TYPE_ACTIVITY;  //打开应用

                        var androidMessage = new Xinge.AndroidMessage();
                        androidMessage.type = Xinge.MESSAGE_TYPE_NOTIFICATION;
                        androidMessage.title = '很遗憾,您的请假申请被拒绝.';
                        androidMessage.content = '请假的课程为:' + leaveCourses[i] + '.\n时间为:' + leaveDates[i];
                        androidMessage.style = style;
                        androidMessage.action = action;

                        XingeApp.pushToSingleAccount(studentIDs[i], androidMessage, function (err) {
                            if (err) {
                                callback('抱歉,发送通知失败!');
                            } else {
                                callback(null);
                            }
                        });
                        i++;
                    }, function (err) {
                        if (err) {
                            callback(err)
                        } else {
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
        connection.release();
    });
};

module.exports = leave;