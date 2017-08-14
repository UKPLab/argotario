// outputs a list of topics (tab separated to paste into a spreadsheet)

db = connect('localhost:27017/admin');
db.auth('admin','some_randomly_generated_safe_password');
db = db.getSiblingDB('argotario');

var cursor = db.getCollection('topics').find({});
while(cursor.hasNext()){
    var topic = cursor.next();
    var domain = db.getCollection('domains').findOne({'_id': topic.out_belongsTo[0]});
    //print(topic.title);
    //print(domain.title.en);
    print(topic.title + "\t" + domain.title.en);
}
