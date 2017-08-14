// renews the fallacy definitions in the database

db = connect('localhost:27017/admin');
db.auth('admin','some_randomly_generated_safe_password');
db = db.getSiblingDB('argotario');

// drop existing definitions
db.getCollection('fallacies').drop();
db.createCollection('fallacies');

// add fallacies
var redHerring = {
    "_id" : "e04540d3-d537-4d74-bfcb-adfe2778708a",
    "definition" : {
        "en" : "The Red Herring Fallacy provides an argument, that draws attention away from the matter being discussed or dealt with.",
        "de" : "Eine Nebelkerze ist ein Argument, das die Aufmerksamkeit vom eigentlichen Thema ablenken soll."
    },
    "title" : {
        "en" : "Red Herring",
        "de" : "Nebelkerze"
    },
    "_author" : "admin",
    "example" : {
        "en" : "In business, arguing against giving raises - “Sure, we haven’t given raises in over five years to our employees. You know, we work really hard to make a good product. We try to ensure the best customer service, too.”",
        "de" : "Die Gewerkschaft fordert eine Lohnerhöhung der Angestellten. Das Unternehmen antwortet: “Es ist wahr, dass die Gehälter seit fünf Jahren nicht erhöht wurden. Wir arbeiten jeden Tag sehr hart daran, unser Produkt besser zu machen."
    },
    "difficulty" : 2,
    "@version" : 4,
    "@rid" : "#34:0",
    "@class" : "fallacies",
    "icon" : "ion-merge",
    "_timestamp" : "2015-07-28T10:33:42.657+0200"
};

var appealToEmotion = {
    "_id" : "732fcccb-a657-44bd-ba4a-185e85325b51",
    "definition" : {
        "en" : "A logical fallacy which uses the manipulation of the recipient's emotions, rather than valid logic, to make a point.",
        "de" : "Man versucht, die Gefühle des Gegenübers und der Zuschauer zu manipulieren, anstatt sachliche Argumente zu verwenden."
    },
    "title" : {
        "en" : "Appeal to Emotion",
        "de" : "Appellieren an Emotionen"
    },
    "_author" : "admin",
    "example" : {
        "en" : "Look at the picture of the girl, her father drinks and beats her. Alcohol should be forbidden (or dont you want to help this child?).",
        "de" : "Schauen Sie sich das Bild von diesem Mädchen an, ihr Vater trinkt und schlägt sie regelmäßig. Wir sollten diesem Mädchen helfen und Alkohol verbieten."
    },
    "difficulty" : 1,
    "@version" : 4,
    "@rid" : "#34:1",
    "@class" : "fallacies",
    "icon" : "ion-heart",
    "_timestamp" : "2015-07-28T10:33:52.661+0200"
};

var hastlyGeneralization = {
    "_id" : "05dcbf4e-92be-49ac-9c9f-e3fb982cbe18",
    "definition" : {
        "en" : "It is assumed, that one part of something has to be applied to all, or other, parts of it; or that the whole must apply to its parts.",
        "de" : "Es wird auf eine kleine Zahl von Beispielen zurückgegriffen, um etwas über die gesamte Gruppe auszusagen."
    },
    "title" : {
        "en" : "Hasty Generalization",
        "de" : "Unzulässige Verallgemeinerung"
    },
    "_author" : "admin",
    "example" : {
        "en" : "Example for Composition: A tiger eats more food than a human being. Therefore, tigers, as a group, eat more food than do all the humans on the earth. Example for Division: Bill lives in a large building, so his apartment must be large.",
        "de" : "Helmut Kohl war korrupt und Wolfgang Schäuble war korrupt. Wie man sieht, ist die CDU eine ziemlich korrupte Partei."
    },
    "difficulty" : 3,
    "@version" : 5,
    "@rid" : "#34:2",
    "@class" : "fallacies",
    "icon" : "ion-aperture",
    "_timestamp" : "2015-07-28T10:34:04.118+0200"
};

var noFallacy = {
    "_id" : "aed81f1b-b190-4076-9f38-601ef9f4b371",
    "definition" : {
        "en" : "This is supposed to be a good and valid argument.",
        "de" : "Das ist ein gutes und schlüssiges Argument, das keine Trugschlüsse enthält."
    },
    "title" : {
        "en" : "No Fallacy",
        "de" : "Kein Trugschluss-Argument"
    },
    "_author" : "admin",
    "difficulty" : 0,
    "@version" : 5,
    "@rid" : "#34:3",
    "@class" : "fallacies",
    "icon" : "ion-checkmark",
    "_timestamp" : "2015-07-28T10:34:25.143+0200"
};

var irrelevantAuthority = {
    "_id" : "0b19922d-2f3c-49ee-bdba-8798c68f130a",
    "definition" : {
        "en" : "It is claimed, that a person is an authority on a subject, therefore a claim is taken as valid. However the person is not a real authority for the subject.",
        "de" : "Eine Person wird mit ihrer Meinung als Autorität für ein Wissensgebiet dargestellt, aber die Person ist gar keine Autorität."
    },
    "title" : {
        "en" : "Irrelevant Authority",
        "de" : "Irrelevante Autorität"
    },
    "_author" : "admin",
    "example" : {
        "en" : "My father said, that immigrants will destroy our economy. We have to close our borders.",
        "de" : "Mein Vater sagt, dass noch mehr Einwanderung unsere Gesellschaft zerstören würde. Wir müssen unsere Grenzen schließen."
    },
    "difficulty" : 2,
    "@version" : 8,
    "@rid" : "#34:4",
    "@class" : "fallacies",
    "icon" : "ion-star",
    "_timestamp" : "2016-01-02T15:27:20.370+0100"
};

var adHominem = {
    "_id" : "68b7b548-3aa3-4713-a414-01210cefe820",
    "definition" : {
        "en" : "When someone argues 'Ad Hominem', he argues against another person, instead of the other person's position.",
        "de" : "Jemand argumentiert 'Ad Hominem', wenn er sein Gegenüber persönlich angreift und nicht dessen Argumente."
    },
    "title" : {
        "en" : "Ad Hominem",
        "de" : "Ad Hominem"
    },
    "_author" : "admin",
    "example" : {
        "en" : "Person A: I want marijuana to be legal. Person B: You Hippie..., go and play on your guitar.",
        "de" : "Person A: Man sollte Marijuana legalisieren. Person B: Du Hippie... spiel einfach weiter auf deiner Gitarre."
    },
    "difficulty" : 1,
    "context" : true,
    "@version" : 8,
    "@rid" : "#34:5",
    "@class" : "fallacies",
    "icon" : "ion-person",
    "_timestamp" : "2016-01-02T15:34:11.385+0100"
};


db.getCollection('fallacies').insertOne(redHerring);
db.getCollection('fallacies').insertOne(appealToEmotion);
db.getCollection('fallacies').insertOne(hastlyGeneralization);
db.getCollection('fallacies').insertOne(noFallacy);
db.getCollection('fallacies').insertOne(irrelevantAuthority);
db.getCollection('fallacies').insertOne(adHominem);
