var alljoyn = require('alljoyn');
var greenBean = require("green-bean");

console.log("Test loading alljoyn bus...", alljoyn);
var sessionId = 0;
var portNumber = 27;
var advertisedName = "org.alljoyn.bus.samples.chat.test";
var bus = alljoyn.BusAttachment("chat");
var inter = alljoyn.InterfaceDescription();
var listener = alljoyn.BusListener(
  function(name){
    console.log("FoundAdvertisedName", name);
    sessionId = bus.joinSession(name, portNumber, 0);
    console.log("JoinSession "+sessionId);
  },
  function(name){
    console.log("LostAdvertisedName", name);
  },
  function(name){
    console.log("NameOwnerChanged", name);
  }
);
var portListener = alljoyn.SessionPortListener(
  function(port, joiner){
    console.log("AcceptSessionJoiner", port, joiner);
    return port == portNumber;
  },
  function(port, sId, joiner){
    sessionId = sId;
    console.log("SessionJoined", port, sessionId, joiner);
    setTimeout(function(){
      chatObject.signal(null, sessionId, inter, "Chat", "Hello, I am the host!");
    }, 1000);
  }
);

console.log("CreateInterface "+bus.createInterface("org.alljoyn.bus.samples.chat", inter));
console.log("AddSignal "+inter.addSignal("Chat", "s",  "msg"));
bus.registerBusListener(listener);

console.log("Start "+bus.start());
var chatObject = alljoyn.BusObject("/chatService");
console.log("chat.AddInterface "+chatObject.addInterface(inter));
console.log("RegisterSignalHandler "+bus.registerSignalHandler(chatObject, function(msg, info){
  // console.log("Signal received: ", msg, info);
  console.log(msg["0"]);
}, inter, "Chat"));
console.log("RegisterBusObject "+bus.registerBusObject(chatObject));
console.log("Connect "+bus.connect());

console.log("RequestName "+bus.requestName(advertisedName));
console.log("BindSessionPort "+bus.bindSessionPort(27, portListener));
console.log("AdvertiseName "+bus.advertiseName(advertisedName));



var M2X = require("m2x");
var exec = require("child_process").exec;

var API_KEY = "7f0431d9f10fa14f1e620a9faf5906f5";
var FEED    = "1dd63f44f5d94bdbfde7a26926c30502";

var m2x_client = new M2X(API_KEY);

function sendDataToM2X(data) {
  m2x_client.feeds.updateStream(FEED, "end-of-cycle-times", {value: data.toString()});
}

function sendTimeStamp() {
  sendDataToM2X(new Date().getTime());
}

function sendSubCycleDataToM2X(data) {
  m2x_client.feeds.updateStream(FEED, "sub-cycles", {value: data.toString()});
}

function sendSelectedCycleDataToM2X(data) {
  m2x_client.feeds.updateStream(FEED, "selected-cycles", {value: data.toString()});
}

function sendTimeStamp() {
  sendDataToM2X(new Date().getTime());
}




var greenBean = require("green-bean");

greenBean.connect("laundry", function (laundry) {
  console.log('Connected to laundry');

  laundry.remoteStart = laundry.erd({
    erd: 0x201E,
    endian: "big",
    format: "UInt8"
  });

  laundry.cycle = laundry.erd({
    erd: 0x201F,
    endian: "big",
    format: "UInt8"
  });

  laundry.light = laundry.erd({
    erd: 0x2020,
    endian: "big",
    format: "UInt8"
  });


  var notRunningSubCycle = 0;
  var lastSubCycle = notRunningSubCycle;
  laundry.machineSubCycle.subscribe(function(value) {
    console.log("sub-cycle: " + value);

    if(value !== notRunningSubCycle && lastSubCycle === notRunningSubCycle) {
      console.log("cycle started");
    }

    lastSubCycle = value;

    sendSubCycleDataToM2X(value);
  });

  laundry.endOfCycle.subscribe(function (value) {
    console.log("eoc value: " + value)
  	if(value === 1) {
      console.log("cycle ended");
      chatObject.signal(null, sessionId, inter, "Chat", 'end of cycle');
      sendTimeStamp();
  	}
  });

  laundry.cycleSelected.subscribe(function(value) {
    console.log("cycle selected: " + value);
    sendSelectedCycleDataToM2X(value);
  });

  bus.registerSignalHandler(chatObject, function(msg, info){
    msg = msg[0]
    msg.split(';').forEach(function(msg) {
      console.log('Received message: ' + msg)

      if(msg === 'start') {
        laundry.remoteStart.write(1);
      }
      else if(msg === 'air fluff') {
        console.log('setting air fluff');
        laundry.cycle.write(10);
      }
      else if(msg === 'light on') {
        laundry.light.write(1);
      }
      else if(msg === 'light off') {
        laundry.light.write(0);
      }
    })
  }, inter, "Chat");
});


var readline = require('readline');
readline.createInterface({
  input: process.stdin,
  output: process.stdout
}).on('line', function(line){
    chatObject.signal(null, sessionId, inter, "Chat", line);
})
