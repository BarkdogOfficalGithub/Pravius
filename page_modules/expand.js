var db = require('../db');

exports.get = function(req, res) {
    
    var id = req.params.id[0];
    
    if (!id) {
        res.render('index', {
            error: true,
            errorMsg: 'That\'s not a valid link',
        });
        return;
    }
    
    db.expand(id, function(response) {
    
        if (response.status != 'OK') {
            return res.render('index', {
                error: true,
                errorMsg: 'The link you tried to access has been deleted or never existed.',
            });
        }
        
        res.redirect(response.long);
        
        // Increment the counter
        db.increment(id);
    });
};