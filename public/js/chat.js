(function(){
	var ws = null;
	var username = '';
	function $(id) {
		return document.getElementById(id);
	}

	window.addEventListener('load', onLoadWindow, false);

	function onLoadWindow() {
		$('submit-button').addEventListener('click', function() {
			username = $('name-input').value.trim();
			if (!username)
				return;
			$('username').innerHTML = username;
			ws.send(JSON.stringify({
				action: 'auth',
				name: username
			}));
		}, false);
		$('send-button').addEventListener('click', function() {
			sendMessage();
		}, false);
		$('message-input').addEventListener('keydown', function(e) {
			if (e.keyCode == 13 && e.ctrlKey) {
				sendMessage();
			}
		});
		initWS();
	}
	function sendMessage() {
		messageInput = $('message-input');
		var message = messageInput.value.trim();
		if (!message)
			return;
		messageInput.value = '';
		messageInput.focus();
		ws.send(JSON.stringify({
			action: 'message',
			message: message
		}));
	}
	function initWS() {
		var host = location.origin.replace(/^http/, 'ws')
		ws = new WebSocket(host);
		ws.addEventListener('error', function(e) {
			console.log('WebSocket error', e);
			var $errorPanel = $('error-panel');
			$errorPanel.style.display = 'block';
		});
		ws.addEventListener('close', function(e) {
			console.log('WebSocket close', e);
			$('init-container').style.display = 'block';
			$('error-panel').style.display = 'block';
			$('login-form').style.display = 'none';
			$('chat-container').style.display = 'none';
			window.setTimeout(initWS, 5000);
		});
		ws.addEventListener('open', onOpenWebSocket, false);
		ws.addEventListener('message', onMessageWebSocket, false);
	}

	function onMessageWebSocket(event) {
		console.log('message', event.data);
		var message = JSON.parse(event.data);
		switch (message.action) {
			case 'auth-success':
				showUI();
				break;

			case 'auth-fail':
				alert('User already exists!\nPlease use another username');
				break;

			case 'load-users':
				var users = message.users;
				var $usersList = $('users-list');
				while ($usersList.firstChild) {
					$usersList.removeChild($usersList.firstChild);
				}
				for (var i = 0; i < users.length; i++) {
					if (users[i] == username)
						continue;
					var div = document.createElement('div');
					div.innerHTML = users[i];
					$usersList.appendChild(div);
				}
				break;

			case 'load-messages':
				var messages = message.messages;
				var $messagesList = $('messages-list');
				if ($messagesList.firstChild && $messagesList.firstChild.innerText == 'load more messages') {
					$messagesList.removeChild($messagesList.firstChild);
				}

				for (var i = messages.length - 1; i >= 0 ; i--) {
					var div = document.createElement('div');
					div.className = 'message';
					var date = new Date(messages[i].date);
					div.innerHTML = '(' + date.toLocaleString() + ') ' + messages[i].user + ':<br>' + messages[i].text.replace(/\n/, '<br>');
					$messagesList.insertBefore(div, $messagesList.firstChild);
				}
				$messagesList.scrollTop = $messagesList.scrollHeight;
				if (message.more > 0) {
					var div = document.createElement('div');
					div.className = 'load-more';
					div.innerHTML = 'load more messages';
					div.addEventListener('click', function() {
						ws.send(JSON.stringify({
							action: 'load-messages',
							fromId: messages[0].id
						}));
					}, false);
					$messagesList.insertBefore(div, $messagesList.firstChild);
				}
				break;

			case 'user-message':
				var message = message.message;
				console.log('user-message', message);
				addMessageToView(message, 'message');
				break;

			case 'user-join':
				var user = message.user;
				if (user == username) {
					return;
				}				
				var $usersList = $('users-list');
				var div = document.createElement('div');
				div.innerHTML = user;
				$usersList.appendChild(div);
				message.text = 'User has joined to the chat';
				addMessageToView(message, 'system');
				break;

			case 'user-left':
				var user = message.user;
				if (user == username) {
					return;
				}	
				var $usersList = $('users-list');
				var nodes = $usersList.childNodes;
				for (i = 0; i < nodes.length; i ++) {
					if (nodes[i].innerText == user) {
						$usersList.removeChild(nodes[i]);
					}
				}
				message.text = 'User has left from the chat';
				addMessageToView(message, 'system');
				break;
		}
	}
	function onOpenWebSocket(event) {
		$('init-container').style.display = 'block';
		$('login-form').style.display = 'block';
		$('error-panel').style.display = 'none';
		$('chat-container').style.display = 'none';
		$('name-input').focus();
	}
	function showUI() {
		var $messagesList = $('messages-list');
		while ($messagesList.firstChild) {
			$messagesList.removeChild($messagesList.firstChild);
		}
		$('init-container').style.display = 'none';
		$('chat-container').style.display = 'block';
		$('message-input').focus();
	}
	function addMessageToView(message, className) {
		var $messagesList = $('messages-list');
		var div = document.createElement('div');
		div.className = className;
		var date = new Date(message.date);
		div.innerHTML = '(' + date.toLocaleString() + ') ' + (message.user ? message.user : '') + ':<br>' + message.text;
		$messagesList.appendChild(div);
		$messagesList.scrollTop = $messagesList.scrollHeight;
	}
})();
