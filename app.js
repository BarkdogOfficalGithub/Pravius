var http = require('http');
var spdy = require('spdy');
var path = require('path');
var express = require('express');
var ejs = require('ejs');
var minify = require('express-minify');
var params = require('express-params');

var config = require('./config');
var router = require('./router');
var db = require('./db');

var devel = config.devel;

var app = express();

//
// ----- SETUP -----
//
app.engine('html', ejs.__express);
app.set('views', __dirname + '/views');
app.set('view engine', 'html');

app.locals(config.appinfo);
app.locals({
    host: config.setup.host,
    getLength: db.getLength
});

// Setup params
params.extend(app);
app.param('id', /^([a-zA-Z0-9\-]){1,15}$/);
app.param('secret', /^([a-zA-Z0-9\-]){5,7}$/);


//
// ----- MIDDLEWARE -----
//
if (!devel) {
    app.use(function(req, res, next) {
        if (req.protocol == "https") {
            return next();
        }
        
        res.redirect('https://' + req.get('host') + req.url);
    });
}


// First, compress data and send favicon
app.use(express.compress());
app.use(express.favicon(path.join(__dirname, 'public/favicon.ico'))); 

// Then parse POST data
app.use(express.urlencoded());
app.use(express.json());

// Routes (eg. .get, .post, .get, etc) before other middleware
app.use(app.router);

// Serving statics if no route matched.
app.use(minify());
app.use(express.static(__dirname + '/public'));

// Handle 404, nothing else worked
app.use(function(req, res) {
    res.status(404);
    res.render('404');
});

// Handle 500, expressjs middleware
app.use(function(error, req, res, next) {
    res.status(500);
    res.render('index', {
        error: true,
        errorMsg: "Something went wrong! D:"
    });
    console.log(error.stack);
});


var main = function() {
    // Attach routes
    router.addRoutes(app);
    
    var httpServer = http.createServer(app);
    var httpsServer;
    if (!devel) {
        httpsServer = spdy.createServer(config.setup.https, app);
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