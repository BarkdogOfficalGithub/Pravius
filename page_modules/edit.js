var config = require('../config');
var util = require('../util');
var db = require('../db');

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
        
        res.render('edit', {
            data: response
        });
    });
    
};

exports.post = function(req, res) {

    var id = req.params.id[0];
    var secret = req.params.secret[0];
    
    var oldid = req.body.oldid;
    var newid = req.body.newid;
    
    var oldlong = req.body.oldlong;
    var newlong = req.body.newlong;
    
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
        
        if (oldid != response.id
            || oldlong != response.long) {
            return res.render('index', {
                error: true,
                errorMsg: "Invalid POST request"
            });
        }
        
        if (req.body.delete) {
            return db.deleteRaw(id, function() {
                return res.render('index', {
                    okay: true,
                    okayMsg: "The link was deleted"
                });
            });
        }
        
        if (newid == response.id && newlong == response.long) {
            return res.render('edit', {
                error: true,
                errorMsg: "Nothing was changed",
                data: response
            });
        }
        
        if (newlong != response.long) {
            if (!util.isValidUrl(newlong)) {
                return res.render('edit', {
                    error: true,
                    errorMsg: "That's an invalid link",
                    data: response
                });
            }
            
            for (var index in config.urloptions.disallowed) {
                if (~newlong.indexOf(config.urloptions.disallowed[index])) {
                    return res.render('edit', {
                        error: true,
                        errorMsg: 'That link isn\'t allowed!',
                        data: response
                    });
                }
            }
        }
        
        // The ID (and possibly the long) was changed
        if (newid != response.id) {
            
            if (newid.length > 10 || newid.length < 3) {
                return res.render('edit', {
                    error: true,
                    errorMsg: 'The link is too short/long',
                    data: response
                });
            }
            
            return db.idExists(newid, function(exists) {
                if (exists) {
                    return res.render('edit', {
                        error: true,
                        errorMsg: 'That link already exists',
                        data: response
                    });
                };
            
                var data = {
                    long: newlong,
                    clicks: response.clicks,
                    secret: response.secret,
                    created: response.created
                };
            
                // Put new data
                db.renameAndPut(response.id, newid, data, function() {
                    return res.redirect('/' + newid + '/' + response.secret);
                });
            
            });
            
        }
        
        // Only the long URL was changed at this point
        
        var data = {
            long: newlong,
            clicks: response.clicks,
            secret: response.secret,
            created: response.created
        };
        
        // Putraw will create the new callback ref
        db.putRaw(response.id, data, function() {
            return res.redirect('/' + response.id + '/' + response.secret);
        });
    });
};