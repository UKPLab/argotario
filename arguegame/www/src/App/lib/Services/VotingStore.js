/** The UserAccount is a service that provides access to the gameConfiguration.js file. */
angular.module('arg.services').provider('VotingStore', function() {
    this.$get = function($http,$q,$rootScope) { return {

        vote: function(params) {
            return $q(function (resolve,reject) {
                BaasBox.callPlugin('get','votings/vote',params||{}).done(function (result) {
                    resolve(result.data);
                }).fail(function (error) {
                    reject({success: false, error: error});
                });
            });
        }


    }}
});
