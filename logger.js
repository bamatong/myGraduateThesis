/**
 * @Author bamatong
 * @Fun
 * @Time 15-3-14.
 */
var log4js = require('log4js');

log4js.configure({
    appenders: [
        {type: 'console'},
        {
            type: 'file',
            filename: 'logs/app.log',
            maxLogSize: 20480,
            backups: 4
        }
    ],
    replaceConsole: true
});

exports.logger = function (name) {
    var logger = log4js.getLogger(name);
    logger.setLevel('INFO');
    return logger;
};
exports.log4js = log4js;
