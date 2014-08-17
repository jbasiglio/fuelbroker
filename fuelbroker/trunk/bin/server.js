/**
 * fuelbroker: a broker for FuelDB
 * Copyright(c) 2014 Joris Basiglio <joris.basiglio@wonderfuel.io>
 * MIT Licensed
 */

var auth = require('./auth.js');
var config = require('../conf/config.json');
var WebSocket = require('ws');
var WebSocketServer = WebSocket.Server;
var fs = require('fs');
var http = require('http');
var https = require('https');
var urlParse = require('url');

var WS_STATE = {};
WS_STATE.CONNECTING = 0;
WS_STATE.OPEN = 1;
WS_STATE.CLOSING = 2;
WS_STATE.CLOSED = 3;

var servers = {};

var _wsRequestHandle = function(ws) {
	var url = urlParse.parse(ws.upgradeReq.url,true);
	if(auth.verifyURL(url)){
		var obj = {"error":"Auth failed"};
		ws.send(JSON.stringify(obj));
		ws.close();
	}
	ws.id = url.query.id;
	console.log("Connection open: "+ws.id);
	ws.onPushed = function(msg) {
		if(ws.readyState === WS_STATE.CONNECTING){
			setTimeout(function() {
				ws.onPushed(msg);
			}, 200);
		} else if(ws.readyState === WS_STATE.OPEN) {
			ws.send(msg);
		}
	};
	ws.on('message', function(msg) {
		for(var id in servers){
			if(id !== ws.id){
				servers[id].onPushed(msg);
			}
		}
	});
	ws.on('error', function(message) {
		console.log("Error: "+message);
	});
	ws.on('close', function(code, message) {
		console.log("Connection lost: "+ws.id);
		delete servers[ws.id];
	});
	servers[ws.id] = ws;
};

config.hosts.forEach(function(host){
	var httpServer;
	if (host.ssl) {
		var options = {
			key : fs.readFileSync(host.key),
			cert : fs.readFileSync(host.cert)
		};
		httpServer = https.createServer(options);
	}else{
		httpServer = http.createServer();
	}
	var wsServer = new WebSocketServer({
		server : httpServer
	});
	wsServer.on('connection', _wsRequestHandle);
	httpServer.listen(host.port, host.host);
	console.log('Listening for HTTP'+(host.ssl?'S':'')+'/WS'+(host.ssl?'S':'')+' at IP ' + host.host + ' on port ' + host.port);
});

