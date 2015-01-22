
var ws = require('socket.io-client');
var updates = 0; 			// for counting masseges that sockets got. represent number of active/alive sockets.
var socks = 0;  			// for counting alive sockets - on end of every update reset - currently doesn't work
var testLoadWithInterval = function (q) {

    var i = 1;
    var sockets = [];
    var stepIntervalTime = 150;		// ms timeout between connections
    var refreshUpdatesInterval = 10000;// ms timeout between resets of updates counter
    var percent = 100/q;
    var startTime = new Date().getTime();
    var endTime;
    
    console.log('Sockets loading test:');
    console.log('	Sockets quantity             : ' + q);
    console.log('	Interval between connections : ' + stepIntervalTime + ' ms');
    console.log('	Interval of counter reset    : ' + refreshUpdatesInterval + ' ms');
    var intervalID = setInterval(function () {

        sockets[i] = ws.connect('http://localhost:3000/', {
            'force new connection': true,
            'reconnection': true,
            'reconnectionDelay': 1000,
            'reconnectionDelayMax': 25000,
            'reconnectionAttempts': 2,
            'transports': ['websocket'],
	        'query':'roomtest=1'});   // need  to extract this data on server side
        sockets[i].on('connect', function () {
        });
        sockets[i].on('error', function () {
		console.log('socket error. id: '+i);
        });
        sockets[i].on('disconnect', function () {
		console.log('socket disconnected. socket id: '+i);
        });

        if (i === (q)) {
	    endTime = new Date().getTime();
            clearInterval(intervalID); //stop connecting new clients
	    console.log('Load reached 100%.  Time elapsed: ' + (endTime - startTime) + ' ms');
            console.log('Tester starts count msgs!              ');
            sockets.forEach(function (element) {
                if (element !== undefined) {
                    element.on('message', function (data) {
                        updates++;
			if (updates === 1) {
			  startTime = new Date().getTime();
			} else if (updates === q) {
			      endTime = new Date().getTime();
			      process.stdout.write('Reciving msgs: '+ (updates* percent).toFixed(2) + ' %.  Time elapsed: ' + (endTime - startTime) + ' ms');
			} else {
			      process.stdout.write('Reciving msgs: '+ (updates* percent).toFixed(2) + ' %.            \033[0G');
			//console.log(updates);
			}
                    });
                }
            });
            setInterval(function () {
                updates = 0;
                console.log('\nCounter of messages reseted.');
            }, refreshUpdatesInterval);
        } else {
		process.stdout.write('Load reached :' + (i * percent).toFixed(2) + '%         \033[0G');
		i++;
	}
    }, stepIntervalTime);


};

testLoadWithInterval(1);

