kComponentMinimumLength = 15;
kComponentMaximumLength = 1024;
kComponentTypeClaim = 'claim';
kComponentTypePremise = 'premise';
kComponentTerminology = {};
kComponentTerminology[kComponentTypeClaim] = 'claim';
kComponentTerminology[kComponentTypePremise] = 'reason';

/**
* Use the StaticContentRoundController to present a round consisting of some static HTML content only.
* @param	HTMLFile		The HTML file (must exist in GameContent/StaticContent/) with or without the HTML file extension
*/
angular.module('arg.game.roundcontrollers').controller('ComposeArgumentController', function($scope,$ionicPopup,$ionicSlideBoxDelegate,$ionicActionSheet,$ionicScrollDelegate,$localStorage,$timeout,TopicStore,ArgumentStore,EntityLinker){

    $scope.gameData = {
        argument: {
            components: [{type:kComponentTypeClaim,   body:''},
                         {type:kComponentTypePremise, body:''},
                        ],
            stance: '',
            isEditorial: false
        },
        topic: null,
        article: null,
        domain: null,
        loading: true
    };

    $scope.prepareData = function () {
        console.log("Pre-downloading data for round ComposeArgument");

        // The game configuaration can optionally specify a specific topicId
        // of the topic that should be fetched:
        var specificTopicId = valueForKeyPath($scope.round,'parameters.topicId');

        var download = (specificTopicId) ? TopicStore.topicWithId({
            topicId: specificTopicId
        }) : TopicStore.randomTopic({
            titles: valueForKeyPath($scope.round,'parameters.domains') || ''
        });

        return download.then(function (topic) {
            console.log("Downloaded topic: ",topic);
            $scope.gameData.topic = topic;
            $scope.gameData.domain = valueForKeyPath( topic, '&belongsTo[0]' );
            $scope.gameData.article = valueForKeyPath( topic, '&references[0]' );
            $scope.gameData.loading = false;

        },function (err) {
            alert("Loading game data failed.");
            console.log(err);
        });
    }

    $scope.roundWillStart = function() {
    }

    $scope.roundWillEnd = function() {
    }

    $scope.minimumAssumedPlayingTime = function () {
        return 8000;
    }

    /** The boilerplate is used when the user clicks Clear All */
    var boilerplate = $scope.gameData.argument;

    $scope.addableComponentTypes = [kComponentTypePremise];

    $scope.showReorder = false;
    $scope.showDelete = false;
    $scope.showHelp = false;

    $scope.submitData = function() {
        if (BaasBox.objectMatchesModelScheme($scope.gameData.argument, {
            components: [],
            stance: 'string'
        })) {
            if (!$scope.downrateInput) {

                // Remove empty componentList
                for(var idx=$scope.gameData.argument.components.length-1;idx>=0;idx--) {
                    var component = $scope.gameData.argument.components[idx];
                    if (component.body.trim().length==0) {
                        $scope.gameData.argument.components.splice(idx,1);
                        console.log("Empty component removed.");
                    }
                }

                BaasBox.save( preparedForSaving($scope.gameData.argument), kCollectionArguments).done(function (arg) {
                    console.log("Did save argument.",arg);

                    ArgumentStore.publishArgument(arg).then(function () {
                        console.log("Did publish argument");
                        EntityLinker.setArgumentRefersToTopic(arg, $scope.gameData.topic).then(function () {
                            console.log("Did link argument to topic.", $scope.gameData.topic);
                        },function (err) {
                            console.error("Linking argument to topic failed.", err, $scope.gameData.topic);
                        });

                    },function (err) {
                        console.error("Publishing argument failed.");
                    });

                    // Save votings for the own argument
                    saveVotingWithKeyPathAndValueForEntity(EntityLinker, "stance", $scope.gameData.argument.stance, arg);
                    angular.forEach($scope.gameData.argument.components, function (component,idx) {
                        saveVotingWithKeyPathAndValueForEntity(EntityLinker,
                                                               "components." + idx + ".type",
                                                               component.type,
                                                               arg);
                    });
                }).fail(function (err) {
                    console.error("Failed saving argument",err);
                });
            }
        } else {
            alert("Invalid argument",
                  "Something is wrong. Your argument scheme doesn't match the expected one.");
        }
    }

    /** Bound to textareas so that they automatically expand */
    var _previousTextAreaHeights = {};
    $scope.expandText = function(){
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

    $scope.addComponent = function(type){
        $scope.gameData.argument.components.push({type:type, body:''});
        $scope.updateScrollView();
        $scope.scrollDown();
    }

    $scope.toggleReorder = function(){
        $scope.showReorder = !$scope.showReorder;
        $('.ui-reorder-button').html($scope.showReorder? 'Done' : 'Reorder');
    }

    $scope.termForComponentType = function(type) {
        return kComponentTerminology[type] || 'unknown';
    }

    $scope.toggleDelete = function(){
        $scope.showDelete = !$scope.showDelete;
        $('.ui-delete-button').html( $scope.showDelete?'Done':'Edit');
    }

    $scope.onComponentSwap = function(component, fromIndex, toIndex) {
        console.log("Will reorder component",component, "from", fromIndex, "to", toIndex);
        console.log("Argument components before swapping components: ", $scope.gameData.argument.components);

        var componentsCopy = angular.copy($scope.gameData.argument.components);
        moveObjectAtIndexToIndex( componentsCopy, fromIndex, toIndex );
        $scope.gameData.argument.components = angular.copy(componentsCopy);

        console.log("Argument components after swapping components: ", $scope.gameData.argument.components);
    };

    $scope.onComponentDelete = function(deletedComponent,index) {
        var componentTypeCounts = {};
        angular.forEach($scope.gameData.argument.components, function(component, idx) {
            if (!(component.type in componentTypeCounts))
                componentTypeCounts[component.type] = 1;
            else
                componentTypeCounts[component.type]++;
        });

        if (deletedComponent.type=='claim' && componentTypeCounts['claim']==1) {
            alert("Wait!", "You cannot remove the only claim you have. An argument should always contain a claim!");
            return;
        }

        var doDelete = function () {
            $scope.gameData.argument.components.splice(index,1);
            scrollDelegate.resize();
        };

        if (deletedComponent.body.trim()=='') {
            doDelete();
        } else {
            confirm("Deleting Component",
                    "Do you really want to delete this "+deletedComponent.type+"?",
                    "Delete",
                    doDelete);
        }
    }

    $scope.onComponentChange = function(component,tabIndex) {

        var element = document.getElementById("arg-textarea-"+tabIndex);
        element.style.height = element.scrollHeight + "px";
    }

    $scope.onComponentBlur = function(component,index) {
        // Split component text by dots, but try to keep abbrevations...
        // This is creepy, but it kinda works.
        var text = component.body;
        var sentences = text.split(/\!|\?|\.|\;/);
        if (sentences.length==1) return;
        var fullSentences = [];
        var idx, previousWasFullSentence = true;
        angular.forEach(sentences, function (sentence) {
            var len     = sentence.length;
            var symbol  = text.substr( text.indexOf(sentence)+sentence.length,1 );
            sentence += symbol;
            if (len>3 && previousWasFullSentence) {
                fullSentences.push(sentence);
                idx++;
                previousWasFullSentence = true;
            } else {
                if (fullSentences.length==0) {
                    idx = 0;
                    fullSentences[0] = '';
                }
                previousWasFullSentence = false;
                if (len>3) previousWasFullSentence = true;
                fullSentences[idx] = fullSentences[idx]+sentence;
            }
        });

        multipleSentences = (fullSentences.length > 1);

        if (multipleSentences) {
            confirm("Multiple sentences!",
                    "You seem to have multiple sentences in your "+component.type+". You should split them into multiple components!",
                    "Split",
                    function(){
                        angular.forEach(fullSentences, function (fullSentence,idx) {
                            fullSentence = fullSentence.trim();

                            if (['.','!','?',';'].indexOf(fullSentence.substr(-1))==-1) {
                                fullSentence += '.';
                            }

                            if (idx==0) {
                                component.body = fullSentence;
                            } else {
                                $scope.gameData.argument.components.splice(index+idx,0,{
                                    type: kComponentTypePremise,
                                    body: fullSentence
                                });
                            }

                        });
                        $scope.updateScrollView();
                    });
        }
    }

    $scope.clickSubmit = function() {

        console.log("Will save ", $scope.gameData.argument);
        confirm('Everything ready?','Do you want to submit this argument?','Submit',function(){
            Argument.save($scope.gameData.argument);
            alert("Great!","Thanks for submitting an argument.");
            $scope.reloadTopics();
            setTimeout(function(){
                $scope.composingArgumentModal.hide();
            }, 500);
        });
    }

    $scope.onClear = function() {
        confirm('Clear All', 'Do you really want to clear all input?', 'Clear All', function(){

            $scope.gameData.argument.components.splice(0,$scope.gameData.argument.components.length);
            $.each(boilerplate, function(k,v){
                $scope.gameData.argument.components.push(v);
            });
            scrollDelegate.resize();
            scrollDelegate.scrollTop(true);

        });
    }

    // Stores the components ({type:,body:}) currently selected by the user
    var _selection = [];

    $scope.pointsForVerifiableInput = function() {
        return 40;
    }

    $scope.pointsForNonVerifiableInput = function () {
        return 40;
    }

    $scope.costsForSkip = function() {
        return 40;
    }

    $scope.countdownDuration = function() {
        return 0;
    }

    $scope.incorrectInputMessage = function() {
        return "That is no good argument!";
    }

    $scope.correctInputMessage = function() {
        return "Thanks for that!";
    }

    $scope.inputCorrectnessVerifiable = function() {
        return false;
    }

    var invalidDueToTooShort,
        invalidDueToTooLong,
        invalidDueToMissingStance,
        invalidDueToMissingClaim,
        invalidDueToMissingPremise,
        indexOfInvalidComponent;

    $scope.inputIsValid = function() {
        var premiseExists = NO,
            claimExists = NO;

        // Reset All
        invalidDueToTooShort = NO;
        invalidDueToTooLong = NO;
        invalidDueToMissingClaim = NO;
        invalidDueToMissingStance = NO;
        invalidDueToMissingPremise = NO;
        indexOfInvalidComponent = NO;

        if (!$scope.gameData.argument.stance || $scope.gameData.argument.stance.length==0) {
            invalidDueToMissingStance = YES;
        }

        indexOfInvalidComponent = -1;
        angular.forEach($scope.gameData.argument.components, function (comp,key) {
            var len = comp.body.length;
            if (comp.type==kComponentTypeClaim && len) claimExists = YES;
            if (comp.type==kComponentTypePremise && len) premiseExists = YES;
            if (comp.type==kComponentTypePremise && len && len < kComponentMinimumLength) {
                invalidDueToTooShort = YES;
                indexOfInvalidComponent = key;
                return;
            } else if (comp.type==kComponentTypePremise && len > kComponentMaximumLength) {
                indexOfInvalidComponent = key;
                invalidDueToTooLong = YES;
                return;
            }
        });

        invalidDueToMissingPremise = !premiseExists;
        invalidDueToMissingClaim = !claimExists;

        var valid = !invalidDueToMissingPremise && !invalidDueToMissingClaim && !invalidDueToTooLong && !invalidDueToTooShort && !invalidDueToMissingStance;

        if (!valid) {
            if (invalidDueToMissingClaim) {
                angular.element('.input-field-'+kComponentTypeClaim).focus();
            } else {
                angular.element('#input-field-'+indexOfInvalidComponent).focus();
            }
        }

        return valid;
    }

    $scope.output = function() {
        return $scope.gameData.argument;
    }

    $scope.invalidInputMessage = function(){
        if (invalidDueToMissingClaim) {
            return "The claim of your argument is missing! Add a claim before you continue.";
        } else if (invalidDueToMissingPremise) {
            return "Your argument must have at least one reason! Add a reason before you continue.";
        } else if (invalidDueToTooLong) {
            return "That one part of your argument is too long! Shorten it a bit before you continue.";
        } else if (invalidDueToTooShort) {
            return "That one part of your argument is too short! Extend it a bit before you continue.";
        } else if (invalidDueToMissingStance) {
            return "What is the stance of your argument? Please choose either Pro or Contra.";
        } else {
            return "That argument you have composed is not valid. Correct it before continuing.";
        }
    }

    $scope.$parent.setRoundControllerScope($scope);
});
