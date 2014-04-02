var fs = require('fs');
var ejs = require('ejs');

var config = require('../config');
var util = require('../util');
var mailer = require('../mailer');

var email = fs.readFileSync(__dirname + '/../views/contactemail.html', 'utf8');

exports.get = function(req, res) {
    res.render('contact');
};

exports.post = function(req, res) {

    var post = req.body;
    
    if (!post.message
        || !post.name
        || !post.email
        || post.message.length < 20
        || post.name.length < 6
        || post.name.split(" ").length < 1
        || !util.isValidEmail(post.email)) {
        return res.render('contact', {
            error: true,
            errorMsg: "Incomplete/invalid POST request"
        });
    }
    
    var mail = ejs.render(email, {
        host: config.setup.host,
        data: post
    });
    
    mailer.mail("Reaching you on " + config.setup.host, mail, function(error, eResponse) {
            if (error) {
                util.error(error);
                return res.render('contact', {
                    error: true,
                    errorMsg: "Something went wrong, sorry! D;",
                });
            }
            
            res.render('index', {
                okay: true,
                okayMsg: "Your message has been submitted. We'll get back to you within 3 days.",
            });
        });
};