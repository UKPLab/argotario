// adds a language field to each topic (default value is English)

db = connect('localhost:27017/admin');
db.auth('admin','some_randomly_generated_safe_password');
db = db.getSiblingDB('argotario');

db.getCollection("topics").updateMany({'out_language': {$exists : false}}, {$set: {'out_language': 'en'}});
db.getCollection("arguments").updateMany({'out_language': {$exists : false}}, {$set: {'out_language': 'en'}});
db.getCollection("sessions").updateMany({'out_language': {$exists : false}}, {$set: {'out_language': 'en'}});
