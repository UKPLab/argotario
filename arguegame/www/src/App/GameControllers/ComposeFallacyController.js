kComponentMinimumLength = 15;
kComponentMaximumLength = 1024;
kComponentTypeClaim = 'claim';
kComponentTypePremise = 'premise';
kComponentTerminology = {};
kComponentTerminology[kComponentTypeClaim] = 'claim';
kComponentTerminology[kComponentTypePremise] = 'reason';

angular.module('arg.game.roundcontrollers').controller('ComposeFallacyController', function($scope,$ionicPopup,$translate,$ionicSlideBoxDelegate,$ionicActionSheet,$ionicScrollDelegate,$localStorage,$timeout,TopicStore,ArgumentStore,FallacyStore,EntityLinker,LanguageStore) {

    $scope.language = LanguageStore.activeLanguage().id;

    $scope.gameData = {
        argument: {
            components: [{type:kComponentTypeClaim,   body:''}],
            stance: '',
            _editorial: false,
            fallacyId: '',
            out_refersTo: null,
            context: false,
            out_language: $scope.language
        },
        fallacy: null,
        topic: null,
        article: null,
        domain: null,
        loading: true
    };

    $scope.preloadData = function () {
        console.log("Pre-downloading data for round ComposeArgument");

        // The game configuaration can optionally specify a specific topicId
        // of the topic that should be fetched:
        var specificTopicId = valueForKeyPath($scope.round,'parameters.topicId');
        var specificFallacyId = valueForKeyPath($scope.round,'parameters.fallacyId');
        var specificFallacyDifficulty = valueForKeyPath($scope.round,'parameters.difficulty');
        var operator = valueForKeyPath($scope.round,'parameters.operator');

        var downloadTopic;
        if (specificTopicId) {
            downloadTopic = TopicStore.topicWithId({topicId: specificTopicId});
        } else {
            downloadTopic = TopicStore.randomTopic({'out_language': $scope.language});
        }

        return downloadTopic.then(function (topic) {
            $scope.gameData.argument.out_refersTo = topic._id
            console.log("Downloaded topic: ",topic);
            $scope.gameData.topic = topic;
            $scope.gameData.domain = valueForKeyPath( topic, '&belongsTo[0]' );
            console.log('arr', $scope.gameData.domain);
            $scope.gameData.article = valueForKeyPath( topic, '&references[0]' );

            var downloadFallacy = null;
            if (specificFallacyId) {
                var downloadFallacy = FallacyStore.fallacyWithId({fallacyId: specificFallacyId});
            } else if (specificFallacyDifficulty) {
                var downloadFallacy = FallacyStore.randomFallacyWithDifficulty({
                        difficulty: specificFallacyDifficulty,
                        operator: operator,
                        context: false
                });
            } else {
                var downloadFallacy = FallacyStore.randomFallacy({});
            }
            downloadFallacy.then(function (fallacy) {
                console.log("Downloaded fallacy: ",fallacy);
                $scope.gameData.loading = false;
                $scope.gameData.fallacy = fallacy;
                $scope.gameData.argument.fallacyId = fallacy._id;
                $scope.prepareDidFinish();
            },function (err) {
                alert($translate.instant("LOADING_GAME_FAILED"));
                console.log(err);
            });
        },function (err) {
            alert($translate.instant("LOADING_TOPIC_FAILED"));
            console.log(err);
        });

    }

    $scope.minimumAssumedPlayingTime = function () {
        return 1;
    }

    /** The boilerplate is used when the user clicks Clear All */
    var boilerplate = $scope.gameData.argument;

    $scope.addableComponentTypes = [kComponentTypePremise]; //TODO: in future? ['premise', 'backing', 'refutation', 'rebuttal'];

    $scope.showReorder = false;
    $scope.showDelete = false;

    $scope.submitData = function() {
        if (BaasBox.objectMatchesModelScheme($scope.gameData.argument, {
            components: [],
            stance: 'string',
            fallacyId: 'string',
            out_language: 'string'
        })) {
                return BaasBox.save( preparedForSaving($scope.gameData.argument), kCollectionArguments).done(function (arg) {
                    console.log("Did save argument.",arg);
                }).fail(function (err) {
                    console.error("Failed saving argument",err);
                });
        } else {
            alert($translate.instant("INVALID_ARGUMENT"),
                  $translate.instant("ARGUMENT_DOES_NOT_MATCH_SCHEME"));
        }
    }

    /** Bound to textareas so that they automatically expand */
    var _previousTextAreaHeights = {};
    $scope.expandText = function() {
        var element = $()[0];
        var newHeight = element.scrollHeight + "px";
        element.style.height = newHeight;

        // Update the scrollview only if the textarea's height has actually changed.
        var previousHeight = _previousTextAreaHeights[element];
        if (previousHeight!==undefined && previousHeight!=newHeight) {
            $scope.updateScrollView();
        }
        _previousTextAreaHeights[element] = newHeight;
    }

    $scope.toggleReorder = function(){
        $scope.showReorder = !$scope.showReorder;
        $('.ui-reorder-button').html( $scope.showReorder?'Done':'Reorder');
    }

    $scope.termForComponentType = function(type) {
        return kComponentTerminology[type] || 'unknown';
    }

    $scope.onComponentChange = function(component,tabIndex) {
        var element = document.getElementById("arg-textarea-"+tabIndex);
        element.style.height = element.scrollHeight + "px";
    }

    // Stores the components ({type:,body:}) currently selected by the user
    var _selection = [];

    $scope.pointsForNonVerifiableInput = function () {
        return 3;
    }

    $scope.costsForSkip = function(){
        return 1;
    }

    $scope.countdownDuration = function() {
        return 0;
    }

    $scope.correctInputMessage = function() {
        return $translate.instant("THANKS");
    }

    $scope.inputCorrectnessVerifiable = function() {
        return false;
    }

    var invalidDueToTooShort,
        invalidDueToTooLong,
        invalidDueToMissingStance,
        invalidDueToMissingClaim,
        indexOfInvalidComponent;

    $scope.inputIsValid = function() {
        var premiseExists = NO,
            claimExists = NO;

        // Reset All
        invalidDueToTooShort = NO;
        invalidDueToTooLong = NO;
        invalidDueToMissingClaim = NO;
        invalidDueToMissingStance = NO;
        invalidDueToMissingExplanation = NO;


        if (!$scope.gameData.argument.stance || $scope.gameData.argument.stance.length==0) {
            invalidDueToMissingStance = YES;
        }

        /*
        if (!$scope.gameData.argument.explanation || $scope.gameData.argument.explanation.length==0) {
            invalidDueToMissingExplanation = YES;
        } else {
            var len = $scope.gameData.argument.explanation.length;
            if (len < kComponentMinimumLength) {
                invalidDueToTooShort = YES;
            }
            if (len > kComponentMaximumLength) {
                invalidDueToTooLong = YES;
            }
        }
        */

        indexOfInvalidComponent = -1;
        angular.forEach($scope.gameData.argument.components, function (comp,key) {
            var len = comp.body.length;
            if (comp.type==kComponentTypeClaim && len) {
                claimExists = YES;
                if (len < kComponentMinimumLength) {
                    invalidDueToTooShort = YES;
                    return;
                }
                if (len > kComponentMaximumLength) {
                    invalidDueToTooLong = YES;
                    return;
                }
            }
        });

        invalidDueToMissingClaim = !claimExists;

        var valid = !invalidDueToMissingClaim && !invalidDueToTooLong && !invalidDueToTooShort && !invalidDueToMissingStance && !invalidDueToMissingExplanation;

        return valid;
    }

    $scope.output = function() {
        return $scope.gameData.argument;
    }

    $scope.invalidInputMessage = function() {
        if (invalidDueToMissingClaim) {
            return $translate.instant("CLAIM_IS_MISSING");
        } else if (invalidDueToTooLong) {
            return $translate.instant("PART_OF_ARGUMENT_IS_TOO_LONG");
        } else if (invalidDueToTooShort) {
            return $translate.instant("PART_OF_ARGUMENT_IS_TOO_SHORT");
        } else if (invalidDueToMissingStance) {
            return $translate.instant("STANCE_IS_MISSING");
        } else if (invalidDueToMissingExplanation) {
            return $translate.instant("EXPLANATION_IS_MISSING");
        } else {
            return $translate.instant("ARGUMENT_IS_SOMEHOW_INVALID");
        }
    }

    $scope.$parent.setRoundControllerScope($scope);
});
