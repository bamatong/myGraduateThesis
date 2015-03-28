/**
 * @Author bamatong
 * @Fun
 * @Time 15-3-27.
 */
var course = require('../dao/courseDao');

var oldCourseID = '4';
var courseInfo = {
    year: '2014-2015',
    term: '下',
    courseName: '毕业设计'
};

course.modifyCourse(oldCourseID, courseInfo, function (err) {
    if(err) {
        console.log(err);
    }
    else {
        console.log('success');
    }
});