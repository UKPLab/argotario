/** This servive provices database linking between two entities. */
angular.module('arg.services').provider('EntityLinker', function() {

    this.$get = function($http,$q,$rootScope) { return {

        linkEntities: function(params) {
            return $q(function (resolve,reject) {
                BaasBox.callPlugin('get','arg.linking/link',params).done(function (result) {
                    resolve(result.data);
                }).fail(function (error) {
                    reject({success: false, error: error});
                });
            });
        },

        unlinkEntities: function(params) {
            return $q(function (resolve,reject) {
                BaasBox.callPlugin('get','arg.linking/unlink',params).done(function (result) {
                    resolve(result.data);
                }).fail(function (error) {
                    reject({success: false, error: error});
                });
            });
        },

        setVotingBelongsToEntity: function(voting,entity) {
            ensure(voting,['id']);
            ensure(entity,['id']);
            console.log("linking voting to entity", voting.id, entity.id)

            return this.linkEntities({
                votingId: voting.id,
                entityId: entity.id
            });
        },

        setTopicBelongsToDomain: function(topic,domain) {
            ensure(topic,['id']);
            ensure(domain,['id']);

            return this.linkEntities({
                topicId: topic.id,
                domainId: domain.id
            });
        },

        setTopicReferencesArticle: function(topic,article) {
            ensure(topic,['id']);
            ensure(article,['id']);

            return this.linkEntities({
                topicId: topic.id,
                articleId: article.id
            });
        },

        setArgumentRefersToFallacy: function(argument,fallacy) {
            ensure(argument,['id']);
            ensure(fallacy,['id']);

            return this.linkEntities({
                argumentId: argument.id,
                fallacyId: fallacy.id
            });
        },

        setArgumentRefersToPvPSession: function(argument,session) {
            ensure(argument,['id']);
            ensure(session,['id']);

            return this.linkEntities({
                argumentId: argument.id,
                sessionPvPId: session.id
            });
        },

        setArgumentRefersToTopic: function(argument,topic) {
            ensure(topic,['id']);
            ensure(argument,['id']);

            return this.linkEntities({
                argumentId: argument.id,
                topicId: topic.id
            });
        }
    }}
});
