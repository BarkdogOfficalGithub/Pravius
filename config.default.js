exports.appinfo = {
    name: "Pravius",
    version: "1.0",
    author: "Pravian Systems",
    description: "Shortify your link with a click!"
};

exports.setup = {
    port: 8080,
    host: 'http://mysite.com' // No trailing slash
};

exports.redis = {
    host: 'redis.com',
    port: 1234,
    pass: 'mypass'
};

exports.urloptions = {
    protocols: ['http','https'],
    require_tld: true,
    require_protocol: false
};
