var net = require('net'),
    cluster = require('cluster');

function getParameterValueFromUrl(url, param) {
  return (new RegExp('[?|&]' + param + '=' + '([^&;]+?)(&|#|;|$)').exec(url)||[,""])[1].replace(/\+/g, '%20')||null
}	
	
module.exports = function sticky(num, callback) {
  var server;
  var k = 1;
  // `num` argument is optional
  if (typeof num !== 'number') {
    callback = num;
    num = require('os').cpus().length;
    //num =1;
  }

  // Master will spawn `num` workers
  if (cluster.isMaster) {
    var workers = [];
    for (var i = 0; i < num; i++) {
		!function spawn(i) {
			workers[i] = cluster.fork();
			console.log('workers['+i+'] = worker'+workers[i].id);
			// Restart worker on exit
			workers[i].on('exit', function() {
				console.error('sticky-session: worker died');
				//spawn(i);  //disabled meanwhile for viewing debug messages without jumps
				});
		}(i);
	}

    server = net.createServer(function(c) {
		  console.log('connection request');
      var body = '';
  // we want to get the data as utf8 strings
  // If you don't set an encoding, then you'll get Buffer objects
  c.setEncoding('utf8');
	console.log(c);
  	// Pass connection to first active worker for test case 
		var id = 0;
		workers[id].send('sticky-session:connection', c);
	});
  } else {
  
    process.workerId = cluster.worker.id;  //added for extracting worker ID outside of this scope.
    server = typeof callback === 'function' ? callback() : callback;

    // Worker process
    process.on('message', function(msg, socket) {
      if (msg !== 'sticky-session:connection') return;
      console.log('worker'+cluster.worker.id + ' accepting connection');
      server.emit('connection', socket);
    });



    if (!server) throw new Error('Worker hasn\'t created server!');

    // Monkey patch server to do not bind to port
    var oldListen = server.listen;
    server.listen = function listen() {
      var lastArg = arguments[arguments.length - 1];

      if (typeof lastArg === 'function') lastArg();

      return oldListen.call(this, null);
    };
  }

  
  return server;
};
