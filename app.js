var http = require('http');
//var https = require('https');
var spdy = require('spdy');
var path = require('path');
var express = require('express');
var ejs = require('ejs');

var config = require('./config');
var shorten = require('./shorten');
var api = require('./api');

var info = config.appinfo;
var devel = config.devel;
var app = express();

app.engine('html', ejs.__express);
app.set('views', __dirname + '/views');
app.set('view engine', 'html');
app.locals(info);
//app.enable('view cache');

app.use(express.favicon(path.join(__dirname, 'public/favicon.ico'))); 

// Logger
if (devel) {
    app.use(function(req, res, next){
        console.log('%s %s', req.method, req.url);
        next();
    });
}

// Parse POST data
app.use(express.compress());
app.use(express.urlencoded());
app.use(express.json());

// All GET requests should be over HTTPS
app.get('*', function(req, res, next) {
    if (!req.secure) {
        return res.redirect('https://' + req.get('host') + req.url);
    }
    next();
});

// Render main page
app.get('/', function(req, res) {
    res.render('index');
});

// Render privacy page
app.get('/privacy', function(req, res) {
    res.render('privacy');
});

// Handle expanding, shortening and the API
app.get('/:id', shorten.expand);
app.post('/submit', shorten.submit);
app.post('/api/:action', api.action);

// Serving statics
app.use(express.static(__dirname + '/public'));

// Error handling
app.use(function(err, req, res, next) {
    res.status(500);
    console.log(err.stack);
    res.send("500 - Internal Server Error");
});

var main = function() {
    
    var httpServer = http.createServer(app);
    
    var httpsServer;
    if (!devel) {
        var httpsServer = spdy.createServer(config.setup.https, app);
    }
    
    var httpPort = 80;
    var httpsPort = 443;
    
    if (devel) {
      httpPort = 8080;
    }
    
    httpServer.listen(httpPort, function() {
        console.log("HTTP server listening on port " + httpPort);
    });
    
    if (!devel) {
        httpsServer.listen(httpsPort, function() {
            console.log("SPDY/HTTPS server listening on port " + httpsPort);
        });
    }
};

main();