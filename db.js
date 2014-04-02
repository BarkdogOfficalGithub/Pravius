var redis = require('redis');

var config = require('./config');
var util = require('./util');

function Config() {
    var config = {
        prefix: ''
    };

    this.set = function (key, value) {
        config[key] = value;
        return;
    }

    this.get = function (key, fallback) {
        if (key in config) {
            return config[key];
        }
        
        return fallback ? fallback : null;
    }
}

// Storage diagram:
//
// link_aaa -> {
//   long: "http://google.com",
//   clicks: 5,
//   secret: "AaAaA",
//   created: 1396013474 // UTC,
//   (short: "aa") // Optional
// }
//
// url_http://google.com ->
//   "aaa" // ID, so you can call link_[ID] to retrieve the data
//
// link_aa -> { // Extra short URL
//   refer: "aaa"
// }

var dbconfig = new Config();

// Amount of generated links; should be populated with setup();
var length = -1;

// Amount of redirected users; should be populated with setup();
var redirects = -1;

// Helper methods for prefixes
function getName(id) {
    return "link_" + id;
}

function getUrl(url) {
    return "url_" + url;
}

function generateId(callback) {
    var id = "";
    var chars = dbconfig.get('chars');
    var keyLength = new Number(dbconfig.get('length'));

    // Generator method, called later
    this.generate = function(callback) {
        var id = "";
        
        for (var i = 0; i < keyLength; i++) {
            id += chars[Math.floor(Math.random() * chars.length)];
        }
        
        dbconfig.get('redis').exists(getName(id), function(error, exists) {
            if (exists) {
                return generate(callback);
            }
            
            callback(id);
        });
    };
    
    // check for the number of existing keys
    dbconfig.get('redis').keys(dbconfig.get('prefix') + "*", function (error, response) {
        
        // While more than 90% of all keys possible combinations have been used up, increment the prefix length.
        while (response.length > Math.pow(chars.length, keyLength) * 0.9) {
            keyLength++;
            dbconfig.set('length', keyLength);
        } 

        generate(callback);
    });
}

function shorten(long, callback) {
    
    dbconfig.get('redis').exists(getUrl(long), function(error, exists) {
    
        // URL already exists
        if (exists) {
            return dbconfig.get('redis').get(getUrl(long), function (err, response) {
                
                if (err) {
                    return callback({
                        'status': 'ERROR',
                        'message': 'Couldn\'t retrieve existing URL'
                    });
                }
                
                return dbconfig.get('redis').hgetall(getName(response), function (err, data) {
                    if (data) {
                        if (data.short) {
                            return callback({
                                'status': 'OK',
                                'id': response,
                                'existed': true, // If the link already existed
                                
                                // Data
                                'long': data.long,
                                'clicks': data.clicks,
                                'secret': data.secret,
                                'created': data.created,
                                'short': data.short,
                            });
                        }
                        
                        return callback({
                            'status': 'OK',
                            'id': response,
                            'existed': true, // If the link already existed
                            
                            // Data
                            'long': data.long,
                            'clicks': data.clicks,
                            'secret': data.secret,
                            'created': data.created,
                        });
                    }
                    
                    return callback({
                        'status': 'ERROR',
                        'message': 'Couldn\'t retrieve existing URL data'
                    });
                });
            });
        }
        
        // URL does not exist
        generateId(function (id) {
            var name = getName(id);
            
            var data = {
                // Data
                'long': long,
                'clicks': 0,
                'secret': util.generateRandom(5),
                'created': util.getUnixTime()
            };
        
            dbconfig.get('redis').hmset(name, data, function (err, response) {
                if (!response) {
                    throw new Error("No response received: " + err);
                }
                
                length++;
                
                var urlName = getUrl(long);
                dbconfig.get('redis').set(urlName, id);
                
                if (dbconfig.get('expire')) {
                    dbconfig.get('redis').expire(name, dbconfig.get('expiretime'));
                    dbconfig.get('redis').expire(urlName, dbconfig.get('expiretime'));
                }
            
                var response = {
                    'status': 'OK',
                    'id': id,
                    'existed': false, // If the link already existed
                    
                    // Data
                    'long': data.long,
                    'clicks': data.clicks,
                    'secret': data.secret,
                    'created': data.created
                }

                return callback(response);

            });
        });
    });
}

function expand(id, callback) {
    var name = getName(id);

    dbconfig.get('redis').hgetall(name, function (err, data) {
        
        if (!data) {
            util.error(err);
            return callback({
                'status': 'ERROR',
                'message': 'Key not found'
            }); 
        }
        
        if (!data.refer) {
            if (data.short) { // If the link has a referer
                return callback({
                    'status': 'OK',
                    'id': id,
                    
                    // Data
                    'long': data.long,
                    'clicks': data.clicks,
                    'secret': data.secret,
                    'created': data.created,
                    'short': data.short
                });
            }
            
            return callback({
                'status': 'OK',
                'id': id,
                
                // Data
                'long': data.long,
                'clicks': data.clicks,
                'secret': data.secret,
                'created': data.created
            });
        }
        
        return expand(data.refer, callback);
    });
}

