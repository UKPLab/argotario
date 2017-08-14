/** The UserAccount is a service that provides access to the gameConfiguration.js file. */
angular.module('arg.services').provider('UserStore', function() {

    var _loadedUsers = [];

    this.$get = function($http,$q,$rootScope) { return {

        load: function(username, callbackWithObject) {
            BaasBox.fetchUserProfile(username).done(function (obj) {
                callbackWithObject(obj.data);
            }).fail(function () {
                callbackWithObject(null);
            });
        },

        loadFollowing: function(username, callbackWithObject) {
            BaasBox.fetchFollowing(username).done(function (obj) {
                callbackWithObject(obj.data);
            }).fail(function () {
                callbackWithObject(null);
            })
        },

        loadFollowers: function(username, callbackWithObject) {
            BaasBox.fetchFollowers(username).done(function (obj) {
                callbackWithObject(obj.data);
            }).fail(function () {
                callbackWithObject(null);
            })
        },

        allUsers: function(params) {
            return $q(function (resolve,reject) {
                BaasBox.callPlugin('get','users/get_all',params||{}).done(function (result) {
                    resolve(result.data);
                }).fail(function (error) {
                    reject({success: false, error: error});
                });
            });
        },

        getMTurkCode: function(params) {
            return $q(function (resolve,reject) {
                BaasBox.callPlugin('get','users/get_mturk_code',params||{}).done(function (result) {
                    resolve(result.data);
                }).fail(function (error) {
                    reject({success: false, error: error});
                });
            });
        },

        usersMatchingSearchQuery:function(params) {
            return $q(function (resolve,reject) {
                BaasBox.callPlugin('get','users/usersMatchingSearchQuery',params).done(function (result) {
                    resolve(result.data);
                }).fail(function (error) {
                    reject({success: false, error: error});
                });
            });
        }

    }}
});
