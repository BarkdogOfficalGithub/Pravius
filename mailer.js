var nodemailer = require("nodemailer");

var config = require('./config');

var mailer = nodemailer.createTransport("SMTP",{
   service: config.mail.service,
   auth: {
       user: config.mail.user,
       pass: config.mail.pass
   }
});

exports.mail = function(subject, message, callback) {
    mailer.sendMail({
        from: "\"Pravius Support\" <" + config.mail.user + ">", // sender address
        to: "<" + config.mail.to + ">",
        subject: subject,
        html: message,
        generateTextFromHTML: true
    }, function(error, response){
        if(error){
            return callback(error);
        }
        
        callback(null, response);
    });
};

