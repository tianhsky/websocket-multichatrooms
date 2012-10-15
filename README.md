# websocket-multichatroom

A small chatroom web application written with socket.io

## How to use it

###Configuration

####/server.js

default port is 8080, change it to a non-occupied port if you like

	var port = 8080;

####/index.html

change the js library source to point to your server

	<script src="http://blog.tianyuhuang.com:8080/socket.io/socket.io.js"></script>

change the websocket_server to point to your server

	var websocket_server = "http://blog.tianyuhuang.com:8080";

## Starting Server

1. make sure node.js is installed

	sudo aptitude install nodejs

2. express and socket.io module are already included in the project, you can update by running command

	cd /path/to/project
	npm update

3. start the server in the following way:

	node server.js

4. however, the process will be killed when you exit the shell or session; 
   in order to keep the process running, you may use [forever](https://github.com/nodejitsu/forever)

	npm install forever -g

	forever start server.js

5. to kill the process

	forever list #show list of processes running with forever

	forever kill 0 #find the process to be killed, 0 is the index

## Author

Tianyu Huang

