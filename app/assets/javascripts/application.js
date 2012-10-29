//helpers
if(typeof String.prototype.trim !== 'function') {
    String.prototype.trim = function() {
	return this.replace(/^\s+|\s+$/g, ''); 
    };
}

function getHashSize(obj) {
    var size = 0;
    for (var key in obj) {
	if (obj.hasOwnProperty(key)) size++;
    }
    return size;
}

function genRandomString(length){
    var keylist = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    var temp = "";
    for (var i=0; i<length; i++)
	temp += keylist.charAt(Math.floor(Math.random()*keylist.length));
    return temp;
}

//
var me = null;
var users = {};
var rooms = {};

//
function addUser(user){
    var divUser = $("<div>", {
			"class": user.type + " label",
			"ele_id": user.id
		    });
    var divUserText = $("<a>", {
			    "class": "text",
			    "text": user.name,
			    "href": "#"
			});
    if(user.id == me.id){
	divUser.addClass("label-warning");
    }
    else{
	divUser.addClass("");
    }
    divUser.append(divUserText);
    
    $("#current_room .user_list").append(divUser);
}

function joinUser(room, user){
    var userName = user.name;
    if(user.id == me.id){
	me = user;
	userName = userName + "(me)";
	socket.emit('getRoomInfo');
    }
    else{
	addUser(user);
    }
    addMessage("SYSTEM", userName + " joined the room " + room.name + ".");
}

function addMessage(sender, data){
    var divMessageSender = $("<span>", {"class": "message_sender label"});
    if(typeof (sender) == "string"){
	divMessageSender.addClass("label-inverse");
	divMessageSender.text(sender);
    } 
    else{
	if(sender.id == me.id){
	    divMessageSender.addClass("label-warning");
	}
	divMessageSender.text(sender.name);
    } 

    var divMessageBody = $("<span>",{
			       "class": "message_body",
			       "text": data
			   });
    var divMessage = $("<div>").append(divMessageSender).append(divMessageBody).hide();
    
    var chatArea = $("#current_room .chat_area");
    chatArea.append(divMessage);
    divMessage.fadeIn();
    chatArea[0].scrollTop = chatArea[0].scrollHeight;
}

function addRoom(room){
    var divRoom = $("<div>", {
			"class": room.type + " span2",
			"ele_id": room.id
		    });
    var divRoomItem = $("<a>", {
			    "class": "thumbnail",
			    "href": "#"
			});
    var divRoomName = $("<p>", {
			    "class": "text",
			    "text": room.name
			});
    divRoom.append(divRoomItem);
    divRoomItem.append(divRoomName);
    
    $("#current_room .rooms").append(divRoom);
    divRoom.click(function(){
		      var roomToJoin = $(this);
		      socket.emit('joinUser', roomToJoin.attr("ele_id"));
		  });
}

function removeRoom(parentRoom, room){
    var divRoom = $("." + room.type + "[ele_id="+room.id+"]");
    divRoom.remove();
}

function removeUser(room, user){
    var divUser = $("." + user.type + "[ele_id="+user.id+"]");
    divUser.remove();
    addMessage("SYSTEM", user.name + " exited the room " + room.name + ".");
}

function refreshRoom(roomInfo){
    $("#current_room .name").empty();
    $("#current_room .rooms").empty();
    //$("#current_room .chat_area").empty();
    $("#current_room .user_list").empty();
    $("#current_room .input_area .input_box").val("");
    
    //
    if(roomInfo.parent){
	$(".add_room").hide();
	$(".exit_room").show();
	$("#current_room .rooms_wrapper").hide();
	$("#current_room .chat_area").css("height", 250);
    }
    else{
	$(".add_room").show();
	$(".exit_room").hide();
	$("#current_room .rooms_wrapper").show();
	$("#current_room .chat_area").css("height", 150);
    }
    
    // room name
    var divRoomName = $("<span>", {
			    "class": "badge badge-info span3",
			    "html": "<h5>"+roomInfo.name+"</h5>"
			});
    $("#current_room .name").append(divRoomName);
    
    // add child rooms
    var childRooms = roomInfo.rooms;
    for(var key in childRooms){
	var tempRoom = childRooms[key];
	addRoom(tempRoom);
    }
    
    // add users in the room
    var roomUsers = roomInfo.users;
    for(var key in roomUsers){
	var tempUser = roomUsers[key];
	addUser(tempUser);
    }
    
    var chatArea = $("#current_room .chat_area");
    chatArea[0].scrollTop = chatArea[0].scrollHeight;
}

//listen sockets
var socket = io.connect('/');
socket.on('connect', function(){
	      var randomName = genRandomString(5);
	      socket.emit('addUser', randomName);
	  });
socket.on('meCreated', 
	  function(sender, user){
	      me = user;
	      addMessage("SYSTEM", "Welcome to chatroom, click on 'Add Room' to create a new room, "
			 + "click on a room to join the room if any, type in message and hit enter "
			 + "to send message to current room.");
	      $("#loading_screen").hide();
	      $("#current_room").fadeIn();
	  });
socket.on('joinUser', function(room, user){
	      joinUser(room, user);
	  });
socket.on('getRoomInfo', function(room, roomInfo){
	      refreshRoom(roomInfo);
	  });
socket.on('exitUser', function(room, user){
	      removeUser(room, user);
	  });
socket.on('sendMessage', function(sender, data){
	      addMessage(sender, data);
	  });
socket.on('addRoom', function(parentRoom, room){
	      addRoom(room);
	  });
socket.on('removeRoom', function(parentRoom, room){
	      removeRoom(parentRoom, room);
	  });

//events
$(function(){
      $("#current_room .input_area .input_box").keyup(
	  function(e){
	      var code = (e.keyCode ? e.keyCode : e.which);
	      if(code == 13){ //on press enter key
		  var inputDiv = $("#current_room .input_area .input_box");
		  if(inputDiv.val().trim().length > 0){
		      socket.emit('sendMessage', inputDiv.val().trim());
		      e.preventDefault();
		      inputDiv.val("");
		  }
	      }
	  });
      
      $("#current_room .controls .add_room").click(
	  function(){
	      var newRoomName = prompt("Enter new room name");
	      socket.emit('addRoom', newRoomName.trim());
	  });
      
      $("#current_room .controls .exit_room").click(
	  function(){
	      socket.emit('exitUser');
	  });
  });