angular.module('arg.services').provider('TopicStore', function() {
    this.$get = function($http,$q,$rootScope) { return {

        topicWithId: function (params) {
            return $q(function (resolve,reject) {
                BaasBox.callPlugin('get','topics/get_by_id',params||{}).done(function (result) {
                    resolve(result.data);
                }).fail(function (error) {
                    reject({success: false, error: error});
                });
            });
        },

        allTopics: function(params) {
            return $q(function (resolve,reject) {
                BaasBox.callPlugin('get','topics/get_all',params).done(function (result) {
                    resolve(result.data);
                }).fail(function (error) {
                    reject({success: false, error: error});
                });
            });
        },

        topicsInDomainWithId: function(params) {
            return $q(function (resolve,reject) {
                BaasBox.callPlugin('get','topics/topicsInDomainWithId',params).done(function (result) {
                    resolve(result.data);
                }).fail(function (error) {
                    reject({success: false, error: error});
                });
            });
        },

        randomTopic: function(params) {
            return $q(function (resolve,reject) {
                BaasBox.callPlugin('get','topics/get_random',params).done(function (result) {
                    resolve(result.data);
                }).fail(function (error) {
                    reject({success: false, error: error});
                });
            });
        }
        
    }}
});
