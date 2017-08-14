import datetime
import hashlib

import interfaces
import pymongo


class Users(interfaces.Plugin):
    """
    Plugin for the user-collection.
    All mongoDB-users are stored in admin.system.users.
    However regular users are created for the argotario-database,
    and users with administrative function, such as the user-manager are
    created for admin.system.users. Sounds complicated, but is not...
    (If you go to the argotario-database and enter: db.users.add('test-user'),
    this user is stored in admin.system.users, but with a reference to argotario.)
    ---IH: This doesn't make much sense to me...
    """

    def __init__(self, database):
        self.database = database
        self.public_endpoint = ['get_public_endpoint', 'get_by_id', 'get_by_id_list', 'get_all',
                                'get_random', 'vote', 'get_following', 'get_followers',
                                'get_ranking', 'get_global_highscore', 'get_weekly_highscore',
                                'get_mturk_code']

    def insert(self, name, pwd, email, lang):
        """
        registers a new user with given name and password
        """
        user = None
        print('Debugging self.caller: ', self.caller)
        if not hasattr(self, 'caller') or self.caller['_id'] == 'admin.default':
            customData = {
                'signUpDate': str(datetime.datetime.now()),
                'points': 0,
                'progress': {},
                'out_follow': [],
                'language': lang,
                'emailAddress': email
            }
            roles = [{'role': 'registered', 'db': 'argotario'}]
            write_concern = {'w': 'majority', 'wtimeout': 5000}
            try:
                w_result = self.database.command('createUser', name, pwd=pwd, customData=customData,
                                                 roles=roles, writeConcern=write_concern)
            except pymongo.errors.DuplicateKeyError:
                return None
            user = self.get_user(name)
        return user

    def auth(self, user, passwd_plain):
        """
        authenticates a regular argotario-user when he tries to login with given credentials
        """
        try:
            self.database.authenticate(user, passwd_plain)
            return True
        except pymongo.errors.OperationFailure:
            return False

    def admin_auth(self, user, passwd_plain):
        """
        authenticates an admin-user, such as the user-manager
        """
        try:
            self.database.client.admin.authenticate(user, passwd_plain)
            return True
        except pymongo.errors.OperationFailure:
            return False

    def logout(self):
        """
        logs a user out of the database-client-instance and thereby out of the game
        """
        return self.database.logout()

    def get_user(self, name, admin=False):
        """
        returns a user, either a regular argotario-user or an admin, if the admin-flag is true
        """
        user_info = None
        if admin is False:
            users_info = self.database.command('usersInfo', name)
        else:
            users_info = self.database.client.admin.command('usersInfo', name)

        if users_info['users']:
            return users_info['users'][0]
        return None

    def user_to_hash_code(self, user):
        """
        transforms a user-document into a hash-code.
        This code was used for the MTURK-HIT
        """
        customData = user['customData']
        hashable = bytes(customData['signUpDate'] + user['_id'], 'utf-8')
        hashed = hashlib.sha256(hashable)
        return hashed.hexdigest()

    def get_mturk_code(self, p={}):
        """
        gets the mturk_code of the session-owner
        """
        code = self.user_to_hash_code(self.caller)
        return code

    def get_user_by_mturk_code(self, code):
        """
        returns the user matching the hash-code.
        theoretically multiple users can match the hash-code,
        but in fact the change is neglectable
        """
        all_users = self.get_all()
        for user in all_users:
            other_code = self.user_to_hash_code(user)
            if code == other_code:
                return user
        return None

    def get_following(self, name):
        """
        returns the users which the user with given name follows
        """
        user = self.get_user(name)
        assert user
        query = []
        for user in user['customData']['out_follow']:
            query.append({'user': user, 'db': 'argotario'})
        if query:
            users_info = self.database.command('usersInfo', query)
            return users_info['users'] or None
        return None

    def get_followers(self, name):
        """
        get the users following the user with given name
        """
        followers = []
        users = self.get_all()
        for user in users:
            if name in user['customData']['out_follow']:
                followers.append(user)
        return followers or None

    def set_follow(self, name):
        """
        adds a user to the follow-list of the session-owner
        """
        customData = self.caller['customData']
        customData['out_follow'].append(name)
        self.database.command('updateUser', self.caller['user'], customData=customData)
        return self.caller

    def set_unfollow(self, name):
        """
        removes a user from the follow-list of the session-owner
        """
        customData = self.caller['customData']
        customData['out_follow'].remove(name)
        self.database.command('updateUser', self.caller['user'], customData=customData)
        return self.caller

    def update_fields(self, update):
        """
        updates the customData-field of the session-owner.
        customData stores data like points, gameProgress
        """
        customData = self.caller['customData']
        self.write('UPDATE IS ' + str(update))
        self.write('CUSTOM DATA IS ' + str(customData))
        for key in update:
            customData[key] = update[key]
        self.write('CUSTOM DATA IS')
        self.write(str(customData))
        self.database.command('updateUser', self.caller['user'], customData=customData)
        return self.caller

    def get_weekly_highscore(self, p):
        """
        returns the weekly highscore dictionary, starting monday of each weak
        the result-dict contains the ten best players this week,
        the overall number of users, as well as the result of the session-owner
        """
        res = {}
        all_users = list(self.get_all())
        for user in all_users:
            start_points = self.plugins['pointsOverTime'].get_last_sunday_points(user['user'])
            if start_points is None:
                user['customData']['points'] = 0
            else:
                user['customData']['points'] -= start_points
        all_users = sorted(all_users, key=lambda k: k['customData']['points'], reverse=True)

        res['top'] = all_users[0:10]
        res['users_count'] = len(all_users)

        caller_in_list = False
        for i, user in enumerate(res['top']):
            if user['user'] == self.caller['user']:
                caller_in_list = True
            user['ranking'] = i + 1

        if caller_in_list is False:
            res['user'] = self.get_ranking(all_users=all_users)
        return res

    def get_global_highscore(self, p):
        """
        Analogous to the weekly-highscore, but is not reset every Monday
        """
        res = {}
        all_users = self.get_all()
        all_users = sorted(all_users, key=lambda k: k['customData']['points'], reverse=True)

        res['top'] = all_users[0:10]
        res['users_count'] = len(all_users)

        caller_in_list = False
        for i, user in enumerate(res['top']):
            if user['user'] == self.caller['user']:
                caller_in_list = True
            user['ranking'] = i + 1

        if caller_in_list is False:
            res['user'] = self.get_ranking(all_users=all_users)
        return res

    def get_ranking(self, p={}, all_users=None):
        """
        calculates the ranking of one user.
        This method can already take a list with all-users,
        so that an additional db-query can probably be prevented
        """
        name = None
        if not 'id' in p:
            name = self.caller['user']
        else:
            name = p['id']

        ladder = all_users or sorted(self.get_all(), key=lambda k: k['customData']['points'],
                                     reverse=True)
        ranking = 1;
        for user in ladder:
            if user['user'] == name:
                user['ranking'] = ranking
                return user
            ranking = ranking + 1
        return None

    def get_by_id(self, p):
        """
        returns a user by id, i.e. the username
        """
        assert 'id' in p
        return self.get_user(p['id'])

    def get_by_id_list(self, p):
        pass

    def get_all(self):
        """
        returns all users.
        TODO: CHECK IF A USER CAN ACCESS THE PASSWORDS OF ALL OTHERS HERE!!!!!
        SHOULD BE PREVENTED BY THE ACCESS_RIGHTS, BUT NOT SURE...
        """
        users_info = self.database.command('usersInfo')
        return users_info['users'] or None

    def vote(self):
        """
        todo, save votings on user-properties
        """
        pass


def getHandler(database):
    return Users(database)
