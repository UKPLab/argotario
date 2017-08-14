import interfaces


class Domains(interfaces.Plugin):
    """
    Plugin for the domain-collection
    """

    def get_by_topic(self, topic):
        """
        returns a domain for a given topic-document
        """
        if not 'out_belongsTo' in topic:
            return None
        return self.domains.find({"_id": { '$in' : topic['out_belongsTo']}})

def getHandler(database):
    """
    a function instantiating and returning this plugin
    """
    return Domains(database, 'domains')
