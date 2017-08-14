// outputs a highscore list for the given time period

db = connect('localhost:27017/admin');
db.auth('admin','some_randomly_generated_safe_password');
db = db.getSiblingDB('argotario');

// define the relevant time peroid here:
if(typeof dateFrom !== 'undefined'){
  dateFrom = new Date(dateFrom);
  dateTo = new Date(dateTo);
} else {
  dateFrom = new Date("2016-01-31");
  dateTo = new Date("2016-02-28");
}

var candidatesAfter = {};
var candidatesBefore = {};
var candidates = {};

var cursor = db.getCollection('pointsOverTime').find({}).sort({'_timestamp': 1});
while(cursor.hasNext()){
    var p = cursor.next();
    var date = new Date(p._timestamp.substring(0,10));
    if(date > dateTo){
        continue;
    } else if(date < dateFrom){
        candidatesBefore[p._author] = p.points;
    } else {
        candidatesAfter[p._author] = p.points;
    }
}


//print("before: " + tojson(candidatesBefore));

//print("after: " + tojson(candidatesAfter));

for(var user in candidatesAfter){
    if(candidatesAfter[user] == 0)
       continue;
    if(!(user in candidatesBefore))
        candidates[user] = candidatesAfter[user];
    else if(candidatesAfter[user] > candidatesBefore[user])
        candidates[user] = candidatesAfter[user] - candidatesBefore[user];
}

//print("result: " + tojson(candidates));

users = [];
for(var user in candidates)
    users.push(user);
var sortedUsers = users.sort(function(a,b){return candidates[b]-candidates[a]});

/*
print("highscore list: ");
sortedUsers.forEach(function(user, i){
    print((i+1) + " " + user + " " + candidates[user]);
});
*/

var highscoreList = [];
sortedUsers.forEach(function(user, i){
	highscoreList.push({rank: i+1, name: user, score: candidates[user]});
});
print(tojson(highscoreList));
