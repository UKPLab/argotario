import Config

import http.server
import json
import os
import time
import urllib.parse

from pymongo import cursor


class REST(http.server.BaseHTTPRequestHandler):
    """
    The RequestHandler-class gets instantiated once per HTTP-request and handles it.
    Every HTTP-request is passed to the related HTTP Method handler.
    A GET-Request gets passed to the do_GET-method, and so on.
    Then the url and headers are parsed and the related interface-function called
    with the extracted parameters.
    """

    #HTTP-METHOD-HANDLERS
    def do_GET(self):
        self._set_session()
        parsed = urllib.parse.urlparse(self.path)
        path = parsed[2]
        query = self._remove_array(urllib.parse.parse_qs(parsed[4]))
        self._handle_path(path, query)


    def do_POST(self):
        self._set_session()

        parsed = urllib.parse.urlparse(self.path)
        path = parsed[2]
        body = self._get_body()
        self._handle_path(path, body)


    def do_PUT(self):
        self._set_session()

        parsed = urllib.parse.urlparse(self.path)
        path = parsed[2]
        body = self._get_body()
        self._handle_path(path, body)


    def do_DELETE(self):
        self._set_session()

        parsed = urllib.parse.urlparse(self.path)
        path = parsed[2]
        self._handle_path(path, None)


    def log_message(self, format, *args):
        """
        overwrites the log_message function of the BaseHTTPRequestHandler.
        prevents unnecessary output.
        """
        return



    #HELPER FUNCTIONS
    def _create_response(self, result, data, code):
        self.send_response(200)
        self.send_header("Content-type", "application/json")
        self.end_headers()
        response = {
                "result": result,
                "data": data,
                "http_code": code
                }
        dump = json.dumps(response)
        self.wfile.write(bytes(dump, 'utf-8'))


    def _remove_array(self, d):
        """
        the urllib parser returns parameter-arrays.
        this function removes the array, if just one value is inside
        and returns the value without it
        """
        for key, value in d.items():
            if isinstance(value, list) and len(value) == 1:
                d[key] = value[0]
        return d


    def _get_body(self):
        """
        reads the body-length of the header and parses for the given length.
        If possible, the body is returned as json, otherwise in its raw form.
        """
        content_len = int(self.headers.get('content-length'))
        body_utf_8 = self.rfile.read(content_len)
        body = body_utf_8.decode('utf-8')
        try:
            body = json.loads(body)
        except ValueError:
            pass
        return body


    def _has_rights(self, command):
        """
        checks if a user has the right to perform a command.
        the allowed commands are defined in the config-file.
        """
        active = False
        registered = False
        if self.session['user'] is None:
            if command not in Config.COMMANDS_UNKNOWN:
                return False
            return True
        else:
            if command not in Config.COMMANDS_USER:
                return False
            return True


    def _set_session(self):
        """
        extracts the token from the http-request(field x-bb-session)
        and looks for a corresponding session.
        """
        #if self.headers.get('connection') == 'keep-alive':
        #    self.server.write('keeping connection alive')
        #    self.close_connection = False
        #else:
        #    self.close_connection = True
        if 'x-bb-session' in self.headers:
            token = self.headers['x-bb-session']

            if not hasattr(self, 'session'):
                session = self.server.get_session(token)
                if session:
                    self.session = session
        if not hasattr(self, 'session'):
            self.session = self.server.get_default_session()

        if not self.server.is_muted_requesthandler():
            self.server.write(str(self.session['user'] and self.session['user']['user']) + ': ' + self.path)


    def _handle_path(self, path, params):
        """
        extracts the parameters of the url and calls the appropriate interface-function,
        provided that the user has the required rights.
        """
        path_array = path.lstrip('/').split('/')

        if len(path_array) < 1:
            return self._handle_error('path is invalid')
        elif self._has_rights(path_array[0]) is False:
            self.server.write_err('USER HAS NO RIGHT TO DO THIS')
        else:
            function = getattr(self, '_intf_' + path_array[0], None)
            if function:
                return function(path_array, params)
            else:
                self.server.write_err('interface does not exist')


    def _handle_cursor(self, cursor):
        """
        if a plugin-function returns a database-cursor,
        this function extracts the documents and packs them into a list.
        """
        result_size = cursor.count()
        data = []
        for result in cursor:
            data.append(result)
        return data


    def _handle_error(self, message):
        """
        this function is so far only called when an invalid path is given.
        more error handling should happen here in future.
        """
        data = {
                "result": "error",
                "message": message,
                "resource": self.path,
                "method": self.command,
                "request-header": str(self.headers)
                }
        self._create_response('error', data, 401)


    #----- INTERFACE FUNCTIONS -----
    def _intf_asset(self, path_array, params):
        """
        A client can request a file here.
        So far only one file exists: the game-configuration.
        """
        filename = path_array[1] + '.json'
        with open(os.getcwd() + '/assets/' + filename, 'r') as f:
            try:
                asset = json.load(f)
                return self._create_response('ok', asset, 200)
            except ValueError:
                self.server.write('gameConfiguration could not be parsed')
                return None


    def _intf_document(self, path_array, params):
        """
        inserts a document into a database-collection.
        the collection is given in the path_array and params is the actual document
        """
        collection = path_array[1]
        if collection in self.session['plugins']:
            plugin = self.session['plugins'][collection]
            if 'insert' in plugin.get_public_endpoint():
                doc = plugin.insert(params)
                if doc:
                    return self._create_response('ok', doc, 201)


    def _intf_following(self, path_array, params):
        """
        Returns users which the session-owner is following
        """
        assert len(path_array) == 2

        following = self.session['plugins']['users'].get_following(path_array[1])
        self._create_response('ok', following, 200)


    def _intf_followers(self, path_array, params):
        """
        Returns the followers of the session-owner
        """
        assert len(path_array) == 2

        followers = self.session['plugins']['users'].get_followers(path_array[1])
        self._create_response('ok', followers, 200)


    def _intf_follow(self, path_array, params):
        """
        Adds a user with given username to the following-array of the session-owner
        """

        assert len(path_array) == 2

        updated_user = None
        userP = self.session['plugins']['users']

        if self.command == 'DELETE':
            updated_user = userP.set_unfollow(path_array[1])
        else:
            updated_user = userP.set_follow(path_array[1])

        if updated_user is not None:
            self._create_response('ok', self.session['user'], 200)


    def _intf_login(self, path_array, params):
        """
        login with credentials.
        if this is successfull, create a new sesison-object and return token
        """

        assert 'username' in params
        assert 'password' in params

        params = self._remove_array(urllib.parse.parse_qs(params))

        username = params['username']
        password = params['password']

        new_session = self.server.authenticate(username, password)
        if new_session:
            self.session = new_session
            return self._create_response('ok', {'user': self.session['user'], 'token':self.session['token']}, 200)
        else:
            self.server.write('authentication unsuccessfull')


    def _intf_logout(self, path_array, params):
        """
        logout, i.e. delete session-object
        """
        if self.session['user'] is not None:
            self.server.delete_session(self.session)
            return self._create_response('ok', None, 200)


    def _intf_me(self, path_array, params):
        """
        returns the user-document of the session-owner
        """
        if 'user' in self.session and self.session['user']['_id'] != 'admin.default':
            user = self.session['user']
            if self.command == 'PUT':
                assert params
                user = self.session['plugins']['users'].update_fields(params)
                assert user
                self.session['user'] = user
            return self._create_response('ok', user, 200)


    def _intf_plugin(self, path_array, params):
        """
        calls a public endpoint of a plugin.
        A plugin-function is a public-endpoint, if it is inside the public-endpoint-array of the plugin.
        An example is the public-endpoint function get_by_id() of the arguments-plugin.
        """
        plugin = path_array[1]
        function = path_array[2]

        if plugin in self.session['plugins']:
            plugin = self.session['plugins'][plugin]
            if function in plugin.get_public_endpoint():
                function = getattr(plugin, function, None)
                result = function(params)
                data = {}
                if type(result) is cursor.Cursor:
                    data = self._handle_cursor(result)
                else: data = result
                self._create_response('ok', data, 200)

            else:
                self.server.write('no public endpoint defined with name ' + function)
                return None
        else:
            self.server.write('no plugin found with name ' + plugin)
            return None


    def _intf_user(self, path_array, params):
        """
        either return an existing user with given username or create a new user (depends on the HTTP method).
        In the second case a registration takes place.
        The registraion could, bot does not, use the _intf_document (defined by Baasbox-Protocol)
        """
        userP = self.session['plugins']['users']
        user = None
        if self.command == 'GET':
            assert len(path_array) > 1
            user = userP.get_user(path_array[1])
        elif self.command == 'POST':
            assert 'username' in params and 'password' in params and 'email' in params and 'lang' in params
            user = userP.insert(params['username'], params['password'], params['email'], params['lang'])

        if user:
            return self._create_response('ok', user, 200)
