import Config

import interfaces
import json
import pymongo
import random

from datetime import datetime, timedelta
from bson import son


class Sessions(interfaces.Plugin):
    """
    plugin for the session-collection
    """

    def kraken(self, session):
        """
        get all linked documents and append them to the session.
        This includes the topic, the domain, the users, arugments,
        and all fallacy-types.
        """
        if not '&refersTo' in session:
            topic = self.plugins['topics'].get_by_id({'id' : session['out_refersTo']})
            session['&refersTo'] = [topic]
        if not '&belongsTo' in session:
            domain = self.plugins['domains'].get_by_id({'id' : session['out_belongsTo']})
            session['&belongsTo'] = [domain]
        if not '&users' in session:
            session['&users'] = []
            userP = self.plugins['users']
            users = session['users']
            user_one = session['users']['0']
            user_two = session['users']['1']
            if user_one is not None:
                user_one = userP.get_user(user_one)
                session['&users'].append(user_one)
            if user_two is not None:
                user_two = userP.get_user(user_two)
                session['&users'].append(user_two)
        if not '&args' in session:
            sorted_args = self.plugins['arguments'].get_by_id_list(session['out_argument'], sort=True)
            session['&args'] = sorted_args
        if not '&allFallacies' in session:
            fallacies = list(self.plugins['fallacies'].get_all())
            session['&allFallacies'] = fallacies

        return session;


    def get_by_arg(self, a_id):
        """
        returns the session that an argument with given id belongs to
        """
        session = self.sessions.find_one({'out_argument' : a_id})
        return session

    def get_by_topic(self, t_id):
        """
        returns all sessions for a topic with given id
        """
        return self.sessions.find({'out_refersTo' : t_id})


    def get_next_timeout(self):
        """
        function used by the timeout-thread.
        returns the next session that will timeout.
        """
        ticking_sessions = self.sessions.find({'ticker' : {'$ne' : None}}).sort('_timestamp', pymongo.ASCENDING)
        if ticking_sessions.count():
            return ticking_sessions[0]
        else:
            return None


    def get_by_user(self, user, language=None, active=None, ticking=None, ex_rewarded=None, gt_time=None):
        """
        returns the sessions of a user, filtered by different parameters.
        Active means, that it has to be the players turn if the parameter is true.
        ticking means, that the session is not over.
        ex_rewarded stands for exclude rewarded, i.e. gameover-sessions,
        for which a user has already received a reward(coins)
        gt_time is either None or a timestamp,
        and this means that only sessions which are newer than this timestamp are returned.
        """
        cond_one = {"users.0" : user['user']}
        cond_two = {"users.1" : user['user']}
        if (active):
            cond_one['active'] = '0'
            cond_two['active'] = '1'

        query = {"$or": [cond_one, cond_two]}
        if ticking:
            query['ticker'] = {"$ne" : None}

        if ex_rewarded:
            query['out_rewarded'] = {"$ne" : user['user']}

        if gt_time:
            query['_timestamp'] = {"$gt" : gt_time}

        if language:
            query['out_language'] = language

        sessions = self.sessions.find(query);
        return sessions;


    def get_topic_by_ref_count(self, language):
        """
        returns the topic with the minimum number linked sessions
        """
        topicP = self.plugins['topics']
        pipeline = [
                    {"$unwind": "$out_refersTo"},
                    {"$group": {"_id": "$out_refersTo", "count": {"$sum": 1}}},
                    {"$sort": son.SON([("count", 1), ("_id", -1)])}
                ]
        ref_topics_count_id = list(self.sessions.aggregate(pipeline))
        all_topics = topicP.get_all({'out_language': language})
        ref_topics_id = []

        for t in ref_topics_count_id:
            ref_topics_id.append(t['_id'])

        for t in all_topics:
            #no session exists for topic, return this one
            if not t['_id'] in ref_topics_id:
                return t

        #return topic with minimum-reference count
        t = topicP.get_by_id({'id' : ref_topics_id[0]}, kraken=False)
        print('returning ref topic:', str(t))
        return t


    def new(self, language):
        """
        creates a new session
        """
        session = {
                'active' : '0',
                'ticker' : Config.GSESSION_TICKER,
                'users' : {'0': self.caller['user'], '1': None},
                'indicators' : {'0' : [None for i in range(Config.GSESSION_TICKER)], '1': [None for i in range(Config.GSESSION_TICKER)]},
                'out_argument' : [],
                'fallacy_choice' : [],
                'out_language': language
                }

        #fallac_choice saves two fallacy-types of which the active player can chose one and write an argument for
        session['fallacy_choice'] = self.plugins['fallacies'].get_next_needed(nb_fallacies=2)
        topic = self.get_topic_by_ref_count(language)

        domain = random.choice(list(self.plugins['domains'].get_by_topic(topic)))

        session['out_refersTo'] = topic['_id']
        session['out_belongsTo'] = domain['_id']

        self.insert(session)

        session['&refersTo'] = [topic]
        session['&belongsTo'] = [domain]

        return session


    def next_player(self, session):
        """
        sets the next player active
        and updates the session accordingly
        """
        if session['ticker'] == 0:
            session['ticker'] = None;
            session['active'] = None;
            session['fallacy_choice'] = None;
        else:
            session['ticker'] = session['ticker'] - 1;
            session['fallacy_choice'] = self.plugins['fallacies'].get_next_needed(nb_fallacies=2)
            if session['active'] == '0':
                session['active'] = '1';
            else:
                session['active'] = '0';

        self.set_timestamp(session);
        print('saving updated session');
        rep_res = self.sessions.replace_one({'_id' : session['_id']}, session)
        if rep_res.acknowledged:
            return session
        return None


    def join(self, language):
        """
        called when a user joins a session which has so far only one player.
        updates the session accordingly anc creates the necessary links
        """
        session = self.sessions.find_one_and_update({"users.1" : None, "active" : "1", "out_language": language, "users.0": {"$ne": self.caller['user']}}, {"$set" : {"users.1" : self.caller['user']}}, return_document=pymongo.ReturnDocument.AFTER)
        if session:
            print('joined session')
            return session
        return None


    def set_winner(self, s_id):
        """
        if called for a session with given id, checks if a winner exists and who won.
        updates the session accordingly.
        """
        session = self.get_by_id({'id': s_id}, kraken=False)
        assert session
        if 'timeout' in session and session['timeout'] is True:
            return session

        args = self.plugins['arguments'].get_by_id_list(session['out_argument'], sort=True)
        player_one = session['users']['0']
        player_two = session['users']['1']
        points = {player_one : 0, player_two : 0}

        for idx, a in enumerate(args):
            #set points for correctly composed fallacious arguments
            if session['indicators']['0'][idx] == a['out_fallacyType']:
                points[player_one] += 1
            if session['indicators']['1'][idx] == a['out_fallacyType']:
                points[player_two] += 1

        winner = None
        if points[player_one] > points[player_two]:
            winner = player_one
        elif points[player_two] > points[player_one]:
            winner = player_two
        else:
            winner = [player_one, player_two]

        update = self.update_fields(s_id, {'out_winner': winner})
        return update


    def flush(self):
        """
        finishes all active sessions.
        can be called manually when a new experiment is supposed to be started.
        """
        active_sessions = self.sessions.find({'active' : {'$ne' : None}})
        for session in active_sessions:
            ack = self.set_timeout(session)
            print(ack)
        inactive_sessions = self.sessions.find({'active' : None})
        for session in inactive_sessions:
            if len(session['out_argument']) == 1:
                ack = self.set_timeout(session)
                print(ack)


    def set_timeout(self, session):
        """
        session timed out, this function sets the necessary session-fields
        """
        if len(session['out_argument']) == 0:
            print('deleting empty session: ' + session['_id'])
            ack = self.delete(session['_id'])
            return ack
        elif len(session['out_argument']) == 1:
                a_id = session['out_argument'][0]
                print('dropping context field of arg', str(a_id))
                self.plugins['arguments'].drop_fields(a_id, ['context'])
                print('deleting session with one arg: ' + session['_id'])
                ack = self.delete(session['_id'])
                return ack
        else:
            print('setting timeout for session: ' + session['_id'])
            if session['active'] == '0':
                session['out_winner'] = session['users']['1']
            else:
                session['out_winner'] = session['users']['0']
            session['ticker'] = None
            session['active'] = None
            session['timeout'] = True
            self.set_timestamp(session);
            rep_res = self.sessions.replace_one({'_id' : session['_id']}, session)
            return rep_res.acknowledged


    def _indicate(self, session, indicator, vote):
        """
        this function gets called when a user did his turn
        and after his composed argument has been saved through a POST-request.
        the function saves the tipped fallacy-type inside the session
        and does furthermore create a voting-document, if the vote-flag is set to True.
        This flag is necessary, because the fallacy-type indications of the artificial-player
        should not be saved as voting.
        """
        to_indicate = len(session['out_argument']) -1
        session['indicators'][session['active']][to_indicate] = indicator
        if vote:
            voted = self.plugins['arguments'].vote({'id': session['out_argument'][-1], 'keypath' : 'fallacyId', 'value': indicator})
            return voted
        return True


    #PUBLIC ENDPOINTS
    def get_judgeable(self, p):
        """
        returns a session which can be judged.
        Preferably sessions without winners are shown in the judge-round of the frontend.
        """
        args = self.plugins['arguments'].arguments.find({'votings.fallacyId.' + self.caller['user'] : None, 'context' : True, 'out_language' : p['language']})
        sessions = self.sessions.find({'ticker' : None, 'out_argument' : {'$in' : args.distinct('_id')}})
        if sessions.count() == 0:
            return None
        else:
            session = list(sessions.sort('out_winner', pymongo.ASCENDING))[0]
            return self.kraken(session)


    def argue(self, p, vote=True):
        """
        called when a user did his turn.
        gets either passed an indicator+id of an inserted argument or just an indicator.
        updates the session accordingly, and maybe creates a voting (see _indicate())
        """
        assert 's_id' in p

        session = self.sessions.find_one({'_id' : p['s_id']})
        assert session is not None

        if 'indicator' in p:
            indicator = p['indicator']
            self._indicate(session, indicator, vote)
        if session['ticker']:
            assert 'a_id' in p
            arg = self.plugins['arguments'].get_by_id({'id' : p['a_id']}, kraken=False)
            assert arg is not None
            session['out_argument'].append(p['a_id'])
            indicator = arg['fallacyId']
            self._indicate(session, indicator, vote)
        return self.next_player(session);


    def user_in_session(self, session, u_id):
        """
        checks whether a user does already take part in a given session
        """
        return (session['users']['0'] == u_id) or (session['users']['1'] == u_id)


    def reward(self, p):
        """
        public endpoint-method which gets passed an id of a session
        for which a user claims a reward.
        the method checks whether the session has already cured a winner
        and if a user has already been payed.
        if a the session has a winner
        and the user has not been payed,
        the reward gets payed and the session is updated
        """
        assert 's_id' in p and 'u_id' in p
        session = self.sessions.find_one({'_id': p['s_id']});
        assert session and self.user_in_session(session, p['u_id'])

        if 'out_winner' in session:
            if 'out_rewarded' in session:
                if p['u_id'] not in session['out_rewarded']:
                    session['out_rewarded'].append(p['u_id'])
                    #no timestamp, players do not need to know about this update
                    update = self.update_fields(session['_id'], {'out_rewarded': session['out_rewarded']}, timestamp=False)
                    return update;
            else:
                session['out_rewarded'] = [p['u_id']]
                update = self.update_fields(session['_id'], {'out_rewarded': session['out_rewarded']}, timestamp=False)
                return update;
        return None;


    def get_updated(self, p):
        """
        method gets a timestamp and does then check if
        any session of the caller has newer timestamp,
        i.e. if one of his sessions has changed.
        if this is the case, the updated sessions are returned
        """
        assert 'timestamp' in p

        timestamp = p['timestamp']
        sessions = list(self.get_by_user(self.caller, gt_time=timestamp, ex_rewarded=True))
        return sessions or None


    def select(self, p):
        """
        returns the sessions for the two lists of the sessionSelect-round of the frontend.
        i.e. the ticking as well as the finished game-sessions of the caller.
        """
        active = None
        ticking = None
        if 'active' in p:
            active = p['active']
        if 'ticking' in p:
            ticking = p['ticking']

        sessions = self.get_by_user(self.caller, active, ticking, True);
        return sessions;


    def open(self, p):
        """
        this method is called when a user clicks the new game button at the frontend.
        returns a new or joined session, in order to get played by a user immediately.
        """
        session = self.join(p['language']) or self.new(p['language']);
        return self.kraken(session)


    def judge(self, p):
        """
        takes a list of votings for the arguments from one session,
        collected inside the judge-round of the frontend
        and stores them all.
        """
        assert ('votings[]' in p) and ('s_id' in p)

        session = self.sessions.find_one({'_id' : p['s_id']})
        votings = p['votings[]']
        if not isinstance(votings, list):
            votings = [votings]
        assert session is not None and (len(session['out_argument']) == len(votings))

        for idx, voting in enumerate(votings):
            vote = self.plugins['arguments'].vote({'id': session['out_argument'][idx], 'keypath' : 'fallacyId', 'value': voting})
            if vote is False:
                return False
        return True;


def getHandler(database):
    """
    a function instantiating and returning this plugin
    """
    return Sessions(database, 'sessions', public_endpoint_extensions=['select', 'open', 'judge', 'get_judgeable', 'argue', 'reward', 'get_updated'])
