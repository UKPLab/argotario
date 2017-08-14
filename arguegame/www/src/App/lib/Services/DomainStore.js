/** The UserAccount is a service that provides access to the gameConfiguration.js file. */
angular.module('arg.services').provider('DomainStore', function() {
    this.$get = function($http,$q,$rootScope) { return {

        allDomains: function(params) {
            return $q(function (resolve,reject) {
                BaasBox.callPlugin('get','arg.domains/allDomains',params||{}).done(function (result) {
                    resolve(result.data);
                }).fail(function (error) {
                    reject({success: false, error: error});
                });
            });
        },

        publishDomain: function(domain) {
            return $q(function (resolve,reject) {
                BaasBox.callPlugin('get','arg.domains/publishDomainWithId',{domainId:domain.id}).done(function (result) {
                    resolve(result.data);
                }).fail(function (error) {
                    reject({success: false, error: error});
                });
            });
        }

    }}
});
