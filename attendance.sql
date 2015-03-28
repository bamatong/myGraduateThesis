/**
 * create administrator
 */
CREATE USER 'admin'@'localhost' IDENTIFIED BY 'admin4attendance';

GRANT SELECT, INSERT, UPDATE, REFERENCES, DELETE, CREATE, DROP, ALTER, INDEX, TRIGGER, CREATE VIEW, SHOW VIEW, EXECUTE, ALTER ROUTINE, CREATE ROUTINE, CREATE TEMPORARY TABLES, LOCK TABLES, EVENT ON `attendance`.* TO 'admin'@'localhost';

GRANT GRANT OPTION ON `attendance`.* TO 'admin'@'localhost';

/**
 * create tables
 */
CREATE TABLE `teacher` (
`teacherID`  varchar(15) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL ,
`teacherName`  varchar(15) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL ,
`password`  char(40) NOT NULL ,
PRIMARY KEY (`teacherID`)
)ENGINE=InnoDB;

CREATE TABLE `student` (
`studentID`  varchar(15) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL ,
`studentName`  varchar(15) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL ,
`token`  char(64) ,
PRIMARY KEY (`studentID`)
)ENGINE=InnoDB;

CREATE TABLE `course` (
`courseID`  int UNSIGNED NOT NULL AUTO_INCREMENT ,
`courseName`  varchar(40) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL ,
`studentNum`  int UNSIGNED NOT NULL ,
`teacherID`  varchar(15) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL ,
PRIMARY KEY (`courseID`),
FOREIGN KEY (`teacherID`) REFERENCES `teacher` (`teacherID`) ON DELETE CASCADE ON UPDATE CASCADE
)ENGINE=InnoDB;

CREATE TABLE `term` (
`termID`  int UNSIGNED NOT NULL AUTO_INCREMENT ,
`year`  char(10) NOT NULL ,
`whichTerm`  char(1) NOT NULL ,
PRIMARY KEY (`termID`)
)ENGINE=InnoDB;

CREATE TABLE `class` (
`classID`  int UNSIGNED NOT NULL AUTO_INCREMENT ,
`termID`  int UNSIGNED NOT NULL ,
`courseID`  int UNSIGNED NOT NULL ,
`studentID`  varchar(15) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL ,
PRIMARY KEY (`classID`),
FOREIGN KEY (`termID`) REFERENCES `term` (`termID`) ON DELETE CASCADE ON UPDATE CASCADE,
FOREIGN KEY (`courseID`) REFERENCES `course` (`courseID`) ON DELETE CASCADE ON UPDATE CASCADE,
FOREIGN KEY (`studentID`) REFERENCES `student` (`studentID`) ON DELETE CASCADE ON UPDATE CASCADE
)ENGINE=InnoDB;

CREATE TABLE `callDate` (
`callDateID`  int UNSIGNED NOT NULL AUTO_INCREMENT ,
`callDate`  date NOT NULL ,
`courseID`  int UNSIGNED NOT NULL ,
PRIMARY KEY (`callDateID`),
FOREIGN KEY (`courseID`) REFERENCES `course` (`courseID`) ON DELETE CASCADE ON UPDATE CASCADE
)ENGINE=InnoDB;

CREATE TABLE `callRecord` (
`callRecordID`  int UNSIGNED NOT NULL AUTO_INCREMENT ,
`status`  int UNSIGNED NOT NULL ,
`studentID`  varchar(15) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL ,
`callDateID`  int UNSIGNED NOT NULL ,
PRIMARY KEY (`callRecordID`),
FOREIGN KEY (`studentID`) REFERENCES `student` (`studentID`) ON DELETE CASCADE ON UPDATE CASCADE,
FOREIGN KEY (`callDateID`) REFERENCES `callDate` (`callDateID`) ON DELETE CASCADE ON UPDATE CASCADE
)ENGINE=InnoDB;
