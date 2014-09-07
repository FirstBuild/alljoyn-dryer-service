var alljoyn = require('alljoyn');

// var serviceName = "com.firstbuild.appliancecontrol.dryer.chat"
var serviceName = "org.alljoyn.bus.samples.chat.test";

console.log("Test loading alljoyn bus...", alljoyn);
var sessionId = 0;
var portNumber = 27;
var advertisedName = serviceName;
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
      return true;
  },
  function(port, sessionId, joiner){
    console.log("SessionJoined", port, sessionId, joiner);
  }
);

bus.createInterface(serviceName, inter);
inter.addSignal("Chat", "s",  "msg");
bus.registerBusListener(listener);
bus.start();
var chatObject = alljoyn.BusObject("/chatService");
chatObject.addInterface(inter);
bus.registerSignalHandler(chatObject, function(msg, info){
  // console.log("Signal received: ", msg, info);
  console.log(msg["0"]);
}, inter, "Chat");

bus.registerBusObject(chatObject);
bus.connect();
bus.findAdvertisedName(serviceName);

var readline = require('readline');
readline.createInterface({
  input: process.stdin,
  output: process.stdout
}).on('line', function(line){
    chatObject.signal(null, sessionId, inter, "Chat", line);
})
