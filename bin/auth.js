/**
 * fueldb: a realtime database
 * Copyright(c) 2014 Joris Basiglio <joris.basiglio@wonderfuel.io>
 * MIT Licensed
 */

var config = require('../conf/config.json');
var crypto = require('crypto');
var users = require('../conf/users.json');

exports.verifyURL = function(url){
	try{
		var user = url.query.user;
		var signature = url.query.signature;
		var check = url.href.split("&signature=")[0];
		var hash = crypto.createHmac('sha256',users[user]).update(check).digest('hex');
		return hash !== signature;
	}catch(e){
		console.log(e);
		return true;
	}
};

exports.computeURL = function(){
	var user = config.balancer.user;
	var password = config.balancer.password;
	var toSign = "/?timestamp="+new Date().getTime()+"&user="+user;
	var key = crypto.createHmac('sha256',user).update(password).digest('hex');
	//var key = CryptoJS.HmacSHA256(_password,_user)+"";
	var sign = crypto.createHmac('sha256',key).update(toSign).digest('hex');
	//var sign = CryptoJS.HmacSHA256(toSign,key);
	return toSign+"&signature="+sign;
};