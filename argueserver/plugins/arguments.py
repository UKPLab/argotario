import interfaces

import random
import pymongo


class Arguments(interfaces.Plugin):
    """
    The plugin for the collection arguments
    """

    #follows the links and resolves them
    def kraken(self, arg):
        """
        get all linked documents and append them to the argument, such as the topic, the domain, the true fallacy-type.
        """
        fallacies = self.plugins['fallacies']
        if not '&refersTo' in arg:
            if 'out_refersTo' in arg:
                topic = self.plugins['topics'].get_by_arg({'arg' : arg});
                arg['&refersTo'] = [topic];
        if not '&fallacyType' in arg:
            if 'out_fallacyType' in arg:
                fallacyType = fallacies.get_fallacy_for_arg(arg)
                arg['&fallacyType'] = fallacyType
        return arg;


    def get_by_topic(self, t_id):
        """
        get all arguments belonging to a topic with given id.
        """
        return self.arguments.find({'out_refersTo' : t_id})


    def get_voted(self, field):
        """
        get all arguments with existing voting on a given field.
        """
        return self.arguments.find({'votings.' + field : {'$exists' : True}})


    def input_filter(self, doc):
        """
        filter which gets applied before an argument-document is inserted into the database.
        If this filter returns false, the argument is not inserted.
        """
        required_fields = ['out_refersTo', 'fallacyId', 'components', 'stance']
        for field in required_fields:
            if field not in doc:
                return False
            if not doc[field]:
                return False

        components = doc['components']
        if len(components) < 1:
            return False

        for comp in components:
            if not ('type' in comp and 'body' in comp):
                return False
            if not (comp['type'] and comp['body']):
                return False

        topic = self.plugins['topics'].get_by_id({'id' : doc['out_refersTo']}, kraken=False);
        if topic is None:
            return False

        return True


    #PUBLIC ENDPOINT
    def fallacy_recognition(self, p):
        """
        method called for the fallacy-recognition round.
        returns an argument with a fallacy-type matching the params difficulty and context
        """

        fallacies = None
        args = None
        difficulty = None

        if 'language' in p:
            language = p['language']
        else:
            language = 'en'

        #get fallacious arguments of type with <= difficulty
        #and fallacies with matching difficulty
        if 'difficulty' in p:
            _filter = {'operator': '<=', 'difficulty': p['difficulty']}
            if 'context' in p and p['context'] is False:
                _filter['context'] = None
            fallacies = self.plugins['fallacies'].get_by_difficulty(_filter);
            args = self.arguments.find({"out_language": language, "out_fallacyType" : {"$in" :  fallacies.distinct('_id')}})
        #get any argument which is supposed to be fallacious
        #and all fallacies, because the args can be of any type
        else:
            _filter = {"out_language": language, "fallacyId" : {"$ne" :  None}}
            if 'context' in p and p['context'] is False:
                _filter['context'] = None
                fallacies = self.plugins['fallacies'].fallacies.find({'context' : None});
            else:
                fallacies = self.plugins['fallacies'].get_all();
            args = self.arguments.find(_filter)

        nr_args = args.count()
        if nr_args == 0:
            return None
        arg = args[random.randrange(0, nr_args)]
        if 'context' in arg and arg['context'] is True:
            sessionP = self.plugins['sessions']
            session = sessionP.get_by_arg(arg['_id'])
            session['&args'] = []
            session['&allFallacies'] = []
            for a_id in session['out_argument'][:session['out_argument'].index(arg['_id'])]:
                session['&args'].append(self.arguments.find_one({'_id' : a_id}))
            session = sessionP.kraken(session)
            arg['in_session'] = session
        else:
            self.kraken(arg)
        arg['&allFallacies'] = list(fallacies)

        return arg;


def getHandler(database):
    """
    a function instantiating and returning this plugin
    """
    return Arguments(database, 'arguments', public_endpoint_extensions=['fallacy_recognition', 'insert'])
