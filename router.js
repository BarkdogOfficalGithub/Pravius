var config = require('./config');
var api = require('./api');
var pages = require('./page_modules/pages');

var devel = config.devel;

exports.addRoutes = function (app) {

    // Render main page
    app.get('/', function (req, res) {
        res.render('index');
    });
    
    // Render about page
    app.get('/about', function(req, res) {
        res.render('about');
    });

    // Render terms page
    app.get('/terms', function (req, res) {
        res.render('terms');
    });
    
    // Render 404 page
    app.get('/404', function (req, res) {
        res.render('404');
    });
    
    // Handle submit
    app.get('/submit', pages.shorten.get);
    app.post('/submit', pages.shorten.post);
  
    // Handle contact
    app.get('/contact', pages.contact.get);
    app.post('/contact', pages.contact.post);
    
    // Handle admin
    app.get('/admin/:pass', pages.admin.get);
    app.post('/admin/:pass', pages.admin.post);
    
    // Handle expand
    app.get('/:id', pages.expand.get);
    
    // Handle edit
    app.get('/:id/:secret', pages.edit.get);
    app.post('/:id/:secret', pages.edit.post);
    
    // Handle evenshorter
    app.get('/:id/:secret/evenshorter', pages.evenshorter.get);
    app.post('/:id/:secret/evenshorter', pages.evenshorter.post);
    
    // Handle API
    app.post('/api/:action', api.action);
};