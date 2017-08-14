import interfaces


class Events(interfaces.Plugin):
    """
    plugin for the events-collection
    """
    pass

def getHandler(database):
    """
    a function instantiating and returning this plugin
    """
    return Events(database, 'events', public_endpoint_extensions=['insert'])


