var http = require('http');
var express = require('express');
var ejs = require('ejs');

var config = require('./config');
var shorten = require('./shorten');

var info = config.appinfo;
var app = express();

app.engine('html', ejs.__express);
app.set('views', __dirname + '/views');
app.set('view engine', 'html');

// Parse POST data
app.use(express.urlencoded());
app.use(express.json());

// Logger
app.use(function(req, res, next){
    console.log('%s %s', req.method, req.url);
    next();
});

app.get('/', function(req, res) {
    res.render('index', {
        info: info
    });
});

app.post('/submit', shorten.submit);
app.get('/:id', shorten.expand);

// Serving
app.use(express.static(__dirname + '/public'));

// Error handling
app.use(function(err, req, res, next) {
    res.status(500);
    console.log(err.stack);
    res.send("500 - Internal Server Error");
});

var main = function() {

    var server = http.createServer(app);

    server.listen(config.setup.port, function() {
        console.log("Server listening on port " + config.setup.port);
    });
  

};

main();