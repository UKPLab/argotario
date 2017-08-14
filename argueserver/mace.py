import os
import csv

import Config


class Processor:
    """
    this class communicates with the mace-software-tool
    """

    def __init__(self, session, threshold=1.0):
        self.session = session
        self.plugins = session['plugins']
        self.folder = os.getcwd() + '/mace/'
        self.files = {
            'annotations': 'argotario.csv',
            'competences': 'competence',
            'predictions': 'prediction'
        }
        self.threshold = threshold

    def _load_input(self):
        """
        loads the input required for the MACE software-tool.
        returns a list of the arguments and the users who voted on it.
        furthermore the actual input for MACE is returned,
        i.e. a matrix where each row corresponds to one argument
        and every column to the vote of a user
        """

        voters = set()
        matrix = []
        arg_p = self.plugins['arguments']
        session_p = self.plugins['sessions']

        args = list(arg_p.get_voted('fallacyId'))
        args_min_voted = []

        for a in args:
            user_votings = a['votings']['fallacyId'].keys()
            votings_count = len(user_votings)
            if votings_count >= Config.MIN_VOTINGS:
                args_min_voted.append(a)
                for user in user_votings:
                    voters.add(user)
            else:
                # clean old data which used another min-voting-value
                if 'out_fallacyType' in a:
                    arg_p.drop_fields(a['_id'], ['out_fallacyType'])

                    print('unset fallacy-type for arg:', a['_id'])
                    session = session_p.get_by_arg(a['_id'])
                    if session:
                        session_p.drop_fields(session['_id'], ['out_winner', 'out_rewarded'])
                        print('unset winner-type for session:', session['_id'])

        voters = list(voters)
        args = args_min_voted
        for a in args:
            row = []
            for user in voters:
                if user in a['votings']['fallacyId']:
                    row.append(a['votings']['fallacyId'][user])
                else:
                    row.append('')
            matrix.append(row)

        return args, voters, matrix

    def _write_input(self, matrix):
        """
        writes the user-voting-matrix to a csv-file which acts as input for the MACE software tool.
        """
        with open(self.folder + self.files['annotations'], 'w') as annotations:
            writer = csv.writer(annotations, delimiter=',')
            for line in matrix:
                writer.writerow(line)

    def _get_competences(self):
        """
        reads the computed competence-values from a file written by MACE.
        """
        comp = None
        with open(self.files['competences'], 'r') as competences:
            reader = csv.reader(competences, delimiter='\t')
            comp = next(reader)
        return comp

    def _get_predictions(self):
        """
        reads the computed true-labels, i.e. the fallacy-types from a file written by MACE.
        """

        loaded_predictions = []
        with open(self.files['predictions'], 'r') as predictions:
            reader = csv.reader(predictions, delimiter='\t')
            for row in reader:
                if len(row) == 1:
                    loaded_predictions.append(row[0])
                else:
                    loaded_predictions.append('')
        return loaded_predictions

    def run(self):
        """
        creates the matrix from the database,
        writes the input-file for the MACE software-tool
        and starts the algorithm.
        When the computation of the competence-scores and the true-labels is finished
        and the values are dumped to the csv-files,
        these files are parsed and the values returned.
        """
        args, voters, matrix = self._load_input()
        self._write_input(matrix)
        os.system(
            'java -jar ' + self.folder + 'MACE.jar --threshold ' + str(self.threshold) + ' ' + self.folder + self.files[
                'annotations'])
        competences = zip(voters, self._get_competences())
        predictions = zip(args, self._get_predictions())
        return competences, predictions
