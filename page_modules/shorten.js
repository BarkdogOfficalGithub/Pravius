var config = require('../config');
var util = require('../util');
var db = require('../db');

exports.get = function(req, res) {
    res.redirect('/');
};

exports.post = function(req, res) {
    
    var link = req.body.link;
    
    if (!link) {
        return res.redirect('/');
    } 
    
    if (link.substring(0, 'http'.length) != 'http') {
      link = 'http://' + link;
    }
    
    if (!util.isValidUrl(link)) {
        return res.render('index', {
            error: true,
            errorMsg: 'That\'s not a valid link',
        });
    }
    
    for (var index in config.urloptions.disallowed) {
        if (~link.indexOf(config.urloptions.disallowed[index])) {
            return res.render('index', {
                error: true,
                errorMsg: 'That link isn\'t allowed!',
            });
        }
    }
    
    
    db.shorten(link, function(response){
        if (response.status != 'OK') {
            res.render('index', {
                error: true,
                errorMsg: 'Something went wrong! D:',
            });
            return;
        }

        if (response.existed) {
            return res.render('index', {
                okay: true,
                okayMsg: "The link already existed. You can access it at <strong>" + config.setup.host + "/" + response.id + "</strong>"
            });
        }
        
        res.redirect('/' + response.id + '/' + response.secret);
    });
};