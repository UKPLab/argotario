"""
The ncurses-terminal front
"""
import os
import sys
import threading
import time

import Config

class Screen():
    """
    THIS IS THE FRONTEND
    """

    def __init__(self):
        """
        create all windows/pads and set respective dimensions.
        furthermore stdout gets set to /dev/null, so that the
        ncurses-screen is not overwritten.
        The ncurses-screen looks like this
        """
        self.server = None
        self.set_welcome_message()

        #pointers
        self.session_pointer = None

    def set_welcome_message(self):
        self.write(Config.NAME + ' v.' + Config.VERSION + ' - ' + Config.WEBSITE, '')
        self.write(Config.WELCOME)


    def destroy(self):
        pass


    def read(self, msg):
        user_in = input(msg + '--> ')
        return user_in


    def read_forever(self):
        """
        this function is called by the ncurses-front when a user enters a command.
        executes the related _exec_-function.
        The _exec_-functions return True if either the given parameters are correct,
        or if they are not but the function writes the error-msg itself.
        If False is returned, this function writes a generic 'Paramets wrong'-message.
        """
        while True:
            user_in = self.read('').split(' ')
            function = getattr(self.server, '_exec_' + user_in[0], None)
            if function:
                function(user_in[1:])
            else:
                self.write('No such command!, command \'help\' might help you.')


    def write(self, line, attrs=''):
        print(line)


    def start(self, server):
        self.server = server

        prompt_t = threading.Thread(target=self.read_forever)
        prompt_t.daemon = True
        prompt_t.start()
