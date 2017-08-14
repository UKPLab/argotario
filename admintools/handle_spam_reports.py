import pymongo

def loadFallacies(fallaciesCollection):
    fallacies = {'unknown':'Unknown'}
    fallacyList = list(fallaciesCollection.find())
    for fallacy in fallacyList:
        fallacies[fallacy['_id']] = fallacy['title']['en']
    return fallacies

mongo = pymongo.MongoClient('localhost', 27017)
mongo.admin.authenticate('admin','some_randomly_generated_safe_password')
argotario = mongo.argotario
spamReports = argotario.spamReports
fallacies = loadFallacies(argotario.fallacies)

def deleteReport(report):
    spamReports.remove({'_id': report['_id']})

def deleteArgument(argid):
    argotario.sessions.remove({'out_argument':argid})
    argotario.arguments.remove({'_id':argid})

def changeGoldLabel(argid, newGoldLabel):
    argotario.arguments.update({'_id':argid}, {'$set':{'out_fallacyType': newGoldLabel}})

def duringFallacyInformation(report):
    if 'fallacies' in report['roundData']:
        return True
    else:
        return False

def duringFallacyComposition(report):
    if 'loading' in report['roundData']:
        return True
    else:
        return False

def duringFallacyRecognition(report):
    if 'claimedFallacy' in report['roundData']:
        return True
    else:
        return False

def duringJudgeOrSession(report):
    if 'session' in report['roundData']:
        return True
    else:
        return False

def displayArgumentFR(report):
    print("")
    print('--------------------------------------------------')
    # reporter name
    print("Reported by: " + report['_author'])
    # stance
    print("Stance: " + report['roundData']['argument']['stance'])
    # argument text
    print(report['roundData']['argument']['components'][0]['body'])
    # fallacy type by gold label
    if 'out_fallacyType' in report['roundData']['argument']:
        print("Fallacy type by gold label: " + fallacies[report['roundData']['argument']['out_fallacyType']])
    else:
        print("Fallacy type by gold label: Unknown")
    # fallacy type by reporter
    print("Fallacy type by reporter: " + fallacies[report['roundData']['argument']['fallacyId']])
    # fallacy type by author
    print("Fallacy type by author: " + fallacies[report['roundData']['claimedFallacy']])

def promptDecisionFR(report):
    argid = report['roundData']['argument']['_id']
    print("~~~~~")
    print("Please select an action:")
    print("(1) Delete argument (and corresponding session) from database.")
    print("(2) Change gold label to reporter's guess.")
    print("(3) Change gold label to author's claim.")
    print("(4) Do nothing and delete report.")
    print("(5) Do nothing and decide later.")
    print("~~~~~")
    selection = int(input('Type the number: '))
    if selection == 1:
        deleteArgument(argid)
        deleteReport(report)
    elif selection == 2:
        changeGoldLabel(argid, report['roundData']['argument']['fallacyId'])
        deleteReport(report)
    elif selection == 3:
        changeGoldLabel(argid, report['roundData']['claimedFallacy'])
        deleteReport(report)
    elif selection == 4:
        deleteReport(report)

def displayArgumentsJS(report):
    print("")
    print('--------------------------------------------------')
    # reporter name
    print("Reported by: " + report['_author'])
    for i, arg in enumerate(report['roundData']['args']):
        print(str(i+1) + ") -> " + arg['components'][0]['body'])

def promptDecisionJS(report):
    numargs = len(report['roundData']['args'])
    print("~~~~~")
    print("Please select an action:")
    for i, arg in enumerate(report['roundData']['args']):
        print("("+str(i+1)+") Delete argument "+str(i+1)+" and session.")
    print("("+str(numargs+1)+") Delete all arguments and session.")
    print("("+str(numargs+2)+") Do nothing and delete report.")
    print("("+str(numargs+3)+") Do nothing and decide later.")
    print("~~~~~")
    selection = int(input('Type the number: '))
    if selection > 0 and selection <= numargs:
        deleteArgument(report['roundData']['args'][selection-1]['_id'])
        deleteReport(report)
    elif selection == numargs+1:
        for arg in report['roundData']['args']:
            deleteArgument(arg['_id'])
        deleteReport(report)
    elif selection == numargs+2:
        deleteReport(report)

reports = list(spamReports.find())
for report in reports:
    if duringFallacyInformation(report):
        print("Deleting spam report during fallacy information.")
        deleteReport(report)
    elif duringFallacyComposition(report):
        print("Deleting spam report during fallacy composition")
        deleteReport(report)
    elif duringFallacyRecognition(report):
        displayArgumentFR(report)
        promptDecisionFR(report)
    elif duringJudgeOrSession(report):
        displayArgumentsJS(report)
        promptDecisionJS(report)
    else:
        print("Spam report during unknown controller. Skipping.")

print("No spam report left to handle. Exiting.")
