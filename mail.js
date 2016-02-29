var config = require('./config');
var nodemailer = require('nodemailer');
var sendMail = function(subject,content,callback){
	var transport = nodemailer.createTransport("SMTP",{
		host:config.email.host,
		secureConnection:config.email.secureConnection,
		port:config.email.port,
		auth: {
			user:config.email.auth.user,
			pass: config.email.auth.pass
		}
	});
	transport.sendMail({
		from: config.email.auth.user ,
		to:config.email.touser,
		subject: subject,
		generateTextFromHTML : true,
		html : content
	},callback); 
};

exports.sendMail = sendMail;