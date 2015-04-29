/**
 * @Author bamatong
 * @Fun
 * @Time 15-3-20.
 */
var course = {},
    pool = require('./mysqlPool'),
    async = require('async');

course.connect = function (callback) {
    pool.getConnection(function (err, connection) {
        if (err)
            callback('与MySQL数据库建立连接失败.', connection);
        else
            callback(null, connection);
    });
};

//...愚蠢的写法...懒得优化
course.addClass = function (teacherID, classInfo, callback) {
    var errMsg = '抱歉,添加课程失败,请重试.',
        year = classInfo.year,
        whichTerm = classInfo.term,
        courseName = classInfo.courseName,
        student = classInfo.student,
        studentNum = classInfo.student.length,
        courseID, termID, sqlStr = "";
    this.connect(function (err, connection) {
        if (err) {
            callback(errMsg);
        } else {
            connection.beginTransaction(function (err) {
                if (err) {
                    callback(errMsg);
                } else {
                    connection.query('SELECT * FROM term WHERE year= ? AND whichTerm = ?', [year, whichTerm], function (err, result) {
                        if (err) {
                            callback(errMsg);
                        }
                        else {
                            if (result.length) {
                                termID = result[0].termID;
                                console.log('旧学期');
                                connection.query(
                                    'SELECT * ' +
                                    'FROM course,teacher,class ' +
                                    'WHERE course.teacherID = teacher.teacherID ' +
                                    'AND course.courseID = class.courseID ' +
                                    'AND termID = ? ' +
                                    'AND courseName = ? ' +
                                    'AND teacher.teacherID = ?', [termID, courseName, teacherID], function (err, result) {
                                        if (err) {
                                            callback(errMsg);
                                        }
                                        else {
                                            if (result.length) {
                                                callback('抱歉,本学期已存在该课程!');
                                            } else {
                                                console.log('新课程');
                                                connection.query('INSERT INTO course SET ?',
                                                    {
                                                        courseID: null,
                                                        courseName: courseName,
                                                        teacherID: teacherID,
                                                        studentNum: studentNum
                                                    },
                                                    function (err, result) {
                                                        if (err) {
                                                            connection.rollback(function () {
                                                                callback(errMsg);
                                                            });
                                                        } else {
                                                            courseID = result.insertId;
                                                            //console.log(termID, courseID, studentNum);
                                                            async.eachSeries(student, function (item, callback) {
                                                                connection.query('SELECT * from student where studentID = ?', [item[0]],
                                                                    function (err, result) {
                                                                        if (err) {
                                                                            connection.rollback(function () {
                                                                                callback(errMsg);
                                                                            });
                                                                        } else {
                                                                            if (result.length) {
                                                                                //console.log('学生' + item[0] + '已存在');
                                                                                sqlStr += 'UPDATE student SET studentName = ' + connection.escape(item[1]) + ' WHERE studentID =' + connection.escape(item[0]) + ';';
                                                                                sqlStr += 'INSERT INTO class(termID, courseID, studentID) VALUES (' +
                                                                                termID + ',' + courseID + ',' + connection.escape(item[0]) + ');';
                                                                                callback();
                                                                            } else {
                                                                                //console.log('学生' + item[0] + '是新学生');
                                                                                sqlStr += 'INSERT INTO student(studentID, studentName) VALUES (' +
                                                                                connection.escape(item[0]) + ',' + connection.escape(item[1]) + ');';
                                                                                sqlStr += 'INSERT INTO class(termID, courseID, studentID) VALUES (' +
                                                                                termID + ',' + courseID + ',' + connection.escape(item[0]) + ');';
                                                                                callback();
                                                                            }
                                                                        }
                                                                    });
                                                            }, function (err) {
                                                                if (err) {
                                                                    callback(errMsg);
                                                                } else {
                                                                    console.log(sqlStr);
                                                                    connection.query(sqlStr, function (err, result) {
                                                                        if (err) {
                                                                            connection.rollback(function () {
                                                                                callback(errMsg);
                                                                            });
                                                                        } else {
                                                                            connection.commit(function (err) {
                                                                                if (err) {
                                                                                    connection.rollback(function () {
                                                                                        callback(errMsg);
                                                                                    });
                                                                                }
                                                                                //console.log('success!');
                                                                                callback();
                                                                            });
                                                                        }
                                                                    });
                                                                }
                                                            });
                                                        }
                                                    });
                                            }
                                        }
                                    });
                            }
                            else {
                                console.log('新学期');
                                connection.query('INSERT INTO term SET ?',
                                    {
                                        termID: null,
                                        year: year,
                                        whichTerm: whichTerm
                                    },
                                    function (err, result) {
                                        if (err) {
                                            connection.rollback(function () {
                                                callback(errMsg);
                                            });
                                        } else {
                                            termID = result.insertId;
                                            console.log('新课程');
                                            connection.query('INSERT INTO course SET ?',
                                                {
                                                    courseID: null,
                                                    courseName: courseName,
                                                    teacherID: teacherID,
                                                    studentNum: studentNum
                                                },
                                                function (err, result) {
                                                    if (err) {
                                                        connection.rollback(function () {
                                                            callback(errMsg);
                                                        });
                                                    } else {
                                                        courseID = result.insertId;
                                                        //console.log(termID, courseID, studentNum);
                                                        async.eachSeries(student, function (item, callback) {
                                                            connection.query('SELECT * from student where studentID = ?', [item[0]],
                                                                function (err, result) {
                                                                    if (err) {
                                                                        connection.rollback(function () {
                                                                            callback(errMsg);
                                                                        });
                                                                    } else {
                                                                        if (result.length) {
                                                                            //console.log('学生' + item[0] + '已存在');
                                                                            sqlStr += 'UPDATE student SET studentName = ' + connection.escape(item[1]) + ' WHERE studentID =' + connection.escape(item[0]) + ';';
                                                                            sqlStr += 'INSERT INTO class(termID, courseID, studentID) VALUES (' +
                                                                            termID + ',' + courseID + ',' + connection.escape(item[0]) + ');';
                                                                            callback();
                                                                        } else {
                                                                            //console.log('学生' + item[0] + '是新学生');
                                                                            sqlStr += 'INSERT INTO student(studentID, studentName) VALUES (' +
                                                                            connection.escape(item[0]) + ',' + connection.escape(item[1]) + ');';
                                                                            sqlStr += 'INSERT INTO class(termID, courseID, studentID) VALUES (' +
                                                                            termID + ',' + courseID + ',' + connection.escape(item[0]) + ');';
                                                                            callback();
                                                                        }
                                                                    }
                                                                });
                                                        }, function (err) {
                                                            if (err) {
                                                                callback(errMsg);
                                                            } else {
                                                                console.log(sqlStr);
                                                                connection.query(sqlStr, function (err, result) {
                                                                    if (err) {
                                                                        connection.rollback(function () {
                                                                            callback(errMsg);
                                                                        });
                                                                    } else {
                                                                        connection.commit(function (err) {
                                                                            if (err) {
                                                                                connection.rollback(function () {
                                                                                    callback(errMsg);
                                                                                });
                                                                            }
                                                                            //console.log('success!');
                                                                            callback();
                                                                        });
                                                                    }
                                                                });
                                                            }
                                                        });
                                                    }
                                                });
                                        }
                                    });
                            }
                        }
                    });

                }
            });
        }
        connection.release();
    });
};

