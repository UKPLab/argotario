angular.module('arg.services').provider('FallacyStore', function() {
    this.$get = function($http,$q,$rootScope) { return {

        fallacyWithId: function (params) {
            return $q(function (resolve,reject) {
                BaasBox.callPlugin('get','fallacies/fallacyWithId',params||{}).done(function (result) {
                    resolve(result.data);
                }).fail(function (error) {
                    reject({success: false, error: error});
                });
            });
        },

        fallaciesWithDifficulty: function (params) {
            return $q(function (resolve,reject) {
                BaasBox.callPlugin('get','fallacies/get_by_difficulty',params||{}).done(function (result) {
                    resolve(result.data);
                }).fail(function (error) {
                    reject({success: false, error: error});
                });
            });
        },

        randomFallacyWithDifficulty: function (params) {
            return $q(function (resolve,reject) {
                BaasBox.callPlugin('get','fallacies/get_random_by_difficulty',params||{}).done(function (result) {
                    resolve(result.data);
                }).fail(function (error) {
                    reject({success: false, error: error});
                });
            });
        },

        allFallacies: function(params) {
            return $q(function (resolve,reject) {
                BaasBox.callPlugin('get','fallacies/allFallacies',params).done(function (result) {
                    resolve(result.data);
                }).fail(function (error) {
                    reject({success: false, error: error});
                });
            });
        },

        randomFallacy: function(params) {
            return $q(function (resolve,reject) {
                BaasBox.callPlugin('get','fallacies/randomFallacies',params).done(function (result) {
                    resolve(result.data);
                }).fail(function (error) {
                    reject({success: false, error: error});
                });
            });
        },

        publishFallacy: function(fallacy) {
            return $q(function (resolve,reject) {
                BaasBox.callPlugin('get','arg.fallacies/publishFallacyWithId',{fallacyId:fallacy.id}).done(function (result) {
                    resolve(result.data);
                }).fail(function (error) {
                    reject({success: false, error: error});
                });
            });
        }
    }}
});
