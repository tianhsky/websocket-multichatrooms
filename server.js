/*
 * Author: Tianyu Huang
 * Websocket multi-chatrooms example
 */

// configure
var app_port = 8080;
var node_module_path = '/node_modules';

// setup server
var path = require("path");
var fs = require("fs");
var app_root_path = path.join(__dirname, './');
var app_modules_path = path.join(app_root_path, node_module_path);

// setup server
var express = require('express');
var http = require('http');

var app = express();
var server = http.createServer(app);
var io = require('socket.io').listen(server);
io.set('log level', 1);

server.listen(app_port);

// routes
app.get('/', function (req, res) {
	    res.sendfile(path.join(app_root_path,  '/public/index.html'));
	});
app.get('/assets/*', function (req, res) {
	    var file_inner_path = path.relative("/assets", req.url);

	    var path1 = path.join(app_root_path, "/app/assets/javascripts", file_inner_path);
	    var path2 = path.join(app_root_path, "/app/assets/images", file_inner_path);
	    var path3 = path.join(app_root_path, "/app/assets/stylesheets", file_inner_path);
	    
	    var path4 = path.join(app_root_path, "/lib", file_inner_path);
	    
	    var final_path = path1;
	    if(path.existsSync(path1)) final_path = path1;
	    else if(path.existsSync(path2)) final_path = path2;
	    else if(path.existsSync(path3)) final_path = path3;
	    else if(path.existsSync(path4)) final_path = path4;
	    else final_path = path1;

	    res.sendfile(final_path);
	});


// helpers
function getHashSize(obj) {
    var size = 0;
    for (var key in obj) {
        if (obj.hasOwnProperty(key)) size++;
    }
    return size;
}

function genRandomString(length){
    var keylist = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
    var temp = "";
    for (var i=0; i<length; i++)
	temp += keylist.charAt(Math.floor(Math.random()*keylist.length))
    return temp;
}

// models
var User = function(options){
    var self = this;
    
    self.id = options.id || null;
    self.name = options.name || null;
    self.socket = options.socket || null;
    self.room = options.room || null;
    self.type = "user";
    
    self.getObject = function(){
	var obj = { id: self.id, 
		    name: self.name, 
		    type: self.type };
	return obj;
    };

    self.notifyAction = function(actionType, sender, obj){
	var senderObj = null;
	if(sender && sender.getObject) senderObj = sender.getObject();
	self.socket.emit(actionType, senderObj, obj);
	console.log(actionType, senderObj, obj);
    };
    
    var initialize = function(){ 
	self.notifyAction("meCreated", null, self.getObject());
    };
    initialize();
    return self;
};

