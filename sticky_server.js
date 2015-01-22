sticky = require('./sticky');

var serverInstance = function () {
    // Include Express
    var express = require('express');

    // Create a new Express application
    var app = express();

    var io;  //socket.io object


    // Used as TRIGER for brodcast message to all connected sockets
    app.get('/', function (req, res) {
        res.send('Hello from Worker ' + process.workerId + ' proccess pid:' + process.pid+'\n');
	//create msg
	var msg = {'msg':'test message','workerId':process.workerId};
	//broadcast to all sockets (related with this proccess)
	io.emit('message',msg);  
    });

    // Bind to a port and start http server
    var http = require('http').createServer(app);

    // Start WS server
    io= require('socket.io').listen(http);
    
    io.on('connection', function(socket){
	  console.log('socket connected to worker:  ' + process.workerId);
	  socket.on('disconnect', function(socket){
		  console.log('socket disconnected from worker:  ' + process.workerId);
		});
	});


    console.log('Worker ' + process.workerId + ' running!');
    
    return http;
    };	
	

sticky(serverInstance).listen(3000);
