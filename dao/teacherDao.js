/**
 * @Author bamatong
 * @Fun
 * @Time 15-3-15.
 */
var teacher = {},
    pool = require('./mysqlPool'),
    async = require('async'),
    Xinge = require('Xg-Push-SDK');

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

teacher.showCourse = function (teacherID, callback) {
    var sqlStr = "SELECT DISTINCT " +
        "A.termID, B.courseID, year, whichTerm, courseName, studentNum " +
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
    this.connect(function (err, connection) {
        if (err) {
            callback(err, null);
        } else {
            connection.query({sql: sqlStr, nestTables: '_'}, [teacherID], function (err, result) {
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

teacher.showStudent = function (courseID, callback) {
    var sqlStr = "SELECT " +
        "student.studentID, student.studentName, student.IMEI " +
        "FROM " +
        "class " +
        "INNER JOIN student ON class.studentID = student.studentID " +
        "AND class.courseID= ?";
    this.connect(function (err, connection) {
        if (err) {
            callback(err, null);
        } else {
            connection.query({sql: sqlStr, nestTables: '_'}, [courseID], function (err, result) {
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

teacher.showCallRec = function (courseID, callback) {
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

teacher.getDetail = function (callDateID, callback) {
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

teacher.getCallRec = function (courseID, callback) {
    var callDateIDs = [];
    async.series([
        function (callback) {
            teacher.showCallRec(courseID, function (err, result) {
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
                teacher.getDetail(item, function (err, result) {
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
                    callback(null, callRecDetails)
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

teacher.modifyCallRec = function (callDateID, studentID, status, callback) {
    var num, attend, attendanceRate;
    this.connect(function (err, connection) {
        if (err) {
            callback('抱歉,操作失败.');
        } else {
            connection.beginTransaction(function (err) {
                if (err) {
                    callback('抱歉,操作失败.');
                } else {
                    async.series([
                        function (callback) {
                            connection.query("UPDATE callRecord SET `status` = ? WHERE studentID = ? AND callDateID = ?", [status, studentID, callDateID], function (err) {
                                if (err) {
                                    callback('抱歉,操作失败.');
                                } else {
                                    callback(null);
                                }
                            });
                        },
                        function (callback) {
                            connection.query("SELECT attendanceRate FROM callDate WHERE callDateID = ?", [callDateID], function (err, result) {
                                if (err) {
                                    callback('抱歉,操作失败.');
                                } else {
                                    attendanceRate = result[0].attendanceRate;
                                    callback(null);
                                }
                            });
                        },
                        function (callback) {
                            connection.query("SELECT COUNT(*) num FROM callRecord WHERE callDateID = ?", [callDateID], function (err, result) {
                                if (err) {
                                    callback('抱歉,操作失败.');
                                } else {
                                    num = result[0].num;
                                    switch (status) {
                                        case '1':
                                            attend = Math.round(attendanceRate / 100 * num) + 1;
                                            attendanceRate = (attend / num * 100).toFixed(2);
                                            break;
                                        case '2':
                                        case '3':
                                            attend = Math.round(attendanceRate / 100 * num) - 1;
                                            attendanceRate = (attend / num * 100).toFixed(2);
                                            break;
                                        default :
                                            console.log('error');
                                            break;
                                    }
                                    callback(null);
                                }
                            });
                        },
                        function (callback) {
                            connection.query("UPDATE callDate SET attendanceRate = ? WHERE callDateID = ?", [attendanceRate, callDateID], function (err, result) {
                                if (err) {
                                    callback('抱歉,操作失败.');
                                } else {
                                    callback(null);
                                }
                            });
                        }
                    ], function (err) {
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
        connection.release();
    });
};

teacher.getLeaveNum = function (teacherID, callback) {
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

teacher.modifyPwd = function (teacherID, oldPassword, newPassword, callback) {
    this.connect(function (err, connection) {
        if (err) {
            callback('抱歉,操作失败.');
        } else {
            async.series([
                function (callback) {
                    connection.query('SELECT password FROM teacher WHERE teacherID = ?', [teacherID], function (err, result) {
                        if (err) {
                            callback('抱歉,操作失败.');
                        } else {
                            if (result[0].password != oldPassword)
                                callback('输入的旧密码有误.');
                            else
                                callback(null);
                        }
                    });
                },
                function (callback) {
                    connection.query('UPDATE teacher SET password = ? WHERE teacherID = ?', [newPassword, teacherID], function (err) {
                        if (err) {
                            callback('抱歉,操作失败.');
                        } else {
                            callback(null);
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

teacher.agreeLeave = function (leaveID, courseName, leaveDate, studentID, callback) {
    this.connect(function (err, connection) {
        if (err) {
            callback('抱歉,操作失败.');
        } else {
            async.series([
                function (callback) {
                    connection.query('UPDATE `leave` SET `status` = 2 WHERE leaveID = ?', [leaveID], function (err) {
                        if (err) {
                            callback('抱歉,操作失败.');
                        } else {
                            callback(null);
                        }
                    });
                },
                function (callback) {
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
                    androidMessage.content = '课程:' + courseName + '. 时间:' + leaveDate;
                    androidMessage.style = style;
                    androidMessage.action = action;

                    XingeApp.pushToSingleAccount(studentID, androidMessage, function (err) {
                        if (err) {
                            callback('抱歉,发送通知失败!');
                        } else {
                            callback(null);
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

teacher.disagreeLeave = function (leaveID, courseName, leaveDate, studentID, callback) {
    this.connect(function (err, connection) {
        if (err) {
            callback('抱歉,操作失败.');
        } else {
            async.series([
                function (callback) {
                    connection.query('UPDATE `leave` SET `status` = 3 WHERE leaveID = ?', [leaveID], function (err) {
                        if (err) {
                            callback('抱歉,操作失败.');
                        } else {
                            callback(null);
                        }
                    });
                },
                function (callback) {
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
                    androidMessage.content = '课程:' + courseName + '. 时间:' + leaveDate;
                    androidMessage.style = style;
                    androidMessage.action = action;

                    XingeApp.pushToSingleAccount(studentID, androidMessage, function (err) {
                        if (err) {
                            callback('抱歉,发送通知失败!');
                        } else {
                            callback(null);
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

teacher.getStudentInfo = function (teacherID, studentID, callback) {
    var sqlStr = "SELECT DISTINCT " +
        "student.studentID,student.studentName " +
        "FROM " +
        "course " +
        "INNER JOIN ( " +
        "class " +
        "INNER JOIN student ON student.studentID = class.studentID " +
        ") ON course.courseID = class.courseID " +
        "WHERE " +
        "teacherID = ? " +
        "AND student.studentID = ?";
    this.connect(function (err, connection) {
        if (err) {
            callback('error');
        } else {
            connection.query(sqlStr, [teacherID, studentID], function (err, result) {
                if (err) {
                    callback('error');
                } else {
                    if (result.length == 0)
                        callback('nothing');
                    else
                        callback(null, result);
                }
            });
        }
        connection.release();
    });
};

teacher.getStudentsInfo = function (teacherID, students, callback) {
    var sqlStr = "SELECT DISTINCT " +
        "student.studentID,student.studentName " +
        "FROM " +
        "course " +
        "INNER JOIN ( " +
        "class " +
        "INNER JOIN student ON student.studentID = class.studentID " +
        ") ON course.courseID = class.courseID " +
        "WHERE " +
        "teacherID = ? " +
        "AND student.studentID = ?";
    this.connect(function (err, connection) {
        if (err) {
            callback('error');
        } else {
            var studentsInfo = [], tmp = {};
            async.eachSeries(students, function (item, callback) {
                connection.query(sqlStr, [teacherID, item], function (err, result) {
                    if (err) {
                        callback('error');
                    } else {
                        if (result.length == 0) {
                            tmp = {};
                            tmp.studentID = item;
                            tmp.studentName = "空";
                            tmp.status = 0;
                            studentsInfo.push(tmp);
                        } else {
                            result[0].status = 1;
                            studentsInfo.push(result[0]);
                        }
                        callback(null);
                    }
                });
            }, function (err) {
                if (err) {
                    callback(err);
                } else {
                    callback(null, studentsInfo);
                }
            });
        }
        connection.release();
    });
};

teacher.unbindSingle = function (studentID, callback) {
    this.connect(function (err, connection) {
        if (err) {
            callback(err);
        } else {
            connection.query('UPDATE student SET IMEI = null WHERE studentID = ?', [studentID], function (err) {
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

teacher.unbindBatch = function (students, callback) {
    var stuArray = students.split(',');
    this.connect(function (err, connection) {
        if (err) {
            callback(err);
        } else {
            async.eachSeries(stuArray, function (item, callback) {
                connection.query('UPDATE student SET IMEI = null WHERE studentID = ?', [item], function (err) {
                    if (err) {
                        callback(err);
                    } else {
                        callback(null);
                    }
                });
            }, function (err) {
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

teacher.call = function (courseID, nfcStudents, QRCodeStudents, callback) {
    var errStr = "抱歉,操作失败.";
    var callDateID, attendNum = 0, attendanceRate;
    var allStudent = [];
    console.log('teacher.call:' + courseID, nfcStudents, QRCodeStudents);
    this.connect(function (err, connection) {
        if (err) {
            callback(err);
        } else {
            connection.beginTransaction(function (err) {
                if (err) {
                    callback(errStr);
                } else {
                    async.series([
                        function (callback) {
                            connection.query('INSERT INTO callDate SET ?', {
                                callDateID: null,
                                callDate: moment(new Date()).format('YYYY-MM-DD'),
                                courseID: courseID
                            }, function (err, result) {
                                if (err) {
                                    callback(errStr);
                                } else {
                                    callDateID = result.insertId;
                                    callback(null);
                                }
                            });
                        },
                        function (callback) {
                            //处理二维码签到的学生
                            if (QRCodeStudents.length == 0) {
                                callback();
                            } else {
                                async.eachSeries(QRCodeStudents, function (student, callback) {
                                    connection.query('INSERT INTO callRecord SET ?', {
                                        callRecordID: null,
                                        status: 1,
                                        studentID: student,
                                        callDateID: callDateID
                                    }, function (err) {
                                        if (err) {
                                            callback(errStr);
                                        } else {
                                            attendNum++;
                                            callback(null);
                                        }
                                    });
                                }, function (err) {
                                    if (err) {
                                        callback(err);
                                    } else {
                                        callback(null);
                                    }
                                });
                            }
                        },
                        function (callback) {
                            //处理nfc学生
                            if (QRCodeStudents.length == 0) {
                                callback();
                            } else {
                                async.eachSeries(nfcStudents, function (student, callback) {
                                    //检查该学生是否已经扫描二维码
                                    connection.query('SELECT * FROM callRecord WHERE studentID = ? AND callDateID = ?', [student, callDateID], function (err, result) {
                                        if (err) {
                                            callback(errStr);
                                        } else {
                                            if (result.length == 0)
                                            //没有扫描
                                                connection.query('INSERT INTO callRecord SET ?', {
                                                    callRecordID: null,
                                                    status: 1,
                                                    studentID: student,
                                                    callDateID: callDateID
                                                }, function (err) {
                                                    if (err) {
                                                        callback(errStr);
                                                    } else {
                                                        attendNum++;
                                                        callback(null);
                                                    }
                                                });
                                            else
                                            //有扫描,直接处理下一个学生
                                                callback(null);
                                        }
                                    });
                                }, function (err) {
                                    if (err) {
                                        callback(err);
                                    } else {
                                        callback(null);
                                    }
                                });
                            }
                        },
                        //获取所有学生
                        function (callback) {
                            teacher.showStudent(courseID, function (err, result) {
                                if (err) {
                                    callback(errStr)
                                } else {
                                    result.forEach(function (item) {
                                        allStudent.push(item.student_studentID);
                                    });
                                    callback(null);
                                }
                            });
                        },
                        //处理剩余学生
                        function (callback) {
                            async.eachSeries(allStudent, function (student, callback) {
                                connection.query('SELECT * FROM callRecord WHERE studentID = ? AND callDateID = ?', [student, callDateID], function (err, result) {
                                    if (err) {
                                        callback(errStr);
                                    } else {
                                        if (result.length == 0)
                                        //该学生没有参加签到,检查有否请求请假
                                            connection.query('SELECT `status` FROM `leave` WHERE studentID = ? AND courseID = ? AND leaveDate = ?',
                                                [student, courseID, moment(new Date()).format('YYYY-MM-DD')],
                                                function (err, result) {
                                                    if (err) {
                                                        callback(errStr);
                                                    } else {
                                                        if (result.length != 0)
                                                        //有请假
                                                            switch (result[0].status) {
                                                                case 0:
                                                                case 3:
                                                                    connection.query('INSERT INTO callRecord SET ?', {
                                                                        callRecordID: null,
                                                                        status: 2,
                                                                        studentID: student,
                                                                        callDateID: callDateID
                                                                    }, function (err) {
                                                                        if (err) {
                                                                            callback(errStr);
                                                                        } else {
                                                                            callback(null);
                                                                        }
                                                                    });
                                                                    break;
                                                                case 2:
                                                                    connection.query('INSERT INTO callRecord SET ?', {
                                                                        callRecordID: null,
                                                                        status: 3,
                                                                        studentID: student,
                                                                        callDateID: callDateID
                                                                    }, function (err) {
                                                                        if (err) {
                                                                            callback(errStr);
                                                                        } else {
                                                                            callback(null);
                                                                        }
                                                                    });
                                                                    break;
                                                                default :
                                                                    console.log('switch err');
                                                                    break;
                                                            }
                                                        else {
                                                            //没请假
                                                            connection.query('INSERT INTO callRecord SET ?', {
                                                                callRecordID: null,
                                                                status: 2,
                                                                studentID: student,
                                                                callDateID: callDateID
                                                            }, function (err) {
                                                                if (err) {
                                                                    callback(errStr);
                                                                } else {
                                                                    callback(null);
                                                                }
                                                            });
                                                        }
                                                    }
                                                });
                                        else
                                            callback(null);
                                    }
                                });
                            }, function (err) {
                                if (err) {
                                    callback(err);
                                } else {
                                    callback(null);
                                }
                            });
                        },
                        //更新出勤率
                        function (callback) {
                            attendanceRate = (attendNum / (allStudent.length) * 100).toFixed(2);
                            connection.query('UPDATE callDate SET attendanceRate = ? WHERE callDateID = ?', [attendanceRate, callDateID], function (err) {
                                if (err) {
                                    callback(errStr);
                                } else {
                                    callback(null);
                                }
                            });
                        }
                    ], function (err) {
                        if (err) {
                            connection.rollback(function () {
                                callback(err);
                            });
                        } else {
                            connection.commit(function (err) {
                                if (err) {
                                    connection.rollback(function () {
                                        callback(errStr);
                                    });
                                }
                                callback();
                            });
                        }
                    });
                }
            });
        }
        connection.release();
    });
};

module.exports = teacher;