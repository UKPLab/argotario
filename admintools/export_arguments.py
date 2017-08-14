import pymongo

print("Make sure you have UTF-8 encoding on the machine: $ export LC_ALL='en_US.utf8'")

db = pymongo.MongoClient('localhost', 27017)
db.admin.authenticate('admin', 'some_randomly_generated_safe_password')
argotario = db.argotario

# load fallacies
fallacies = list(argotario.fallacies.find())
fallacy = {}
for f in fallacies:
    fallacy[f['_id']] = f['title']['en']

# load topics
topics = list(argotario.topics.find({'out_language': 'de'}))
topic = {}
for t in topics:
    topic[t['_id']] = t['title']

# find all German arguments written by players (without the start data)
arguments = list(
    argotario.arguments.find({'out_language': 'de', '_author': {'$ne': 'AdminComposer2'}}))

with open('arguments.csv', 'w') as csv:
    # write column headers
    csv.write("#")
    csv.write("\t")
    csv.write("Mongo ID")
    csv.write("\t")
    csv.write("Time")
    csv.write("\t")
    csv.write("Author")
    csv.write("\t")
    csv.write("Topic")
    csv.write("\t")
    csv.write("Stance")
    csv.write("\t")
    csv.write("Intended Fallacy")
    csv.write("\t")
    csv.write("Voted Fallacy")
    csv.write("\t")
    csv.write("Number of Votings")
    csv.write("\t")
    csv.write("Text")
    csv.write("\t")
    csv.write("Length (Words)")
    csv.write("\t")
    csv.write("Length (Characters)")
    csv.write("\n")

    # write data
    i = 0
    for arg in arguments:
        i += 1
        csv.write(str(i))  # id
        csv.write("\t")
        csv.write(str(arg['_id']))  # mongo id
        csv.write("\t")
        csv.write(arg['_timestamp'][0:19])  # time
        csv.write("\t")
        csv.write(arg['_author'])  # author
        csv.write("\t")
        csv.write(topic[arg['out_refersTo']])  # topic
        csv.write("\t")
        csv.write(str(arg['stance']))  # stance
        csv.write("\t")
        csv.write(str(fallacy[arg['fallacyId']]))  # intended fallacy
        csv.write("\t")
        csv.write(
            fallacy[arg['out_fallacyType']] if ('out_fallacyType' in arg) else "-")  # gold fallacy
        csv.write("\t")
        csv.write(str(len(arg['votings']['fallacyId'])) if (
        'votings' in arg) else "0")  # number of votings
        csv.write("\t")
        csv.write(str(arg['components'][0]['body']))  # text
        csv.write("\t")
        csv.write(str(arg['components'][0]['body'].count(" ") + 1))  # length (words)
        csv.write("\t")
        csv.write(str(len(arg['components'][0]['body'])))
        csv.write("\n")

print('Written ' + str(i) + ' arguments.')