course.showCourse = function (teacherID, callback) {
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

course.showStudent = function (courseID, callback) {
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

course.delCourse = function (courseID, callback) {
    this.connect(function (err, connection) {
        if (err) {
            callback(err);
        } else {
            connection.query('DELETE FROM course WHERE courseID = ?', [courseID], function (err, result) {
                if (err) {
                    callback(err);
                } else {
                    callback();
                }
            });
        }
        connection.release();
    });
};

course.modifyCourse = function (oldCourseID, courseInfo, callback) {
    var errMsg = '抱歉,修改课程失败,请重试.',
        year = courseInfo.year,
        whichTerm = courseInfo.term,
        courseName = courseInfo.courseName,
        termID;
    this.connect(function (err, connection) {
        if (err) {
            callback(err, null);
        } else {
            connection.beginTransaction(function (err) {
                if (err) {
                    callback(errMsg, null);
                } else {
                    async.series([
                        function (callback) {
                            connection.query('SELECT * FROM term WHERE year= ? AND whichTerm = ?', [year, whichTerm], function (err, result) {
                                if (err) {
                                    callback(errMsg);
                                }
                                else {
                                    if (result.length) {
                                        termID = result[0].termID;
                                        //console.log('旧学期');
                                        callback();
                                    } else {
                                        //console.log('新学期');
                                        connection.query('INSERT INTO term SET ?',
                                            {
                                                termID: null,
                                                year: year,
                                                whichTerm: whichTerm
                                            },
                                            function (err, result) {
                                                if (err) {
                                                    connection.rollback(function () {
                                                        callback(errMsg);
                                                    });
                                                } else {
                                                    termID = result.insertId;
                                                    console.log(termID);
                                                    callback();
                                                }
                                            });
                                    }
                                }
                            });
                        },
                        function (callback) {
                            connection.query(
                                'SELECT * ' +
                                'FROM course,teacher,class ' +
                                'WHERE course.teacherID = teacher.teacherID ' +
                                'AND course.courseID = class.courseID ' +
                                'AND termID = ? ' +
                                'AND courseName = ?', [termID, courseName], function (err, result) {
                                    if (err) {
                                        callback(errMsg);
                                    } else {
                                        if (!result.length) {
                                            //console.log('新课程');
                                            callback();
                                        } else {
                                            //console.log('旧课程');
                                            callback('该学期已存在同名的课程.');
                                        }
                                    }
                                });
                        },
                        function (callback) {
                            connection.query('UPDATE course SET courseName = ? WHERE courseID = ?', [courseName, oldCourseID], function (err, result) {
                                if (err) {
                                    connection.rollback(function () {
                                        callback(errMsg);
                                    });
                                } else {
                                    callback();
                                }
                            });
                        },
                        function (callback) {
                            connection.query('UPDATE class SET termID = ? WHERE courseID = ?', [termID, oldCourseID], function (err, result) {
                                if (err) {
                                    connection.rollback(function () {
                                        callback(errMsg);
                                    });
                                } else {
                                    callback();
                                }
                            });
                        }
                    ], function (err) {
                        if (err) {
                            callback(err, null);
                        } else {
                            connection.commit(function (err) {
                                if (err) {
                                    connection.rollback(function () {
                                        callback(errMsg, null);
                                    });
                                }
                                console.log('success!');
                                callback(null, termID);
                            });
                        }
                    });
                }
            });
        }
        connection.release();
    });
};

course.delStudent = function (courseID, studentID, callback) {
    this.connect(function (err, connection) {
        if (err) {
            callback(err);
        } else {
            connection.beginTransaction(function (err) {
                if (err) {
                    callback(err);
                } else {
                    async.series([
                        function (callback) {
                            connection.query('UPDATE course SET studentNum = studentNum-1 WHERE courseID = ?', [courseID], function (err, result) {
                                if (err) {
                                    connection.rollback(function () {
                                        callback(err);
                                    });
                                } else {
                                    callback();
                                }
                            });
                        },
                        function (callback) {
                            connection.query('DELETE FROM class WHERE courseID = ? AND studentID = ?', [courseID, studentID], function (err, result) {
                                if (err) {
                                    connection.rollback(function () {
                                        callback(err);
                                    });
                                } else {
                                    callback();
                                }
                            });
                        },
                        function (callback) {
                            connection.query(
                                'DELETE ' +
                                'FROM ' +
                                'callRecord ' +
                                'WHERE ' +
                                'callDateID IN ( ' +
                                'SELECT ' +
                                'callDateID ' +
                                'FROM ' +
                                'callDate ' +
                                'WHERE courseID = ?' +
                                ') ' +
                                'AND studentID = ?', [courseID, studentID], function (err, result) {
                                    if (err) {
                                        connection.rollback(function () {
                                            callback(err);
                                        });
                                    } else {
                                        callback();
                                    }
                                });
                        }
                    ], function (err) {
                        if (err) {
                            callback(err);
                        } else {
                            connection.commit(function (err) {
                                if (err) {
                                    connection.rollback(function () {
                                        callback(err);
                                    });
                                }
                                console.log('success!');
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

course.addStudent = function (termID, courseID, studentID, studentName, callback) {
    var errMsg = '抱歉,添加学生失败,请重试.';
    this.connect(function (err, connection) {
        if (err) {
            callback(errMsg);
        } else {
            connection.beginTransaction(function (err) {
                if (err) {
                    callback(errMsg);
                } else {
                    async.series([
                        function (callback) {
                            connection.query('SELECT studentName from student where studentID = ?', [studentID],
                                function (err, result) {
                                    if (err) {
                                        connection.rollback(function () {
                                            callback(errMsg);
                                        });
                                    } else {
                                        if (result.length) {
                                            console.log('旧学生');
                                            if (result[0].studentName != studentName) callback('学号为' + studentID + '的姓名不是' + studentName);
                                            else
                                                connection.query(
                                                    'SELECT * FROM class ' +
                                                    'WHERE termID = ? AND courseID = ? AND studentID = ?',
                                                    [termID, courseID, studentID],
                                                    function (err, result) {
                                                        if (err) {
                                                            connection.rollback(function () {
                                                                callback(errMsg);
                                                            });
                                                        } else {
                                                            if (result.length) {
                                                                callback('学号为' + studentID + '的学生已在学生名单中');
                                                            } else
                                                                callback();
                                                        }
                                                    });
                                        } else {
                                            console.log('新学生');
                                            connection.query(
                                                'INSERT INTO student SET ?',
                                                {studentID: studentID, studentName: studentName},
                                                function (err, result) {
                                                    if (err) {
                                                        connection.rollback(function () {
                                                            callback(errMsg);
                                                        });
                                                    } else {
                                                        callback();
                                                    }
                                                });
                                        }
                                    }
                                });
                        },
                        function (callback) {
                            connection.query('UPDATE course SET studentNum = studentNum+1 WHERE courseID = ?', [courseID], function (err, result) {
                                if (err) {
                                    connection.rollback(function () {
                                        callback(errMsg);
                                    });
                                } else {
                                    callback();
                                }
                            });
                        },
                        function (callback) {
                            connection.query(
                                'INSERT INTO class SET ?',
                                {termID: termID, courseID: courseID, studentID: studentID},
                                function (err, result) {
                                    if (err) {
                                        connection.rollback(function () {
                                            callback(errMsg);
                                        });
                                    } else {
                                        callback();
                                    }
                                });
                        }
                    ], function (err) {
                        if (err) {
                            callback(err);
                        } else {
                            connection.commit(function (err) {
                                if (err) {
                                    connection.rollback(function () {
                                        callback(errMsg);
                                    });
                                }
                                //console.log('success!');
                                callback();
                            });
                        }

                    });
                }
            });
        }
    });
};

module.exports = course;

