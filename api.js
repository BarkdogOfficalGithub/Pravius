var url = require('url');

var config = require('./config');
var util = require('./util');
var db = require('./db');

exports.action = function(req, res) {
    
    if (!req.accepts('json')) {
      res.json(new JsonError("Must accept JSON", "mustacceptjson"));
    }
    
    var id = req.params.action;
    
    if ("shortenurl" == id) {
      return shortenUrl(req, res);
    }
    
    if ("expandurl" == id) {
      return expandUrl(req, res);
    }
   
    res.json(new JsonError("Invalid action: " + id, "invalidaction"));
};

// Shortens a url
function shortenUrl(req, res) {
    
    var link = req.body.link;
    
    if (!link) {
        return res.json(new JsonError("Not a valid link", "invalidlink"));
    }
    
    if (link && link.substring(0, 'http'.length) != 'http') {
        link = 'http://' + link;
    }
    
    if (!util.isValidUrl(link)) {
        return res.json(new JsonError("Not a valid link", "invalidlink"));
    }
    
    for (var index in config.urloptions.disallowed) {
        if (~link.indexOf(config.urloptions.disallowed[index])) {
            return res.json(new JsonError("That link contains a prohibited domain", "linkprohibited"));
        }
    }
    
    db.shorten(link, function(response){
        if (response.status != 'OK') {
            res.json(new JsonError("Unknown error", "unknownerror"));
            console.log(response);
            return;
        }

        id = response.id;
        
        res.json(new JsonResponse({
            link: link,
            id: response.id,
            pravius: config.setup.host + '/' + response.id,
            secret: response.secret,
            existed: response.existed
        }));
      
    });
}

// Expands a url
function expandUrl(req, res) {

    var id = req.body.id;
    
    if (!id) {
        if (!req.body.url) {
            return res.json(new JsonError("Neither the 'id' nor the 'url' property were set.", "nodata"));
        }
    
        var path = url.parse(req.body.url).pathname;
        if (!path || !util.isValidSecret(path.substring(1))) {
            return res.json(new JsonError("Invalid URL given", "invalidurl"));
        }
        
        id = path.substring(1);
    }
    
    db.expand(id, function(response){
    
        if (response.status != 'OK') {
            return res.json(new JsonError("The link doesn't exist", "linkgone"));
        }
              
        res.json(new JsonResponse({
            pravius: config.setup.host + '/' + id,
            id: id,
            link: response.long
        }));
    });

}

// Json returns
function JsonError(message, error) {
    this.status = "error";
    this.message = message;
    if (error) {
      this.error = error;
    }
}

function JsonResponse(data) {
    this.status = "ok";
    this.data = data;
}