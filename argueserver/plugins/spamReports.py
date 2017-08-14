import interfaces
import smtplib
from email.mime.text import MIMEText
import Config


class SpamReports(interfaces.Plugin):
    """
    Plugin for the spamReports-collection

    """

    def insert(self, doc):
        doc = super(SpamReports, self).insert(doc)
        """
        if doc:
            msg = MIMEText(str(doc))
            msg['Subject'] = '[argotario] Spam report'
            msg['From'] = Config.MAIL_FROM
            msg['To'] = Config.MAIL_TO
            s = smtplib.SMTP(Config.MAIL_SMTP)
            s.ehlo()
            s.starttls()
            s.login(Config.MAIL_FROM, Config.MAIL_PASSWORD)

            s.sendmail(Config.MAIL_FROM, [Config.MAIL_TO], msg.as_string())
        """
        return doc


def getHandler(database):
    """
    a function instantiating and returning this plugin
    """
    return SpamReports(database, 'spamReports', public_endpoint_extensions=['insert'])
