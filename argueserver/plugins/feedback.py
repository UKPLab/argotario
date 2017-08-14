import interfaces

class SpamReports(interfaces.Plugin):
    """
    the plugin for the spamReports collection.
    """
    pass


def getHandler(database):
    """
    a function instantiating and returning this plugin
    """
    return SpamReports(database, 'feedback', public_endpoint_extensions=['insert'])
