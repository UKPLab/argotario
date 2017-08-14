import random

import interfaces

class Topics(interfaces.Plugin):
    """
    Plugin for the topics-collection
    """

    def kraken(self, topic):
        """
        get all linked documents and append them to the topic, in this case only the domain
        """
        if not '&belongsTo' in topic:
            domains = self.plugins['domains'].get_by_topic(topic);
            nr_domains = domains.count()
            if (nr_domains > 0):
                domain = domains[random.randrange(0, nr_domains)]
                topic['&belongsTo'] = [domain];
        return topic;


    def get_by_arg(self, p):
        """
        returns the topic linked to an argument-document passed as parameter
        """
        assert 'arg' in p

        arg = p['arg']
        if not 'out_refersTo' in arg:
            return None
        topic = self.topics.find_one({"_id": arg['out_refersTo']})
        self.kraken(topic)

        return topic


def getHandler(database):
    """
    a function instantiating and returning this plugin
    """
    return Topics(database, 'topics')
