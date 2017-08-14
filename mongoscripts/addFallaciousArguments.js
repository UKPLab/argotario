// adds fallacious arguments from the file "arguments.txt"; this file must contain one argument per line and nothing else

db = connect('localhost:27017/admin');
db.auth('admin','some_randomly_generated_safe_password');
db = db.getSiblingDB('argotario');

function generateUUID() { // Source: stackoverflow.com, License: Public Domain/MIT
    var d = new Date().getTime();
    if (typeof performance !== 'undefined' && typeof performance.now === 'function'){
        d += performance.now(); //use high-precision timer if available
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = (d + Math.random() * 16) % 16 | 0;
        d = Math.floor(d / 16);
        return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
}

function getFallacyIDFromName(name){
  if (name == "Appeal to Emotion")
    return "732fcccb-a657-44bd-ba4a-185e85325b51";
  if (name == "Red Herring")
    return "e04540d3-d537-4d74-bfcb-adfe2778708a";
  if (name == "Hasty Generalization")
    return "05dcbf4e-92be-49ac-9c9f-e3fb982cbe18";
  if (name == "Irrelevant Authority")
    return "0b19922d-2f3c-49ee-bdba-8798c68f130a";
  if (name == "Ad Hominem")
    return "68b7b548-3aa3-4713-a414-01210cefe820";
  if (name == "No Fallacy")
    return "aed81f1b-b190-4076-9f38-601ef9f4b371"

  return null;
}

var language = "de";
var content = cat("arguments.txt");
var lines = content.split("\n");
for(var i = 0; i < lines.length; i++){
  var line = lines[i];

  if (line.trim() == "")
    continue;

  var fields = line.split('\t');
  var topic = fields[0];
  var stance = fields[1];
  var fallacyID = getFallacyIDFromName(fields[2]);
  var text = fields[3];

  var doc = {
    "_id" : generateUUID(),
    "_timestamp" : "2017-03-21 00:00:00.000000",
    "components" : [
        {
            "body" : text,
            "type" : "claim"
        }
    ],
    "stance" : stance,
    "_author" : "AdminComposer2",
    "fallacyId" : fallacyID,
    "context" : false,
    "_editorial" : false,
    "out_refersTo" : topic,
    "out_fallacyType" : fallacyID,
    "out_language" : language
  };
  db.getCollection("arguments").insert(doc);
  print(text);
}
