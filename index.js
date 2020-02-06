/*
    Author: Fernando Diaz Smith
    Date: Feb 2020

    Description:
    Super simple App to use the mindwave mobile.
    All it does is connecte to the TCP server provided by the think gear connector and forward the values using OSC.

    Links: 
    - [you need the think gear connector](http://developer.neurosky.com/docs/doku.php?id=thinkgear_connector_tgc)

    Resources: 
    - [thinkgear socket protocol](http://developer.neurosky.com/docs/lib/exe/fetch.php?media=app_notes:thinkgear_socket_protocol.pdf)
    - [ThinkGear Connector Development Guide](http://developer.neurosky.com/docs/lib/exe/fetch.php?media=thinkgear_connector_development_guide.pdf)
*/
var argv = require('minimist')(process.argv.slice(2));
var osc = require("osc");
var net = require('net');
var mindwave = new net.Socket();


var UDP_OPTIONS  = {
    remotePort: argv.port? argv.port : 8081,
    remoteAddress: argv.ip? argv.ip : "127.0.0.1"
}
/**
 * You should NOT change the ones
 */
const TGC = {
    PORT : 13854,
    IP: "127.0.0.1",
}

/* un comment for debugging
for (const key in argv) {
    if (argv.hasOwnProperty(key)) {
        // const element = ;
        console.log(`\t${key} : ${argv[key]}`);
        
    }
}
*/


console.log(`
TGC->TCP->UDP->OSC
Node started`);
console.log(`
Sending OSC messages to: ${UDP_OPTIONS.remoteAddress}:${UDP_OPTIONS.remotePort}\n`);

// on connection you  need to send the TCP server the parameter format you want
var settings = JSON.stringify({"enableRawOutput": false, "format": "Json"});
var autho = JSON.stringify({"appName": "Reset", "appKey": "9f54141b4b4b667c558d3a76cb8d715cbde03096"});

// Create an osc.js UDP Port listening on port 8082
// I'm not sure this is super necessary, in any case we have the ability to listen to UDP  messages.
var udpPort = new osc.UDPPort({
    localAddress: "127.0.0.1",
    localPort: 8082,
    metadata: true
});
 
// In case we do receive messages print them out
udpPort.on("message", function (oscMsg, timeTag, info) {
    console.log("An OSC message just arrived!", oscMsg);
    console.log("Remote info is: ", info);
});
 
// Open the socket.
udpPort.open();
 
 
// Let us know when the port is ready
udpPort.on("ready", function () {
    console.log('udpPort->READY');

});

udpPort.on("close", function () {
    console.log('udpPort->close');
});

// 
mindwave.connect(13854, '127.0.0.1', function() {
    console.log('Connected');
    // mindwave.write(autho);
    mindwave.write(settings);
});



mindwave.on('data', function(data) {
    console.log('Received: ' + data);
    try {
        var eeg = JSON.parse(data);
        // sometime eeg sends the only the blink state
        if(eeg.eSense){
            udpPort.send(   {
                timeTag: osc.timeTag(0), // Schedules this bundle 60 seconds from now.
                packets: [
                    {address: "/eSense/attention",
                    args: [{type: "f",value: eeg.eSense.attention}]},
                    {address: "/eSense/meditation",
                    args: [{type: "f",value: eeg.eSense.meditation}]},
                    { address: "/eegPower/delta",
                    args: [{type: "f",value: eeg.eegPower.delta}]},
                    { address: "/eegPower/theta",
                    args: [{type: "f",value: eeg.eegPower.theta}]},
                    { address: "/eegPower/lowAlpha",
                    args: [{type: "f",value: eeg.eegPower.lowAlpha}]},
                    { address: "/eegPower/highAlpha",
                    args: [{type: "f",value: eeg.eegPower.highAlpha}]},
                    { address: "/eegPower/lowBeta",
                    args: [{type: "f",value: eeg.eegPower.lowBeta}]},
                    { address: "/eegPower/highBeta",
                    args: [{type: "f",value: eeg.eegPower.highBeta}]},
                    { address: "/eegPower/lowGamma",
                    args: [{type: "f",value: eeg.eegPower.lowGamma}]},
                    { address: "/eegPower/highGamma",
                    args: [{type: "f",value: eeg.eegPower.highGamma}]},
                ]
            }, UDP_OPTIONS.remoteAddress, UDP_OPTIONS.remotePort);
        }
    } catch (error) {
        console.warn("Error while parsing the data packet, TBH I don't why but should not be hard to figure out what happen. Look in the try catch " + data);
    }

    // mindwave.destroy(); // kill mindwave after server's response
});

mindwave.on('close', function() {
    console.log('Connection closed');
    setTimeout(function(){
        mindwave.connect(13854, '127.0.0.1', function() {
            console.log('Connected');
            // mindwave.write(autho);
            mindwave.write(settings);
        });
    }, 1000);
});
      


    
/**
 * Example data reveived from mindwave mobile
 * 
 * {
    "eSense": {
    "attention":56,
    "meditation":100
    },
    "eegPower":{
        "delta":208568,
        "theta":47543,
        "lowAlpha":11307,
        "highAlpha":3796,
        "lowBeta":3571,
        "highBeta":3479,
        "lowGamma":1925,
        "highGamma":1622
    },
        "poorSignalLevel":0
    }
 */
