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

//...愚蠢的写法...
course.addClass = function (teacherID, classInfo, callback) {
    var errMessage = '抱歉, 添加课程失败.',
        sqlStr = "",
        year = classInfo.year,
        whichTerm = classInfo.term,
        courseName = classInfo.courseName,
        student = classInfo.student,
        studentNum = classInfo.student.length,
        courseID, termID, i;
    this.connect(function (err, connection) {
        if (err) {
            throw err;
        } else {
            connection.beginTransaction(function (err) {
                if (err) {
                    callback(errMessage);
                } else {
                    connection.query('SELECT * FROM term WHERE year= ? AND whichTerm = ?', [year, whichTerm], function (err, result) {
                        if (err) {
                            callback(errMessage);
                        }
                        else {
                            if (result.length) {
                                termID = result[0].termID;
                                console.log('旧学期');
                                connection.query(
                                    'SELECT courseName ' +
                                    'FROM course,teacher,class ' +
                                    'WHERE course.teacherID = teacher.teacherID ' +
                                    'and course.courseID=class.courseID ' +
                                    'and termID= ?', [termID], function (err, result) {
                                        if (err) {
                                            callback(errMessage);
                                        }
                                        else {
                                            for (i = 0; i < result.length; i++) {
                                                if (courseName == result[i].courseName) {
                                                    callback('抱歉,本学期已存在该课程!');
                                                    break;
                                                }
                                            }
                                            if (i == result.length) {
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
                                                                callback(errMessage);
                                                            });
                                                        } else {
                                                            courseID = result.insertId;
                                                            console.log(termID, courseID, studentNum);
                                                            var back = "";
                                                            async.each(student, function(item, callback){
                                                                connection.query('SELECT * from student where studentID = ?', [item[0]],
                                                                    function (err, result) {
                                                                        if (err) {
                                                                            connection.rollback(function () {
                                                                                callback(errMessage);
                                                                            });
                                                                        } else {
                                                                            if (result.length) {
                                                                                //console.log('学生' + item[0] + '已存在');
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
                                                            }, function(err){
                                                                if( err ) {
                                                                    back = errMessage;
                                                                } else {
                                                                    //console.log(sqlStr);
                                                                    connection.query(sqlStr, function(err, result){
                                                                        if (err) {
                                                                            connection.rollback(function () {
                                                                                back = errMessage;
                                                                            });
                                                                        } else {
                                                                            connection.commit(function (err) {
                                                                                if (err) {
                                                                                    connection.rollback(function () {
                                                                                        back = errMessage;
                                                                                    });
                                                                                }
                                                                                console.log('success!');
                                                                                back = null;
                                                                            });
                                                                        }
                                                                    });
                                                                }
                                                            });
                                                            callback(back);
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
                                                callback(errMessage);
                                            });
                                        } else {
                                            termID = result.insertId;
                                            connection.query(
                                                'SELECT courseName ' +
                                                'FROM course,teacher,class ' +
                                                'WHERE course.teacherID = teacher.teacherID ' +
                                                'and course.courseID=class.courseID ' +
                                                'and termID= ?', [termID], function (err, result) {
                                                    if (err) {
                                                        callback(errMessage);
                                                    }
                                                    else {
                                                        for (i = 0; i < result.length; i++) {
                                                            if (courseName == result[i].courseName) {
                                                                callback('抱歉,本学期已存在该课程!');
                                                                break;
                                                            }
                                                        }
                                                        if (i == result.length) {
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
                                                                            callback(errMessage);
                                                                        });
                                                                    } else {
                                                                        courseID = result.insertId;
                                                                        console.log(termID, courseID, studentNum);
                                                                        var back;
                                                                        async.each(student, function(item, callback){
                                                                            connection.query('SELECT * from student where studentID = ?', [item[0]],
                                                                                function (err, result) {
                                                                                    if (err) {
                                                                                        connection.rollback(function () {
                                                                                            callback(errMessage);
                                                                                        });
                                                                                    } else {
                                                                                        if (result.length) {
                                                                                            //console.log('学生' + item[0] + '已存在');
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
                                                                        }, function(err){
                                                                            if( err ) {
                                                                                back = errMessage;
                                                                            } else {
                                                                                //console.log(sqlStr);
                                                                                connection.query(sqlStr, function(err, result){
                                                                                    if (err) {
                                                                                        connection.rollback(function () {
                                                                                            back = errMessage;
                                                                                        });
                                                                                    } else {
                                                                                        connection.commit(function (err) {
                                                                                            if (err) {
                                                                                                connection.rollback(function () {
                                                                                                    back = errMessage;
                                                                                                });
                                                                                            }
                                                                                            console.log('success!');
                                                                                            back = null;
                                                                                        });
                                                                                    }
                                                                                });
                                                                            }
                                                                        });
                                                                        callback(back);
                                                                    }
                                                                });
                                                        }
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

module.exports = course;

