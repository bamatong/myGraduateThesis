/**
 * @Author bamatong
 * @Fun
 * @Time 15-4-3.
 */
var notice = {},
    pool = require('./mysqlPool'),
    Xinge = require('Xg-Push-SDK'),
    async = require('async');
moment = require('moment');

notice.connect = function (callback) {
    pool.getConnection(function (err, connection) {
        if (err)
            callback('与MySQL数据库建立连接失败.', connection);
        else
            callback(null, connection);
    });
};

notice.showCourse = function (teacherID, callback) {
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
                        courses.push(obj);
                    });
                    callback(null, courses);
                }
            });
        }
        connection.release();
    });
};

notice.showStudent = function (termID, courseID, callback) {
    var sqlStr = "SELECT " +
        "student.studentID, student.studentName " +
        "FROM " +
        "class " +
        "INNER JOIN student ON class.studentID = student.studentID " +
        "AND class.termID = ? " +
        "AND class.courseID= ?";
    var students = [];
    this.connect(function (err, connection) {
        if (err) {
            callback(err, null);
        } else {
            connection.query({sql: sqlStr, nestTables: '_'}, [termID, courseID], function (err, result) {
                if (err) {
                    callback(err, null);
                } else {
                    result.forEach(function (item) {
                        var student = [];
                        student.push(item.student_studentID);
                        student.push(item.student_studentName);
                        students.push(student);
                    });
                    callback(null, students);
                }
            });
        }
        connection.release();
    });
};

notice.pushNotice = function (noticeInfo, callback) {
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
    androidMessage.title = noticeInfo.title;
    androidMessage.content = noticeInfo.content;
    androidMessage.style = style;
    androidMessage.action = action;
    var dateString;
    if (noticeInfo.date == 'null' && noticeInfo.time == 'null') {
        //立即发送 do nothing
    } else {
        //定时发送
        dateString = noticeInfo.date + ' ' + noticeInfo.time;
        androidMessage.sendTime = Date.parse(dateString) / 1000;
    }
    //Android message start.
    var students = noticeInfo.students.split(',');
    async.each(students, function (item, callback) {
        XingeApp.pushToSingleAccount(item, androidMessage, function (err) {
            if (err)
                callback('抱歉,推送失败.');
            else
                callback();
        });
    }, function (err) {
        if (err) {
            callback(err)
        } else {
            callback();
        }
    });
};

module.exports = notice;