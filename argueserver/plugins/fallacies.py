from bson import son
import interfaces
import numpy as np
import random


class Fallacies(interfaces.Plugin):
    """
    Plugin for the fallacies-collection
    """

    def get_fallacy_for_arg(self, arg):
        """
        return the true fallacy-type of the argument
        """
        if not 'out_fallacyType' in arg:
            return None
        return self.fallacies.find_one({"_id": arg['out_fallacyType']})


    def get_random_by_difficulty(self, p):
        """
        takes a difficulty-value and returns a random fallacy-type matching this difficulty
        """
        fallacies = self.get_by_difficulty(p)
        nr_fallacies = fallacies.count()
        if nr_fallacies == 0:
            return None
        return fallacies[random.randrange(0, nr_fallacies)]


    def get_next_needed(self, nb_fallacies=1):
        """
        creates a probability-distribution over the fallacy-types
        and returns one or more fallacy-types with a probability given by this distribution.
        If a fallacy-type is linked by more arguments than another one, it receives a lower probability than that type.
        Thereby unequal class-distributions are prevented.
        """
        print('starting minvoted')
        argP = self.plugins['arguments']
        pipeline = [
                    {"$unwind": "$fallacyId"},
                    {"$group": {"_id": "$fallacyId", "count": {"$sum": 1}}},
                    {"$sort": son.SON([("count", 1), ("_id", -1)])}
                ]
        ref_fallacies_id_count = list(argP.arguments.aggregate(pipeline))
        nb_args = 0
        inv_nb_args = 0
        for item in ref_fallacies_id_count:
            nb_args += item['count']
        for item in ref_fallacies_id_count:
            inv_nb_args += nb_args - item['count']
        p = []
        for item in ref_fallacies_id_count:
            prob = (nb_args - item['count'])/inv_nb_args
            p.append(prob)

        assert len(ref_fallacies_id_count)
        indices = np.random.choice(len(ref_fallacies_id_count), nb_fallacies, p=p, replace=False)
        print(indices)
        fallacies = []
        for idx in indices:
            fallacy = ref_fallacies_id_count[idx]['_id']
            fallacies.append(fallacy)
        return fallacies


    def get_by_difficulty(self, p):
        """
        returns a fallacy-type matching a difficulty and an operator
        """
        operator = None
        if 'operator' in p:
            operator = p['operator']
            if operator == '<':
                operator = '$lt'
            elif operator == '<=':
                operator = '$lte'
            elif operator == '>':
                operator = '$gt'
            elif operator == '>=':
                operator = '$gte'
            else: operator = '$eq'
        else: operator = '$lte'
        if not 'difficulty' in p:
            return None
        difficulty = p['difficulty']
        if isinstance(difficulty, str):
            difficulty = int(difficulty)

        _filter = {"difficulty": {operator : difficulty}}
        if 'context' in p and p['context'] is False:
            _filter['context'] = None

        return self.fallacies.find(_filter)


def getHandler(database):
    """
    a function instantiating and returning this plugin
    """
    return Fallacies(database, 'fallacies', public_endpoint_extensions=['get_by_difficulty', 'get_random_by_difficulty'])
