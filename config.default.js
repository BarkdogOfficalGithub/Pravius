var fs = require('fs');

exports.devel = true;

exports.appinfo = {
    title: "Pravius",
    version: "2.0",
    author: "Pravian Systems",
    shortDescription: "Shortify your link!",
    longDescription: "Pravius, shortify your link with a click! "
        + "Super short URLs are easy to remember."
};

exports.setup = {
    host: 'https://pravi.us', // No trailing slash
    https: {
        key: fs.readFileSync('certs/yourprivate.key'),
        cert: fs.readFileSync('certs/yourcert.crt'),
        ca: fs.readFileSync('certs/cacert.crt')
    },
    password: "mypass" // Admin password
};

exports.mail = {
    service: "Gmail",
    user: "gmail@login",
    pass: "GmailPass",
    to: "your@addressant"
};

exports.url = {
    chars: "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890",
    length: 3
};

exports.redis = {
    host: 'redishost.com',
    port: 1234,
    pass: 'redispass',
    expire: false,
    expiretime: 4 * 31 * 24 * 60 * 60 // 4 months (assuming 31 days per month)
};

exports.urloptions = {
    disallowed: [
        'pravi.us',
        'bit.ly',
        'sauc.in',
        'goo.gl',
        'tiny.cc',
        'ow.ly'
    ]
};
