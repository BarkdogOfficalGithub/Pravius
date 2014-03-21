var redis = require('redis');
var shorten = require('shrtn');
var validator = require('validator');

var config = require('./config');

var info = config.appinfo;

var client = redis.createClient(config.redis.port, config.redis.host, {
        auth_pass: config.redis.pass
    }
);

shorten.config.set('redis client', client);
shorten.config.set('chars', 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890');
shorten.config.set('key length', 3);

exports.submit = function(req, res) {
    
    var link = req.body.link;
    
    if (!link || !validator.isURL(link, config.urloptions)) {
        console.log(req.params.link + " Not okay!");
        res.render('index', {
            info: info,
            error: true,
            errorMsg: 'That\'s not a valid link'
        });
        return;
    }
    
    shorten.shorten(link, function(response){
        if (response.status != 'OK') {
            res.render('index', {
                info: info,
                error: true,
                errorMsg: 'Something went wrong! D:'
            });
            console.log(response);
            return;
        }

        id = response.id;
        console.log(response.long + ' -> ' + response.id);

        res.render('index', {
            info: info,
            done: true,
            link: config.setup.host + '/' + response.id
        });
      
    });
};

exports.expand = function(req, res) {
    
    var id = req.params.id;
    
    if (!id) {
        res.render('index', {
            info: info,
            error: true,
            errorMsg: 'That\'s not a valid link'
        });
        return;
    }
    
    shorten.expand(id, function(response){
    
        if (response.status != 'OK') {
            res.render('index', {
                info: info,
                error: true,
                errorMsg: 'The link you tried to access has been deleted or never existed.'
            });
            return;
        }
              
        console.log(response.id + ' -> ' + response.long);
        res.redirect(response.long);
    });

};