// adds topics from the file "topics.txt"; this file must contain one topic per line and nothing else

db = connect('localhost:27017/admin');
db.auth('admin','some_randomly_generated_safe_password');
db = db.getSiblingDB('argotario');

/*
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
*/

function getDomainIdByGermanName(domains, name){
  ddoc = domains.findOne({'title.de': name});
  return ddoc._id;
}

db.getCollection("domains").update({"title.de":"Pädagogik"},{"$set":{"title.de":"Bildung"}});

var language = "de";
var content = cat("topics.txt");

db.getCollection("topics").remove({"out_language":language});

var lines = content.split("\n");
for(var i = 0; i < lines.length; i++){
  var line = lines[i];

  if (line.trim() == "")
    continue;

  var fields = line.split('\t');
  var topic = fields[0];
  var domain = getDomainIdByGermanName(db.getCollection('domains'), fields[1].trim());
  var id = "t"+(i+1).toString();

  var doc = {
    '_id': id,
    'title': topic,
    '_author': 'AdminComposer2',
    '_timestamp': Date(),
    'out_language': language,
    'out_belongsTo': [domain]
  };
  db.getCollection("topics").insert(doc);
  print(topic);
}