var Room = function(options){
    var self = this;
    
    self.id = options.id || null;
    self.name = options.name || null;
    self.creator = options.creator || null;
    self.parent = options.parent || null;
    self.type = "room";
    
    var rooms = {};
    var users = {};
    
    self.getObject = function(){
	var obj = { id: self.id, 
		    name: self.name, 
		    creator: self.creator ? self.creator.getObject() : null,
		    parent: self.parent ? self.parent.getObject() : null,
		    type: self.type,
		    totalRooms: getHashSize(rooms),
		    totalUsers: getHashSize(users)};
	return obj;
    };
    
    self.getRooms = function(){
	return rooms;
    };
    
    self.getRoomInfo = function(){
	var obj = self.getObject();

	obj.users = {};
	for (var userKey in users){
	    var tempUser = users[userKey];
	    obj.users[tempUser.id] = tempUser.getObject();
	}
	
	obj.rooms = {};
	for (var roomKey in rooms){
	    var tempRoom = rooms[roomKey];
	    obj.rooms[tempRoom.id] = tempRoom.getObject();
	}
	
	return obj;
    };
    
    self.getUsers = function(){
	return users;
    };
    
    //actionType=[sendMessage, addRoom, removeRoom, joinUser, exitUser]
    self.notifyAction = function(actionType, sender, obj){
	for(var key in users){
	    var user = users[key];
	    user.notifyAction(actionType, sender, obj);
	}
    };
    
    //add new room to current room
    //notify current room users a new child room is created
    self.addRoom = function(room){
	if(!rooms[room.id]){
	    room.parent = self;
	    rooms[room.id] = room;
	    self.notifyAction("addRoom", self, room.getObject());
	}
    };
    
    //remove users from current room and move to parent room if any
    //delete current room
    self.removeRoom = function(room){
	if (getHashSize(room.getRooms()) > 0) {
	    throw("Can not remove this room.");
	}
	if(rooms[room.id]){			
	    for(var key in users){
		var user = users[key];
		room.exitUser(user);
		self.joinUser(user);
	    }
	    delete rooms[room.id];
	    self.notifyAction("removeRoom", self, room.getObject());
	}
    }
    
    //add user to current room
    self.joinUser = function(user){
	user.room = self;
	users[user.id] = user;
	self.notifyAction("joinUser", self, user.getObject());
    };
    
    //remove a user from current room
    self.exitUser = function(user){
	var userRoom = user.room;
	if(users[user.id]){
	    user.room = null;
	    delete users[user.id];
	    self.notifyAction("exitUser", self, user.getObject());
	}
	if(self.parent && userRoom && getHashSize(userRoom.getUsers()) == 0){
	    self.parent.removeRoom(self);
	}
    };
    
    var initialize = function(){
	
    };
    initialize();
    return self;
};

// lobby, initial place for new user and holds all rooms
var lobby = new Room({
			 id: 0, 
			 name: "Lobby"
		     });

// all rooms, {roomId: room}
var rooms = {};

// all online users, {userId: user}
var users = {};


io.sockets.on('connection', function (socket) {
		  
		  socket.on('addUser', function(name){
				var newUser = null;
				newUser = new User({
						       id: socket.id, 
						       name: name, 
						       socket: socket
						   });
				users[newUser.id] = newUser;
				lobby.joinUser(newUser);
			    });
		  
		  socket.on('addRoom', function(name){
				var newRoom = null;
				var currentUser = users[socket.id];
				var currentRoom = currentUser.room;
				var randomId = Date.now().toString() + "_" + genRandomString(5);
				newRoom = new Room({
						       id: randomId, 
						       name: name, 
						       creator: currentUser,
						       parent: lobby
						   });
				rooms[newRoom.id] = newRoom;
				lobby.addRoom(newRoom);
				
				//move creator to this room
				currentRoom.exitUser(currentUser);
				newRoom.joinUser(currentUser);
			    });
		  
		  socket.on('joinUser', function(roomId){
				var currentUser = users[socket.id];
				var roomToJoin = rooms[roomId];
				
				if(currentUser.room){
				    currentUser.room.exitUser(currentUser);
				}
				roomToJoin.joinUser(currentUser);
			    });
		  
		  socket.on('exitUser', function(){
				var currentUser = users[socket.id];
				var roomToExit = currentUser.room;
				var roomToJoin = lobby;
				roomToExit.exitUser(currentUser);
				roomToJoin.joinUser(currentUser);
			    });

		  socket.on('getRoomInfo', function(){
				var currentUser = users[socket.id];
				var currentRoom = currentUser.room;
				currentUser.notifyAction("getRoomInfo", currentRoom, currentRoom.getRoomInfo());
			    });
		  
		  socket.on('sendMessage', function(message){
				var currentUser = users[socket.id];
				var currentRoom = currentUser.room;
				currentRoom.notifyAction("sendMessage", currentUser, message);
			    });
		  
		  socket.on('sendPrivateMessage', function(message, receiverIds){
				var currentUser = users[socket.id];
				for(var key in receiverIds) {
				    var userFound = users[receiverIds[key]];
				    userFound.notifyAction("sendMessage", currentUser, message);
				}
			    });
		  
		  socket.on('disconnect', function(){
				var currentUser = users[socket.id];
				var roomToExit = currentUser.room;
				roomToExit.exitUser(currentUser);
				delete users[socket.id];
			    });
		  
	      });
