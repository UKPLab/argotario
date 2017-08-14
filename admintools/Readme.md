This directory contains scripts and other tools that facilitate administrative tasks.

Creating virtualenv and installing python libraries:

```
$ virtualenv env-python3 --python=python3
$ source env-python3/bin/activate
$ pip3 install pymongo==3.4.0
```

## handle_spam_reports.py

This interactive script can be used to manage the spam reports that have been created by players. You can decide to delete arguments or change the gold label of arguments.

Usage: $ python3 handle_spam_reports.py
