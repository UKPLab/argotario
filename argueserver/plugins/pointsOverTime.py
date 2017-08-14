from datetime import date, timedelta
import interfaces

class PointsOverTime(interfaces.Plugin):
    """
    plugin for the pointsOverTime-collection
    """

    def get_last_sunday_points(self, user):
        """
        in order to get the points from last sunday for the player of the week ranking,
        one needs the first pointsOverTime greater than sunday.
        """
        today = date.today()
        delta = today.weekday()
        monday = today - timedelta(days=delta)
        user_points = self.pointsOverTime.find({'_author' : user, '_timestamp' : {'$gte' : str(monday)}}).sort('_timestamp')
        if user_points.count() > 0:
            return user_points[0]['points']
        return None


def getHandler(database):
    """
    a function instantiating and returning this plugin
    """
    return PointsOverTime(database, 'pointsOverTime', public_endpoint_extensions=['insert'])
