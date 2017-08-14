kComponentMinimumLength = 15;
kComponentMaximumLength = 1024;
kComponentTypeClaim = 'claim';
kComponentTypePremise = 'premise';
kComponentTerminology = {};
kComponentTerminology[kComponentTypeClaim] = 'claim';
kComponentTerminology[kComponentTypePremise] = 'reason';

angular.module('arg.game.roundcontrollers').controller('SessionJudgeController', function($scope,$translate, $ionicPopup,$ionicSlideBoxDelegate,$ionicActionSheet,$ionicScrollDelegate,$localStorage,$timeout, SessionStore,UserAccount,ArgumentStore,FallacyStore,EntityLinker, LanguageStore) {

    var _invalidDueToMissingIndicator;

    $scope.language = LanguageStore.activeLanguage().id;

    $scope.gameData = {
        session: null,
        args: [],
        allFallacies: null,
        article: null,
        domain: null,
        disallowed : false,
        rounds: -1,
        topic: null,
        votings: []
    };

    $scope.clickFallacy = function(fallacy) {
        console.log('clicking fallacy', fallacy);
        if (fallacy) {
            if ($scope.gameData.indicator)
                $scope.gameData.indicator.selected = null;
            $scope.gameData.indicator = fallacy;
            $scope.gameData.indicator.selected = true;
        }
    };

    $scope.onArgumentTap = function(id, event) {
        if ($scope.indicatorPopup) $scope.indicatorPopup.close();

            $scope.indicatorPopup = $ionicPopup.show({
                template: '<div class="list card" ng-repeat="fallacy in $parent.gameData.allFallacies">'
                            + '<div ng-class="{\'highlighted-fallacy\': fallacy.selected}">'
                            + '<arg-fallacy model="fallacy" ng-click="clickFallacy(fallacy)"></arg-fallacy></div></div>',
                title: $translate.instant("TAP_THE_ARGUMENT_TYPE"),
                scope: $scope,
                buttons: [
                    { text: '<b>Save</b>',
                      type: 'button-positive',
                      onTap: function(e) {
                        return $scope.gameData.indicator;
                    }
                    }]
            });
            $scope.indicatorPopup.then(function (fallacy) {
                if (fallacy) {
                    var arg = $scope.argumentWithId(id);
                    if (arg.animation) arg.animation = false;
                    arg.indicator = fallacy;
                    $scope.gameData.indicator.selected = null;
                    $scope.gameData.indicator = null;
                    $scope.indicatorPopup = null;
                }
            });
    };

    //calculates how many arguments did already receive a fallacy-type indicator.
    $scope.progress = function() {
        var count = 0;
        for(var i=0;i<$scope.gameData.args.length;i++) {
            if ($scope.gameData.args[i].indicator)
                count++;
        }
        return count;
    };


    $scope.argumentWithId = function(id) {
        if (id) {
            for(var i=0; i<$scope.gameData.args.length; i++) {
                if ($scope.gameData.args[i]._id == id)
                    return $scope.gameData.args[i];
            }
        }
        return null;
    };


    // Autor: CK
    // Check the REQUIRESPOINTS for a LEVEL
    // In the gameConfig exist a variable REQUIRESPOINTS
    // Function: checks if a user has reached a number of configurable required points, so that he is able to play this round.
    // @param:
    // @return:
    // TODO: This check should be moved into the levelcontroller

    /*
    $scope.allowedToPlay = function() {
        console.log('POIIOIIIIINTS', UserAccount.points())
        console.log($scope.data.requiresPoints)
        points = UserAccount.points();
        return (points >= $scope.data.requiresPoints);
    };
    */

    $scope.allowedToPlay = function() {
         console.log('World', UserAccount.completedLevelIndexesInWorldWithId('GreenWorld'))
         console.log($scope.data.requiresWorld)
         levels = UserAccount.completedLevelIndexesInWorldWithId('GreenWorld')
         l = levels.length
         console.log('Erfuellte Level', l)
         return (l >= $scope.data.requiresLevelsInGreenWorld)
    }


    $scope.fallacyForId = function(id) {
        if (id) {
            for(var i=0; i<$scope.gameData.allFallacies.length; i++) {
                if ($scope.gameData.allFallacies[i]._id == id)
                    return $scope.gameData.allFallacies[i];
            }
        }
        return null;
    };

    //excuse message if a player has judged all sessions
    $scope.notify = function(id, event) {
        var disallowedMsg = $translate.instant("YOU_NEED_MORE_COINS_TO_JUDGE");
        var emptyMsg = $translate.instant("YOU_HAVE_JUDGED_EVERYTHING");
        var msg = null

        if ($scope.disallowed)
            msg = disallowedMsg;
        else
            msg = emptyMsg;

        if ($scope.notififaction) $scope.notification.close();
        $scope.notification = $ionicPopup.show({
            template: '<div id="excuse-session-judge">'
                        + '<img src="Resources/Images/Betty-Support@2x.png">'
                        + '<p>' + msg + '</p>'
                    + '</div>',
            scope: $scope,
            buttons: [
                { text: '<b>OK!</b>',
                  type: 'button-positive'
                }]
            });
            $scope.notification.then(function () {
                $scope.clickEndLevel();
            });
    };

    $scope.roundWillStart = function() {
        if ($scope.allowedToPlay()) {
            console.log("Downloading data for round PlayerVsPlayerJudge");
            SessionStore.sessionJudgeable({language: $scope.language}).then(function (session) {
                console.log("Downloaded session: ",session);
                $scope.gameData.session = session;

                if ($scope.gameData.session) {
                    $scope.gameData.args = valueForKeyPath( session, '&args' );
                    $scope.gameData.article = valueForKeyPath( session, '&references[0]' );
                    $scope.gameData.domain = valueForKeyPath( session, '&belongsTo[0]' );
                    $scope.gameData.topic = valueForKeyPath( session, '&refersTo[0]' );
                    $scope.gameData.allFallacies = valueForKeyPath( session, '&allFallacies' );
                    $scope.prepareDidFinish();
                } else {
                    $scope.notify();
                }
            },function (err) {
                alert("Loading the session failed.");
                console.log(err);
            });
        } else {
            $scope.disallowed = true;
            $scope.notify()
        }
    };

    $scope.roundWillEnd = function() {
    };

    $scope.minimumAssumedPlayingTime = function () {
        return 2000;
    };

    $scope.showHelp = function() {
        return {
            template: '<arg-round-title>Mark all arguments!</arg-round-title>'
                    + '<div class="list card" ng-repeat="fallacy in $parent.gameData.allFallacies">'
                    + '<arg-fallacy model="fallacy"></arg-fallacy></div>',
            subtitle: ''
        };
    };

    $scope.continuesImmediately = function() {
        return !$scope.gameData.session;
    };

    $scope.submitData = function() {
        var votings = [];
        for (var i=0; i<$scope.gameData.args.length;i++) {
            votings.push($scope.gameData.args[i].indicator._id);
        }
        return SessionStore.judgeSession({
                votings: votings,
                s_id: $scope.gameData.session._id}).then(function (session) {});
    };

    $scope.termForComponentType = function(type) {
        return kComponentTerminology[type] || 'unknown';
    };

    $scope.pointsForNonVerifiableInput = function () {
        return $scope.gameData.args.length;
    }

    $scope.correctInputMessage = function() {
        return $translate.instant("THANKS");
    }

    $scope.isSkippable = function() {
		return false;
    };

    $scope.costsForSkip = function(){
        return 2;
    }

    $scope.countdownDuration = function() {
        return 0;
    }

    $scope.incorrectInputMessage = function() {
        $translate.instant("YOUR_INPUT_IS_INVALID");
    }

    $scope.inputCorrectnessVerifiable = function() {
        return false;
    }

    $scope.inputIsValid = function() {
        _invalidDueToMissingIndicator = NO;

        for (var i=0; i<$scope.gameData.args.length; i++) {
            if (!$scope.gameData.args[i].indicator) {
                _invalidDueToMissingIndicator = YES;
                $scope.gameData.args[i].animation = true;
                break;
            }
        }
        return !_invalidDueToMissingIndicator;
    }

    $scope.output = function() {
        return $scope.gameData.session;
    }

    $scope.invalidInputMessage = function() {
        if (_invalidDueToMissingIndicator) {
            return $translate.instant("YOU_DID_NOT_JUDGE_ALL_ARGUMENTS");
        }
    }

    $scope.$parent.setRoundControllerScope($scope);
});
