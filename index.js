var express = require('express');
var http = require("http");
var WebSocketServer = require('ws').Server;
var app = express();
var port = process.env.PORT || 5000;

app.use(express.static(__dirname + '/public'));

var server = http.createServer(app);
server.listen(port);

// views is directory for all template files
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

app.get('/', function(request, response) {
	response.render('pages/index');
});

app.listen(app.get('port'), function() {
	console.log('Node app is running on port', app.get('port'));
});

var wss = new WebSocketServer({
	server: server
});
wss.on('connection', function (ws) {	
	var username = '';
	var registered = false;
	console.log('WebSocketServer onConnection');

	ws.on('message', function (message) {
		console.log('WebSocketServer onMessage', message);
		var event = null;
		try {
			event = JSON.parse(message);
		} catch (e) {
			return;
		}
		switch (event.action) {
			case 'auth': 
				username = event.name;
				if (users.exists(username)) {
					sendMessage({
						'action': 'auth-fail',
						'message': 'User already exists'
					});
				} else {
					users.join(username);
					sendMessage({
						'action': 'auth-success'
					});
					broadcastMessage({
						'action': 'user-join',
						'user': username,
						'date': new Date().getTime()
					});
					var usersList = users.get();
					sendMessage({
						'action': 'load-users',
						'users': usersList
					});
					var messagesList = messages.get();
					sendMessage({
						'action': 'load-messages',
						'messages': messagesList.messages,
						'total': messagesList.total,
						'more': messagesList.more
					});
				}
				break;

			case 'message':
				var text = tools.escapeHtml(event.message);
				var now = new Date().getTime();
				var message = {
					user: username,
					text: text,
					date: now
				};
				messages.add(message);
				broadcastMessage({
					'action': 'user-message',
					'message': message
				});
				break;

			case 'load-messages':
				var messagesList = messages.get(event.fromId);
				sendMessage({
					'action': 'load-messages',
					'messages': messagesList.messages,
					'total': messagesList.total,
					'more': messagesList.more
				});
				break;
		}
	});

	ws.on('close', function() {
		console.log('WebSocketServer onClose');
		if (username) {
			users.remove(username);
			broadcastMessage({
				'action': 'user-left',
				'user': username,
				'date': new Date().getTime()
			});
		}
	});

	ws.on('error', function() {
		console.log('WebSocketServer onError');
	});

	function sendMessage(message) {
		console.log('sendMessage', message);
		ws.send(JSON.stringify(message));	
	}
});

function broadcastMessage(message) {
	console.log('broadcastMessage', message);
	if (wss && wss.clients) {
		wss.clients.forEach(function (ws) {
			ws.send(JSON.stringify(message));
		});
	}
}

var users = new function() {
	var list = [];
	this.join = function(username) {
		list.push(username);
	};
	this.remove = function(username) {
		list.splice(list.indexOf(username), 1);
	};
	this.get = function() {
		return list.slice();
	};
	this.exists = function(name) {
		return !(list.indexOf(name) == -1);
	}
};

var messages = new function() {
	var list = [];
	var lastId = 0;
	var DEFAUL_SIZE_REQUEST_BUFFER = 10;
	this.add = function(message) {
		message.id = lastId++;
		list.push(message);
	};
	/**
	*	Returns array of messages
	*	If parameters are omitted - returns last messages
	*	@return Array
	*		Array of messages	
	*	@param int toId
	*		Max message ID for requested buffer history
	*	@param int count|DEFAUL_SIZE_REQUEST_BUFFER
	*		Size of the requested buffer
	*/
	this.get = function(toId, count) {
		count = count || DEFAUL_SIZE_REQUEST_BUFFER;
		var to = list.length;
		if (toId) {
			for (var i = list.length - 1; i >= 0 ; i--) {
				if (list[i].id == toId) {
					to = i;
					break;
				}
			}
		}
		var from = to - count >= 0 ? to - count : 0;
		return {
			messages: list.slice(from, to),
			total: list.length,
			more: from
		};
	};
};

var tools = new function() {
	var entityMap = {
		"&": "&amp;",
		"<": "&lt;",
		">": "&gt;",
		'"': '&quot;',
		"'": '&#39;',
		"/": '&#x2F;'
	};
	this.escapeHtml = function(string) {
		return String(string).replace(/[&<>"'\/]/g, function (s) {
			return entityMap[s];
		});
	};
};
