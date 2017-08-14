/** The UserAccount is a service that provides access to the gameConfiguration.js file. */
angular.module('arg.services').provider('ArgumentStore', function() {
    this.$get = function($http,$q,$rootScope) { return {


        fallaciousArgumentWithDifficulty: function(params) {
            ensure(params,'difficulty');
            ensure(params,'language');

            return $q(function (resolve,reject) {
                BaasBox.callPlugin('get','arguments/fallacy_recognition', params||{}).done(function (result) {
                    resolve(result.data);
                }).fail(function (error) {
                    reject({success: false, error: error});
                });
            });
        },

        vote: function(params) {

            return $q(function (resolve,reject) {
                BaasBox.callPlugin('get','arguments/vote', params||{}).done(function (result) {
                    resolve(result.data);
                }).fail(function (error) {
                    reject({success: false, error: error});
                });
            });
        }

    }}
});
