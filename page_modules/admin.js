var config = require('../config');
var db = require('../db');

exports.get = function(req, res) {
    if (req.params.pass != config.setup.password) {
        res.redirect('/');
    }

    res.render('admin', {
        admin: req.params.pass
    });
};

exports.post = function(req, res) {
 
    var pass = req.params.pass;
    var post = req.body;

    if (pass != config.setup.password) {
        res.redirect('/');
    }
    
    if (!post.id) {
        return res.render('admin', {
            error: true,
            errorMsg: "No ID given",
            admin: pass
        });
    }
    
    db.expand(post.id, function(data) {
        if (data.status != 'OK') {
            return res.render('admin', {
                error: true,
                errorMsg: 'Invalid ID',
                admin: pass
            });
        }
        
        if (post.view) {
            return res.redirect('/' + data.id + '/' + data.secret);
        }
       
        if (post.delete) {
            return db.deleteRaw(data.id, function() {
                return res.render('admin', {
                    okay: true,
                    okayMsg: "The link was deleted",
                    admin: pass
                });
            });
        }
        
        if (post.addshort) {
            if (!post.short || post.short.length < 1) {
                return res.render('admin', {
                    error: true,
                    errorMsg: 'Invalid Short',
                    admin: pass
                });
            }
            
            return db.setRefer(data.id, post.short, function(response) {
                if (data.status != 'OK') {
                    return res.render('admin', {
                        error: true,
                        errorMsg: 'Invalid ID',
                        admin: pass
                    });
                }
                
                return res.render('admin', {
                    okay: true,
                    okayMsg: "The Short URL was added",
                    admin: pass
                });
            });
        }
        
        return res.render('admin', {
            error: true,
            errorMsg: 'Invalid action',
            admin: pass
        });
    });
};
