#!/usr/bin/env python

import argserver
from front import Screen
import requesthandler
import signal
import threading

if __name__ == '__main__':
    # ncurses-window
    screen = Screen()

    HOST, PORT = 'localhost', 9000
    argserver.HTTPServer.allow_reuse_address = True
    server = argserver.HTTPServer((HOST, PORT), requesthandler.REST)
    server.initialize(screen)

    screen.start(server)

    # http-server thread
    server_thread = threading.Thread(target=server.serve_forever)
    server_thread.daemon = False
    server_thread.start()


    def signal_handler(signal, frame):
        screen.write('Shutting down server in thread: ' + server_thread.name)
        server.shutdown()
        server.server_close()
        screen.destroy()


    signal.signal(signal.SIGINT, signal_handler)
