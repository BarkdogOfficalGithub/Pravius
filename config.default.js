var fs = require('fs');

exports.devel = false;

exports.appinfo = {
    title: "Pravius",
    version: "1.1",
    author: "Pravian Systems",
    shortDescription: "Shortify your link!",
    longDescription: "Pravius, shortify your link with a click!"
        + "Super short URLs are easy to remember."
};

exports.setup = {
    host: 'https://pravi.us', // No trailing slash
    https: {
        key: fs.readFileSync('certs/your.private.key'),
        cert: fs.readFileSync('certs/your.cert.crt'),
        ca: fs.readFileSync('certs/your.ca.crt')
    }
};

exports.redis = {
    host: 'nope.chuck.testa.com',
    port: 1234,
    pass: 'Ha,no'
};

exports.urloptions = {
    protocols: ['http', 'https'],
    require_tld: true,
    require_protocol: true
};
