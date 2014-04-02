var fs = require('fs');
var ejs = require('ejs');

var config = require('../config');
var db = require('../db');
var util = require('../util');
var mailer = require('../mailer'); 

var email = fs.readFileSync(__dirname + '/../views/evenshortermail.html', 'utf8');

exports.get = function(req, res) {

    var id = req.params.id[0];
    var secret = req.params.secret[0];
    
    db.expand(id, function(response) {
    
        if (response.status != 'OK') {
            return res.redirect('/404');
        }
        
        if (secret != response.secret) {
            return res.render('index', {
                error: true,
                errorMsg: "Invalid secret"
            });
        }

        res.render('evenshorter', {
            data: response
        });
    });
};

exports.post = function(req, res) {
    
    var id = req.params.id[0];
    var secret = req.params.secret[0];
    
    db.expand(id, function(dResponse) {
    
        if (dResponse.status != 'OK') {
            return res.redirect('/404');
        }
        
        if (secret != dResponse.secret) {
            return res.render('index', {
                error: true,
                errorMsg: "Invalid secret"
            });
        }
        
        var post = req.body;
        
        // Validation start
        if (!post.oldid
            || !post.oldlong
            || !post.newid
            || !post.businesslong
            || !post.email) {
            return res.render('evenshorter', {
                error: true,
                errorMsg: "Some fields are missing"
            });
        }
        
        if (post.newid.length < 1 || post.newid.length > 2) {
            return res.render('evenshorter', {
                error: true,
                errorMsg: "This type of link may only be one or two characters long"
            });
        }
        
        if (!util.isValidEmail(post.email)) {
            return res.render('evenshorter', {
                error: true,
                errorMsg: "Invalid email"
            });
        }
        
        if (util.isValidUrl(post.business)) {
            return res.render('evenshorter', {
                error: true,
                errorMsg: "Invalid business URL"
            });
        }
        // Validation end
        
        var mail = ejs.render(email, {
            host: config.setup.host,
            data: post
        });
        
        mailer.mail("Application for pravi.us hypershort url", mail, function(error, eResponse) {
            if (error) {
                util.error(error);
                return res.render('edit', {
                    error: true,
                    errorMsg: "Something went wrong, sorry! D;",
                    data: dResponse
                });
            }
            
            res.render('evenshorter', {
                okay: true,
                okayMsg: "Your application has been submitted. We'll get back to you within 3 days.",
                data: dResponse
            });
        });
        
    });
};