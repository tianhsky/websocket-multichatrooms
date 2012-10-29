# websocket-multichatrooms

A small chatroom web application written with node.js and socket.io

[See Demo](http://www.tianyuhuang.com/examples/chatroom "Demo")

## How to use it

###Configuration

####/server.js

	// default port
	var app_port = 8080;
	
	// default node module path	
	var node_module_path = '/node_modules';

## Start/Stop Service

make sure node.js is installed

	sudo aptitude install nodejs

express and socket.io module are already included in the project, you can update by running command

	cd /path/to/project
	npm update

start the server:

	#start server
	node server.js 

stop the server using (ctrl c) or just exit the shell or session;

since the process will be killed when you exit the shell or session; in order to keep the process running, you may use [forever](https://github.com/nodejitsu/forever)

	npm install forever -g

	forever start server.js

	#to kill the process
	#show list of processes running with forever
	forever list 

	#find the process to be killed, 0 is the index
	forever kill 0 

## Author

Tianyu Huang

