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

  laundry.endOfCycle.subscribe(function (value) {
    console.log("eoc value: " + value)
  	if(value === 1) {
      chatObject.signal(null, sessionId, inter, "Chat", 'end of cycle');
  	}
  });

  bus.registerSignalHandler(chatObject, function(msg, info){
    msg = msg[0]
    console.log('Received message: ' + msg)

    if(msg === 'start') {
      laundry.remoteStart.write(1);
    }
    else if(msg === 'air fluff') {
      console.log('setting air fluff');
      laundry.cycle.write(10);
    }
  }, inter, "Chat");
});


var readline = require('readline');
readline.createInterface({
  input: process.stdin,
  output: process.stdout
}).on('line', function(line){
    chatObject.signal(null, sessionId, inter, "Chat", line);
})
