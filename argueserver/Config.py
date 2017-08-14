HOST = 'localhost'
PORT = 27017
# -- HTTP-SESSION Settings --
HTTP_SESSION_TOKEN_TIMEOUT = 0
HTTP_SESSION_TOKEN_SIZE = 24
# -- Existing Commands --
COMMANDS_UNKNOWN = ['login', 'me', 'asset', 'user', 'plugin']
COMMANDS_USER = ['login', 'user', 'me', 'asset', 'logout', 'plugin', 'document', 'following', 'followers', 'follow']
COMMANDS_ADMIN = [''].append(COMMANDS_USER)
# -- MACE
MACE_FOLDER = 'mace/'
MACE_ANNOTATIONS = 'argotario.csv'
MACE_COMPETENCES = 'competence'
MACE_PREDICTIONS = 'prediction'
MACE_TIMEOUT = 60 * 60 * 4
MIN_VOTINGS = 4
# -- COMMUNICATION-SESSION
SESSION_TIMEOUT = 86400
# --GAME-SESSION
GSESSION_TICKER = 4
GSESSION_TIMEOUT = 86400
# --DB-TIMEOUT
DB_RETRY = 5
DB_SERVER_SELECTION_TIMEOUT = 100
# -- GENERAL SETTINGS
NAME = 'Argotario Python Backend Server'
WELCOME = 'Welcome!'
WEBSITE = 'https://argue.ukp.informatik.tu-darmstadt.de'
VERSION = '1.0-SNAPSHOT'
# --EMAIL SETTINGS
MAIL_FROM = 'argotario@example.com'
MAIL_TO = 'text@example.com'
MAIL_SMTP = 'smtp.example.com'
MAIL_PASSWORD = 'random_generated_safe_password'
