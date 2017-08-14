/** The ArticleStore. */
angular.module('arg.services').provider('ArticleStore', function() {
    this.$get = function($http,$q,$rootScope) { return {

        allArticles: function(params) {
            return $q(function (resolve,reject) {
                BaasBox.callPlugin('get','arg.articles/allArticles',params||{}).done(function (result) {
                    resolve(result.data);
                }).fail(function (error) {
                    reject({success: false, error: error});
                });
            });
        },

        articlesMatchingSearchQuery:function(params) {
            return $q(function (resolve,reject) {
                BaasBox.callPlugin('get','arg.articles/articlesMatchingSearchQuery',params).done(function (result) {
                    resolve(result.data);
                }).fail(function (error) {
                    reject({success: false, error: error});
                });
            });
        },

        publishArticle: function(article) {
            return $q(function (resolve,reject) {
                BaasBox.callPlugin('get','arg.article/publishArticleWithId',{articleId:article.id}).done(function (result) {
                    resolve(result.data);
                }).fail(function (error) {
                    reject({success: false, error: error});
                });
            });
        }

    }}
});