function setRefer(id, refer, callback) {
    var name = getName(id);

    dbconfig.get('redis').hgetall(name, function (err, data) {
    
        if (!data) {
            util.error('Could not get data');
            return callback({
                'status': 'ERROR',
                'message': 'Key not found'
            }); 
        }
        
        // Set object data
        data.short = refer;

        dbconfig.get('redis').hmset(name, data, function(error, response) {
            
            if (response == null) {
                util.error('Could not set data');
                return callback({
                    'status': 'ERROR',
                    'message': 'Could not set data'
                }); 
            }
        
            // Set refer data
            var referData = {
                'refer': id           
            };
            
            dbconfig.get('redis').hmset(getName(refer), referData, function(error, response) {
                if (response == null) {
                    util.error('Could not set refer');
                    return callback({
                        'status': 'ERROR',
                        'message': 'Could not set refer'
                    }); 
                }
                
                return callback({
                    'status': 'OK',
                    'id': id,
                    
                    // Data
                    'long': data.long,
                    'clicks': data.clicks,
                    'secret': data.secret,
                    'created': data.created,
                    'short': refer
                });
            });
            
        });
    });
}

function idExists(id, callback) {
    dbconfig.get('redis').exists(getName(id), function (error, exists) {
        callback(exists);
    });
}

function renameAndPut(id, newId, data, callback) {
    var name = getName(id);
    var newName = getName(newId);
    
    dbconfig.get('redis').rename(name, newName, function (err, response) {
        if (!response) {
            callback(err);
            return util.error(err);
        }
        
        dbconfig.get('redis').set(getUrl(data.long), newId);
        
        dbconfig.get('redis').hmset(newName, data, function(err, response) {
            if (!response) {
                throw new Error("No response received: " + err);
            }
        
            callback();
        });
    });
}

function deleteRef(id, callback) {
    callback = callback || function() {};
    var name = getName(id);
    
    dbconfig.get('redis').hgetall(name, function (err, data) {
        if (!data) {
            callback(err);
            return util.error(err);
        }
        
        var urlName = getUrl(data.long);
        
        dbconfig.get('redis').del(urlName, function(err, data) {
            if (!data) {
                callback(err);
                return util.error(err);
            }
            
            callback();
        });
    });

}

function putRaw(id, data, callback) {
    // Delete old url -> id reference
    deleteRef(id, function() {
        var name = getName(id);
        
        dbconfig.get('redis').hmset(name, data, function(err, response) {
            if (!response) {
                callback(err);
                return util.error(err);
            }
            
            // Set new callback reference
            dbconfig.get('redis').set(getUrl(data.long), id);
            
            callback();
        });
    });
}

function deleteRaw(id, callback) {
    // Delete old url -> id reference
    deleteRef(id, function() {
        
        var name = getName(id);

        dbconfig.get('redis').del(name, function (err, response) {
        
            if (!response) {
                callback(err);
                return util.error(err);
            }
           
           callback();
        });
    });
}

function increment(id, callback) {
    callback = callback || function() {};

    var name = getName(id);
    dbconfig.get('redis').hgetall(name, function (err, data) {
        if (!data) {
            callback(err);
            return util.error(err);
        }
        
        var clicks = Number(data.clicks);
        
        dbconfig.get('redis').hset(name, "clicks", clicks + 1, function(error, response) {
            if (response == null) {
                callback(err);
                return util.error(err);
            }
            
            callback(null, response);
        });
        
        dbconfig.get('redis').incr('redirects');
        redirects++;
        
        callback();
    });
};

function getRedirects() {
    if (redirects != -1) {
        return redirects;
    }
    
    dbconfig.get('redis').get('redirects', function (err, response) {
        if (err) {
            return util.error(err);
        }
        
        redirects = Number(response);
        console.log("Users redirected: " + redirects);
    });
}

function getLength() {
    if (length != -1) {
        return length;
    }
    
    dbconfig.get('redis').get('linksgenerated', function (err, response) {
        if (err) {
            return util.error(err);
        }
        
        length = Number(response);
        console.log("Links generated: " + length);
    });
}

function setup() {
    var client = redis.createClient(config.redis.port, config.redis.host);
    client.auth(config.redis.pass);

    dbconfig.set('redis', client);
    dbconfig.set('chars', config.url.chars);
    dbconfig.set('length', config.url.length);
    dbconfig.set('expire', config.redis.expire);
    dbconfig.set('expiretime', config.redis.expiretime);

    getLength();
    getRedirects();
}

setup();

var db = this;
db.config = config;
db.shorten = shorten;
db.expand = expand;
db.getLength = getLength;
db.getRedirects = getRedirects;
db.setup = setup;
db.idExists = idExists;
db.renameAndPut = renameAndPut;
db.deleteRef = deleteRef;
db.putRaw = putRaw;
db.deleteRaw = deleteRaw;
db.increment = increment;
db.setRefer = setRefer;

module.exports = db;