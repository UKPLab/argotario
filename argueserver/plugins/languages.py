from bson import son
import interfaces
import numpy as np
import random


class Languages(interfaces.Plugin):
    """
    Plugin for the languages-collection
    """

    def get_titles(self, p):
        languages = self.languages.find({}, {'title': 1})
        return languages or None


def getHandler(database):
    """
    a function instantiating and returning this plugin
    """
    return Languages(database, 'languages', public_endpoint_extensions=['get_titles'])
