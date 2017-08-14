"""
The http-server
"""
import socketserver
import sys
import time
import threading
from datetime import datetime, timedelta
import http.server

from bson import objectid

import pymongo
import mace

from plugins import *

import Config


class HTTPServer(socketserver.ThreadingMixIn, http.server.HTTPServer):
    """
    The main http-server which talks to all argotario-users
    """

    def initialize(self, screen):
        """
        the function called after __init__
        in order to conduct initialization
        """
        # holds virtual players, required in order to stop
        self.bot = None
        # indicates whether the dbconnection persists
        self.dbconnection = False
        # reference to the mace_thread. Stops if set to None
        self.mace_t = None
        # the ncurses-screen to write to
        self.screen = screen
        # dictionary of the communication-sessions, has form(token: session).
        # session has the form ({'plugins': [array of plugins], 'user' : dictionary of user})
        self.sessions = {}
        # if True, requesthandler does not write requests to ncurses-screen
        self.requesthandler_muted = False
        # the session used by execute-functions
        while True:
            try:
                self.server_session = self.authenticate('server', 'foobar$', admin=True)
                self.default_session = self.authenticate('default', 'none', admin=True)
                self.dbconnection = True
                break
            except pymongo.errors.ServerSelectionTimeoutError as err:
                time.sleep(10)

    def is_muted_requesthandler(self):
        return self.requesthandler_muted

    # EXECUTE_FUNCTIONS CALLED WHEN USER ENTERS COMMAND - START
    def _exec_mute(self, params):
        self.requesthandler_muted = not self.requesthandler_muted
        self.write('mute ' + str(self.requesthandler_muted))

    def _exec_redeem(self, params):
        """
        redeems a code. This method was used for the MTURK-Survey-code
        """
        if len(params) == 1:
            user = self.server_session['plugins']['users'].get_user_by_mturk_code(params[0])
            if user:
                arguments = list(self.server_session['plugins']['arguments'].get_by_user(user['user']))
                for arg in arguments:
                    krakened_arg = self.server_session['plugins']['arguments'].get_by_id({'id': arg['_id']})
                    self.write(krakened_arg['&refersTo'][0]['title'] + ' :::')
                    self.write(arg['components'][0]['body'])
                self.write(user['user'])
            else:
                self.write('No user found with code: ' + params[0])

    def _exec_status(self, params):
        status = 'MongoDB: '
        connected = 'OFF'
        if self.db_connected():
            connected = 'ON'
        self.write(status + connected)
        status = 'MACE: '
        running = 'OFF'
        if self.mace_t is not None:
            running = 'ON'
        self.write(status + running)

    def _exec_online(self, params):
        status = 'active users: '
        sessions = self.get_all_sessions()
        count = 0
        users = ''
        for key in sessions:
            count += 1
            user = sessions[key]['user']['user']
            users += user + ' '
        self.write('active users: ' + str(count))
        self.write(str(users))

    def _exec_exit(self, params):
        self.shutdown()
        self.server_close()
        self.screen.destroy()
        return True

    def _exec_ls(self, params):
        out = ''
        if len(params) == 0:
            for key in self.server_session['plugins']:
                out += (key + ' ')
            self.write(out)
            return True
        if len(params) >= 1:
            # self.server_session['plugins']
            if params[0] in self.server_session['plugins']:
                documents = self.server_session['plugins'][params[0]].get_all()
                if len(params) >= 2:
                    try:
                        start = int(params[1])
                        end = int(params[2])
                        documents = documents[start:end]
                    except (ValueError, TypeError) as err:
                        self.write_err('ranges must be numbers')
                        return True
                for doc in documents:
                    self.write(str(doc))
            else:
                self.write_err('No such collection!')
            return True
        return False

    def _exec_flush(self, params):
        """
        makes all active game-sessions inactive
        """
        self.server_session['plugins']['sessions'].flush()
        return True

    def _exec_help(self, params):
        cmds = {
            'bot': 'start/stop the virtual player',
            'exit': 'exit this server',
            'flush': 'make all active sessions inactive',
            'ls [(collection)]': 'browse the database',
            'mace': 'start/stop MACE',
            'message [view [key]]': 'set message with key for view',
            'mute': 'mute/unmute the request-messages',
            'redeem [code]': 'redeem a usercode',
            'timeout': 'start/stop a routine checking for timeouted sessions(untested)'
        }
        out = '======================HELP===========================\n'
        for key in cmds:
            out += (key + ': ' + cmds[key] + '\n')
        out += '====================================================='
        self.write(out)

    def _exec_mace(self, params):
        """
        mace start starts the mace-routine,
        and mace stop stops it
        """
        if self.mace_t is None:
            self.mace_t = threading.Thread(target=self.mace_forever)
            self.mace_t.daemon = True
            self.mace_t.start()
            self.write('MACE: ON')
        else:
            self.mace_t = None
            self.write('MACE: OFF')

    def _exec_message(self, params):
        languages = list(self.server_session['plugins']['languages'].get_all())
        if len(params) != 2:
            self.write('Valid form is [[view [key]]]')
            self.write('Example: message add UserProfile remove')
        else:
            view = params[0]
            key = params[1]
            assert len(languages) and 'messages' in languages[0]
            if view in languages[0]['messages'].keys():
                self.write('View exists.')
            else:
                self.write('View does not exist,  want to create it?')
                create_bool = self.read('Create View? (y/n)')
                if create_bool == 'n':
                    return
                else:
                    for lang in languages:
                        lang['messages'][view] = {}
                        # self.server_session['plugins']['languages']
            for lang in languages:
                msg = self.read('Enter ' + lang['title'] + ' Message (' + view + '/' + key + '): ')
                lang['messages'][view][key] = msg
                self.server_session['plugins']['languages'].update_fields(lang['_id'], {'messages': lang['messages']})
                self.write('you wrote ' + str(lang))

    def _exec_timeout(self, params):
        """
        starts a thread which periodically queries sessions for a timeout.
        when a session times out, the inactive player wins automatically
        """
        timeout_t = threading.Thread(target=self.timeout_forever)
        timeout_t.daemon = True
        timeout_t.start()

    # EXECUTE_FUNCTIONS - END

    def mace_forever(self):
        """
        the mace-thread periodically passes the votings to the mace-software
        and links the arguments with the resulting fallacy-types.
        """
        mace_processor = mace.Processor(self.server_session)

        while True and self.mace_t is not None:
            _, predictions = mace_processor.run()

            args_updated = set()
            for tup in predictions:
                a_id = tup[0]['_id']
                self.server_session['plugins']['arguments'].update_fields(a_id, {'out_fallacyType': tup[1]})

                # save ids of updated documents
                args_updated.add(a_id)
                game = self.server_session['plugins']['sessions'].get_by_arg(a_id)
                if game:
                    if game['ticker'] is None and set(game['out_argument']).issubset(args_updated):
                        self.server_session['plugins']['sessions'].set_winner(game['_id'])

            self.write('Updated %d arguments' % len(args_updated))
            time.sleep(Config.MACE_TIMEOUT)

    def write(self, line):
        """
        wrapper function
        write a line to the screen
        """
        self.screen.write(line)

    def read(self, msg):
        """
        wrapper function
        read a line from the screen and write prompt msg
        """
        return self.screen.read(msg)

    def write_err(self, line):
        """
        wrapper function
        write a bold-line to the screen
        """
        self.screen.write(line, 'bold')

    def timeout_forever(self):
        """
        this thread periodically looks for outdated game-sessions.
        When an outdated game-session is found, it is set inactive
        and the player whose turn it was to play loses.
        """
        # get user-session(is not pvp-session)
        session = self.get_session('MACE')
        session_p = session['plugins']['sessions']

        while True:
            # start pvp-session-algorithm
            session = session_p.get_next_timeout()
            if session:
                timestamp = datetime.strptime(session['_timestamp'], '%Y-%m-%d %H:%M:%S.%f')
                timeout = timestamp + timedelta(seconds=Config.SESSION_TIMEOUT)
                self.write('waiting for session to time out: ' + session['_id'])
                self.write(str(timestamp) + '  -> ends at ' + str(timeout))
                now = datetime.now()
                # wait if timeout in the future
                if now < timeout:
                    sleep_delta = (timeout - now).total_seconds()
                    time.sleep(sleep_delta)
                    session_updated = session_p.get_next_timeout()
                    if session['timestamp'] == session_updated['timestamp']:
                        session_p.set_timeout(session)
                else:
                    session_p.set_timeout(session)
            else:
                self.write('sleeping default session_timeout')
                time.sleep(Config.GSESSION_TIMEOUT)

    def authenticate(self, username, password, admin=False):
        """
        authenticates a user to the database.
        if the authentication is successful, a new session-object is returned,
        consisting of a db_client and the plugins.
        the new session is saved, except for admin-sessions(used by server),
        because the server stores a reference itself.
        """
        new_session = self._new_session(save=not admin)

        user_p = new_session['plugins']['users']
        auth = False
        if admin is True:
            auth = user_p.admin_auth(username, password)
        else:
            auth = user_p.auth(username, password)

        if auth:
            existing_session = self._get_existing_session(username, admin)
            if existing_session is not None:
                self.delete_session(existing_session)

            user = user_p.get_user(username, admin)
            new_session['user'] = user
            for plugin in list(new_session['plugins'].values()):
                plugin.set_caller(user)
                plugin.set_screen(self.screen)

            return new_session

        else:
            self.delete_session(new_session)
            return None

    def get_all_sessions(self):
        return self.sessions

    def get_session(self, token):
        """
        returns an existing session with equal token
        """
        if token in self.sessions:
            return self.sessions[token]
        else:
            return None

    def get_session_by_user(self, username):
        """
        returns an existing session belonging to user with given username
        """
        for token in self.sessions:
            session = self.sessions[token]
            if session['user'] and session['user']['user'] == username:
                return session
        return None

    def get_default_session(self):
        """
        returns the default-session used by unauthorized users.
        Is not saved in the session-list.
        """
        return self.default_session

    def server_close(self):
        """
        gets called when the server is shutdown; deletes all sessions.
        """
        to_del = list(self.sessions.keys())
        for key in to_del:
            session = self.sessions[key]
            self.delete_session(session)
        return super(HTTPServer, self).server_close()

    def delete_session(self, session):
        """
        deletes a session, e.g. if user logs out or the server is shutdown
        """
        key = session['token']
        if key in self.sessions:
            self.write('deleting existing session: ' + key)
            session = self.sessions[key]
            session['plugins']['users'].logout()
            session['db_client'].close()
            del self.sessions[key]
            return True
        else:
            self.write('existing session could not get deleted: ' + key)
            return False

    def db_connected(self):
        """
        returns the status of the database-connection,
        i.e. either true or false
        """
        return self.dbconnection

    def _get_existing_session(self, username, admin=False):
        """
        returns an existing session for a user with given username.
        if admin is true, a user from database admin.system.users is searched
        otherwise the user is created for the argotario-database
        """
        for key in self.sessions:
            session = self.sessions[key]
            if session['user'] is not None:
                user = session['user']
                if user['user'] == username and ((user['db'] == 'admin') is admin):
                    self.write('existing session: ' + username)
                    return session
        return None

    def _new_session(self, custom_key=None, user=None, save=True):
        """
        creates a new session with a random- or a custom-key/token.
        a session consists of the plugins, a token, the user and the db_client
        """
        db_client = pymongo.MongoClient(Config.HOST, Config.PORT, serverSelectionTimeoutMS=500)
        try:
            db_client.server_info()
        except pymongo.errors.ServerSelectionTimeoutError as err:
            self.write_err('Connection to mongoDB was not successfull!')
            raise

        plugins = {}
        for plugin_str in sys.modules['plugins'].__all__:
            module = sys.modules['plugins.' + plugin_str]
            plugin = module.getHandler(db_client.argotario)
            plugins[plugin_str] = plugin
            plugin.set_plugins(plugins)

        token = custom_key or str(objectid.ObjectId())
        session = {
            'plugins': plugins,
            'token': token,
            'user': user,
            'db_client': db_client
        }
        # save session if this is not the default-session,
        # used by anonymous users
        if save:
            self.sessions[token] = session
        return session

    def get_data_collection_overview(self):
        return self.server_session['plugins']['arguments'].get_all().count()
