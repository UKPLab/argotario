angular.module('arg.services').provider('HighscoreStore', function() {

    this.$get = function($http,$q,$rootScope,$localStorage,UserAccount) { return {
        globalHighscore: function(cached) {
            return this.highscoreNamed('get_global_highscore',cached);
        },
        weeklyHighscore: function(cached) {
            return this.highscoreNamed('get_weekly_highscore',cached);
        },

        currentUsersRanking: function() {
            return this.rankingOfUsername();
        },

        rankingOfUsername: function(username) {
            return $q(function (resolve,reject) {
                BaasBox.callPlugin('get','users/get_ranking',{id:username}).done(function (result) {
                    resolve(result.data);
                }).fail(function (error) {
                    reject({success: false, error: error});
                });
            });
        },

        highscoreNamed: function(name,cached) {
            if (cached) {
                return $localStorage.cachedHighscore[name];
            }
            return $q(function (resolve,reject) {
                BaasBox.callPlugin('get','users/'+name,{}).done(function (result) {
                    resolve(result.data);
                }).fail(function (error) {
                    reject({success: false, error: error});
                });
            });
        }

    }}
});
