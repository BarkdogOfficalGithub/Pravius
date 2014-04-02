var config = require('./config');
var db = require('./db');

exports.getUnixTime = function() {
    return Math.round((new Date()).getTime() / 1000);
};

exports.generateRandom = function(length) {
    var random = "";
    var chars = config.url.chars;
    
    for (var i = 0; i < length; i++) {
        random += chars[Math.floor(Math.random() * chars.length)];
    }
    
    return random;
};

exports.error = function(err) {
    if (config.devel) {
        console.log(err);
    }
};

exports.isValidId = function(id) {
    return /^([a-zA-Z0-9\-]){3,16}$/g.test(id);
};

exports.isValidSecret = function(secret) {
    return /^([a-zA-Z0-9\-]){5,7}$/g.test(secret);
};

exports.isValidUrl = function(url) {
    return /^(http|https)\:\/\/[a-zA-Z0-9\-\.]+\.[a-zA-Z]{2,3}(\/\S*)?$/g.test(url);
};

exports.isValidEmail = function(email) {
    return /^([0-9a-zA-Z].*?@([0-9a-zA-Z].*\.\w{2,4}))$/g.test(email);
};
