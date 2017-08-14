from bson import objectid
from datetime import datetime
import pymongo
import random



class Plugin:
    """
    INTERFACE-CLASS WHICH ALL PLUGINS SHOULD INHERIT FROM
    GENERAL RULES:
    PLUGINS SHOULD PREFERABLY CALL INHERITED FUNCTIONS
    FUNCTIONS WHICH RETURN JUST ONE DOCUMENT AND ARE A PUBLIC ENDPOINT SHOULD CALL KRAKEN TO RESOLVE LINKS(THAT IS THE OUT_-FIELDS)
    """

    def __init__(self, database, collection_str, public_endpoint_extensions = []):
        self.database = database
        #!!DO NOT CALL A COLLECTION COLLECTION_STR OR THIS STRING WILL BE OVERRIDDEN!!
        self.collection_str = collection_str
        setattr(self, collection_str, database[collection_str])
        self.public_endpoint = ['get_public_endpoint', 'get_by_id', 'get_by_id_list', 'get_all', 'get_random', 'vote']
        self.public_endpoint.extend(public_endpoint_extensions)


    #AUXILIARY FUNCTIONS
    def set_aux_fields(self, doc):
        """
        does automatically set the author and time of change for a document, as well as the id.
        We use strings as id!
        This is important since many documents are imported from baasbox and use strings by default.
        """
        self.set_author(doc)
        self.set_timestamp(doc)
        doc['_id'] = str(objectid.ObjectId())

        return doc


    def set_timestamp(self, doc):
        """
        update the timestamp-field of a document.
        Usually happens when the document is updated
        """
        doc['_timestamp'] = str(datetime.now())
        return doc


    def set_author(self, doc):
        """
        every document has its author stored.
        happens once at insert.
        """
        if hasattr(self, 'caller'):
            doc['_author'] = self.caller['user']
        else:
            doc['_author'] = 'system'

        return doc


    def set_plugins(self, plugins):
        """
        every plugin holds a reference to the other plugins
        """
        self.plugins = plugins


    def set_caller(self, user):
        """
        A plugin needs to know the caller in order to perform some operations.
        Is usually called once at session-creation.
        """
        self.caller = user


    def set_screen(self, screen):
        """
        Binds to the curses-screen in order to print output.
        """
        self.screen = screen


    def write(self, line):
        """
        write a line to the curses-screen.
        """
        self.screen.write(line)


    def delete(self, _id):
        """
        deletes a document.
        returns if the delete-operation was successfull.
        """
        del_res = getattr(self, self.collection_str, None).delete_one({'_id' : _id})
        return del_res.acknowledged


    def update_fields(self, _id, update, timestamp = True):
        """
        updates a field of a document.
        does also update the timestamp.
        """
        if timestamp:
            update = self.set_timestamp(update)
        update = getattr(self, self.collection_str, None).find_one_and_update({'_id' : _id}, {'$set' : update }, return_document = pymongo.ReturnDocument.AFTER)
        return update


    def drop_fields(self, _id, fields):
        """
        drops a field from a document.
        does not update the timestamp.
        """
        update = {}
        for field in fields:
            update[field] = ''
        update = getattr(self, self.collection_str, None).find_one_and_update({'_id' : _id}, {'$unset' : update}, return_document = pymongo.ReturnDocument.AFTER)
        return update


    def input_filter(self, doc):
        """
        This method is called before a new document is inserted
        and is supposed to be overwritten by the implementing plugin.
        Herein one should check for required document-fields and values.
        If the document-format is invalid, this method should return False,
        so that the document does not get inserted into the database.
        """
        return True


    #PUBLIC ENDPOINT
    def get_by_id(self, p, kraken=True):
        """
        gets a document by id.
        If kraken is True, all linked documents(the out_-fields) are queried as well and appended.
        """
        assert 'id' in p

        doc = getattr(self, self.collection_str, None).find_one({"_id": p['id']})
        if hasattr(self, 'kraken') and kraken is True:
            self.kraken(doc)
        return doc


    def get_by_user(self, username):
        """
        returns all documents of a given user inside the related collection of the plugin.
        """
        doc = getattr(self, self.collection_str, None).find({'_author' : username})
        return doc


    def get_random(self, p={}, kraken=True):
        """
        returns a random document from the collection the plugin relates to.
        """
        _all = self.get_all(p)
        nr_all = _all.count()
        rand = _all[random.randrange(0, nr_all)]
        if hasattr(self, 'kraken') and kraken is True:
            self.kraken(rand)
        return rand


    def get_by_id_list(self, _id_list, sort=False):
        """
        takes a list of ids and returns a list of documents in the same order for these ids.
        """
        cursor = getattr(self, self.collection_str, None).find({"_id" : {"$in" : _id_list}})
        if sort is False:
            return cursor
        else:
            unsorted = list(cursor)
            _sorted = []
            for _id in _id_list:
                for idx, item in enumerate(unsorted):
                    if item['_id'] == _id:
                        _sorted.append(item)
                        unsorted.pop(idx)
                        break
            return _sorted


    def get_all(self, p={}):
        """
        returns all documents for the collection of the plugin.
        """
        return getattr(self, self.collection_str, None).find(p)


    def insert(self, doc):
        """
        inserts a document into the collection of the plugin,
        if it passes the input-filter and after the auxiliray fields are addeded.
        """
        input_ok = self.input_filter(doc)
        assert input_ok is True

        self.set_aux_fields(doc)
        ins_res = getattr(self, self.collection_str, None).insert_one(doc)
        if ins_res.acknowledged:
            return doc
        return None


    def vote(self, p):
        """
        creates a voting with given value for a field(keypath) of a document with given id.
        """
        assert 'id' in p
        assert 'keypath' in p
        assert 'value' in p

        upd_res = getattr(self, self.collection_str, None).update_one(
                {'_id': p['id']}, {'$set' : {'votings.' + p['keypath'] + '.' + self.caller['user']: p['value']}})

        return upd_res.acknowledged


    def get_public_endpoint(self):
        """
        returns the public endpoint.
        Can be called by a user to find out about the functions provided by the plugin.
        """
        return self.public_endpoint
