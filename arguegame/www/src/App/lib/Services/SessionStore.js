/** The UserAccount is a service that provides access to the gameConfiguration.js file. */
angular.module('arg.services').provider('SessionStore', function() {
    this.$get = function($http,$q,$rootScope) { return {

        openSession: function (params) {
            return $q(function (resolve,reject) {
                BaasBox.callPlugin('get','sessions/open',params||{}).done(function (result) {
                    resolve(result.data);
                }).fail(function (error) {
                    reject({success: false, error: error});
                });
            });
        },

        sessionById: function (params) {
            return $q(function (resolve,reject) {
                BaasBox.callPlugin('get','sessions/get_by_id',params||{}).done(function (result) {
                    resolve(result.data);
                }).fail(function (error) {
                    reject({success: false, error: error});
                });
            });
        },

        judgeSession: function (params) {
            return $q(function (resolve,reject) {
                BaasBox.callPlugin('get','sessions/judge',params||{}).done(function (result) {
                    resolve(result.data);
                }).fail(function (error) {
                    reject({success: false, error: error});
                });
            });
        },

        sessionJudgeable: function (params) {
            return $q(function (resolve,reject) {
                BaasBox.callPlugin('get','sessions/get_judgeable',params||{}).done(function (result) {
                    resolve(result.data);
                }).fail(function (error) {
                    reject({success: false, error: error});
                });
            });
        },

        checkForUpdates: function (params) {
            return $q(function (resolve,reject) {
                BaasBox.callPlugin('get','sessions/get_updated',params||{}).done(function (result) {
                    resolve(result.data);
                }).fail(function (error) {
                    reject({success: false, error: error});
                });
            });
        },

        sessionSelect: function(params) {
            return $q(function (resolve,reject) {
                BaasBox.callPlugin('get','sessions/select',params||{}).done(function (result) {
                    resolve(result.data);
                }).fail(function (error) {
                    reject({success: false, error: error});
                });
            });
        },

        argue: function(params) {
            return $q(function (resolve,reject) {
                BaasBox.callPlugin('get','sessions/argue',params||{}).done(function (result) {
                    resolve(result.data);
                }).fail(function (error) {
                    reject({success: false, error: error});
                });
            });
        },
        reward: function (params) {
            return $q(function (resolve,reject) {
                BaasBox.callPlugin('get','sessions/reward',params||{}).done(function (result) {
                    resolve(result.data);
                }).fail(function (error) {
                    reject({success: false, error: error});
                });
            });
        },

    }}
});
