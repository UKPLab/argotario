kValidFallacyId = 'aed81f1b-b190-4076-9f38-601ef9f4b371';
kComponentMinimumLength = 15;
kComponentMaximumLength = 1024;
kComponentTypeClaim = 'claim';
kComponentTerminology = {};
kComponentTerminology[kComponentTypeClaim] = 'claim';

angular.module('arg.game.roundcontrollers').controller('SessionController', function($scope,$translate,$ionicPopup,$ionicScrollDelegate,$localStorage,$interval,$q,$timeout,SessionStore,UserAccount,LanguageStore) {

    $scope.language = LanguageStore.activeLanguage().id;

    var _invalidDueToTooShort,
        _invalidDueToTooLong,
        _invalidDueToMissingStance,
        _invalidDueToMissingClaim,
        _invalidDueToMissingIndicator

    var passedSession = null;
    var repeat = false;

    $scope.gameData = {
        argument: null,
        active : false,
        args: null,
        article: null,
        indicator:null,
        allFallacies: null,
        domain: null,
        fallacy: null,
        gameOver: null,
        placeHolder: '',
        points: null,
        result: null,
        rewardMessage: null,
        resultMessage: null,
        rounds: null,
        stance: null,
        oppositeStance: null,
        topic: null,
        users:null
    };

    //If the player is not the active one, finish the round immediately when clicking the continue-button
    $scope.continuesImmediately = function() {
        return !$scope.gameData.active;
    };

    $scope.countdownDuration = function() {
        return 0;
    };

    //returns a fallacy-type document given an id
    $scope.fallacyForId = function(id) {
        if (id) {
            for(var i=0; i<$scope.gameData.allFallacies.length; i++) {
                if ($scope.gameData.allFallacies[i]._id == id)
                    return $scope.gameData.allFallacies[i];
            }
        }
        return null;
    };

    $scope.gameIsOver = function() {
        return ($scope.gameData.session && $scope.gameData.session.ticker == null)
    };

    $scope.getLastArgument = function() {
        var lastArgument = null;
        if ($scope.gameData.args.length > 0) lastArgument = $scope.gameData.args[$scope.gameData.args.length -1];
        return lastArgument;
    };

    $scope.imActive = function(session) {
        var username = UserAccount.username();
        return (session.users[session.active] == username);
    };

    //add the fallacy-types to the arguments, which were assigned during the session, either by oneself or the opponent, depending on parameter 'own'
    $scope.indicateArgs = function(own) {
        var session = $scope.gameData.session;
        var user = UserAccount.username();
        var indicators = null
        if (session.users['0'] == user) {
            if (own)
                indicators = session.indicators['0'];
            else
                indicators = session.indicators['1'];
        } else if (session.users['1'] == user) {
            if (own)
                indicators = session.indicators['1'];
            else
                indicators = session.indicators['0'];
        }
        var arg = null;
        for (var i=0; i<$scope.gameData.args.length; i++) {
            arg = $scope.gameData.args[i];
            if (!arg.indicator)
                arg.indicator = {'own' : null, 'opponent' : null}
            indicator = indicators[i];
            indicator = $scope.fallacyForId(indicator);
            if (own)
                arg.indicator.own = indicator
            else
                arg.indicator.opponent = indicator
        }
    };

    $scope.isLastArgument = function(id) {
        var lastArgument = null;
        if ($scope.gameData.args.length > 0) lastArgument = $scope.gameData.args[$scope.gameData.args.length -1];
        if (lastArgument && lastArgument._id == id) return lastArgument;
        return null;
    };

    $scope.isNotValidArg = function(fallacyId) {
        return kValidFallacyId != fallacyId;
    };

    $scope.isSkippable = function() {
		return false;
    };

    $scope.minimumAssumedPlayingTime = function () {
        return 1;
    };

    //gets called when a fallacy-type of the indicator-list is tapped
    $scope.clickFallacy = function(fallacy) {
        if (fallacy) {
            if ($scope.gameData.indicator)
                $scope.gameData.indicator.selected = null;
            $scope.gameData.indicator = fallacy;
            $scope.gameData.indicator.selected = true;
        }
    };

    $scope.repeat = function() {
        return repeat;
    };

    //gets called when the argument is tapped. Opens the fallacy-type indicator-list if it is the last argument of the opponent.
    $scope.onArgumentTap = function(id, event) {
        if ($scope.indicatorPopup) $scope.indicatorPopup.close();

        if (!$scope.gameData.active) return;
        var lastArgument = $scope.isLastArgument(id);
        if (lastArgument) {
            $scope.indicatorPopup = $ionicPopup.show({
                template: '<div class="scroll"><div class="list card" ng-repeat="fallacy in $parent.gameData.allFallacies">'
                            + '<div ng-class="{\'highlighted-fallacy\': fallacy.selected}">'
                            + '<arg-fallacy model="fallacy" ng-click="clickFallacy(fallacy)"></arg-fallacy></div></div>',
                title: $translate.instant("TAP_THE_ARGUMENT_TYPE"),
                scope: $scope,
                buttons: [
                    { text: "<b>"+$translate.instant('SAVE')+"</b>",
                      type: 'button-positive',
                      onTap: function(e) {
                        return $scope.gameData.indicator;
                    }
                    }]
            });
            $scope.indicatorPopup.then(function (fallacy) {
                if (fallacy){
                    lastArgument.animation = false;
                    lastArgument.indicator.own = fallacy;
                    $scope.indicatorPopup = null;
                }
            });
        }
    };

    $scope.onComponentTap = function(idx,component,event) {
    };

    $scope.oppositeStance = function(stance) {
        if (stance == "pro") return "contra";
        if (stance == "contra") return "pro";
        return null;
    };

    //returns the username of the opponent for the actual session
    $scope.getOpponent = function() {
        if ($scope.gameData.session){
            me = UserAccount.username();
            users = $scope.gameData.session['users']
            if (me == users[0])
                return users[1];
            else
                return users[0];
        }
    };

    //defines the output of this round, i.e. the session-object which gets then available to the SessionSelect-round
    //This is necessary to update the lists
    $scope.output = function() {
        return $scope.gameData.session;
    };

    $scope.iWin = function() {
        return ($scope.gameData.session.out_winner == UserAccount.username());
    }
    $scope.draw = function() {
        return ($scope.gameData.session.out_winner instanceof Array)
    }
    $scope.iLose = function() {
        return !$scope.draw() && ($scope.gameData.session.out_winner != UserAccount.username());
    }
    $scope.iGotRewarded = function() {
        return ($scope.gameData.session.out_rewarded && ($scope.gameData.session.out_rewarded.indexOf(UserAccount.username()) != -1));
    }

    //sets the headline for an inactive session
    $scope.setResultMessage = function() {

        opponent = $scope.getOpponent();
        winner = '<p class="win"><strong>'+$translate.instant("YOU_WIN")+'</strong></p>';
        draw = '<p class="draw"><strong>'+$translate.instant("DRAW")+'</strong></p>';
        loser = '<p class="lose"><strong>'+$translate.instant("YOU_LOSE")+'</strong></p>';

        timeout = '<p>('+$translate.instant("THE_GAME_TIMED_OUT")+')</p>';

        pending = '<p>'+$translate.instant("OTHER_PLAYERS_HAVE_A_LOOK")+'</p>'
                        + '<p>'+$translate.instant("THE_POINTS_MIGHT_CHANGE")+'</p>'
                        + '<p>'+$translate.instant("FOR_NOW_THE_RESULT_IS_THIS")+':</p>';

        points =        '<p><strong>'+$translate.instant("YOU")+':</strong> '
                        + '<span style=\"font-family: Helvetica\" class=\"session-result-mini-coin\">₳</span> '
                        + '<span class=\"session-result-points\">' + $scope.gameData.result.own + '</span></p>'
                        + '<p><strong>' + opponent + ':</strong> '
                        + '<span style=\"font-family: Helvetica\" class=\"session-result-mini-coin\">₳</span> '
                        + '<span class=\"session-result-points\">' + $scope.gameData.result.opponent + '</span></p>'


        if ($scope.gameData.session.out_winner) {
            if ($scope.iWin()) $scope.gameData.resultMessage = winner;
            else if ($scope.iLose()) $scope.gameData.resultMessage = loser;
            else $scope.gameData.resultMessage = draw;

            if ($scope.gameData.session.timeout)
                $scope.gameData.resultMessage += timeout;
        } else
            $scope.gameData.resultMessage = pending;
        $scope.gameData.resultMessage += points;
    }


    //sets the headline if a user has to be payed for a session and actually pays him by calling the plugin-function on the database.
    $scope.reward = function() {
        if ($scope.gameData.session.out_winner && !$scope.iGotRewarded()) {
            $scope.gameData.rewardMessage = '<p>Your <strong><i class="ion-cash"></i></strong> is payed right now!</p>';

            var points = $scope.gameData.result.own

            console.log('Adding reward-points', points);
            reward = SessionStore.reward({s_id : $scope.gameData.session._id, u_id: UserAccount.username()});
            reward.then(function(session){
                if (session) {
                    UserAccount.addPoints(points);
                    $scope.gameData.session.out_rewarded = session.out_rewarded;
                }
            });
        }
    }

    //gets called if the session is inactive and the indicators of both players can be shown
    //sets these indicators, coins and the necessary headline-messages
    $scope.revealSolution = function() {
        if ($scope.gameIsOver()) {
            $scope.indicateArgs(false);
            $scope.setFallacies();
            $scope.setPoints();
            $scope.setResultMessage();
            $scope.reward();
            $scope.clickHelp();
            return true;
        }
        return false;
    };

    //reset gamedata. This is necessary since this round does not get destroyed.
    //when the player choses a session in the round SessionSelection, this controller gets active again
    $scope.roundDidEnd = function() {
        $scope.gameData.argument = null;
        $scope.gameData.active = false;
        $scope.gameData.args = null;
        $scope.gameData.allFallacies = null;
        $scope.gameData.domain = null;
        $scope.gameData.fallacy = null;
        $scope.gameData.gameOver = null;
        $scope.gameData.indicator = null;
        $scope.gameData.placeHolder = '';
        $scope.gameData.points = null;
        $scope.gameData.result = null;
        $scope.gameData.resultMessage = null;
        $scope.gameData.rewardMessage = null;
        $scope.gameData.rounds = null;
        $scope.gameData.stance = null;
        $scope.gameData.oppositeStance = null;
        $scope.gameData.topic = null;
        $scope.gameData.users = null;

        $interval.cancel($scope.bgTask);
    };

    $scope.roundWillStart = function() {
        repeat = false;
        passedSession = $scope.previousOutput;
        console.log('passed session', passedSession);

        var promise = null;
        //get existing session if id passed from the SessionSelect-controller or create new one
        if (passedSession != null) promise = SessionStore.sessionById({id: passedSession._id});
        else promise = SessionStore.openSession({language: $scope.language});

        promise.then(function(session) {
            if (passedSession) {
                $scope.gameData.session = passedSession;
                $scope.updateSession(session);
            } else $scope.gameData.session = session;

            console.log('DOWNLOADED SESSION', $scope.gameData.session);
            $scope.gameData.domain = valueForKeyPath( session, '&belongsTo[0]' );
            $scope.gameData.topic = valueForKeyPath( session, '&refersTo[0]' );
            $scope.gameData.users = valueForKeyPath( session, '&users' );
            $scope.gameData.article = valueForKeyPath( session, '&references[0]' );
            $scope.gameData.args = valueForKeyPath( session, '&args' ) || [];
            $scope.gameData.allFallacies = valueForKeyPath( session, '&allFallacies' );
            $scope.gameData.rounds = (session.ticker != null) ? session.ticker+1 : null;

            $scope.gameData.active = $scope.imActive(session);
            $scope.gameData.gameOver = $scope.gameIsOver();
            $scope.setStance();
            $scope.indicateArgs(true);

            if ($scope.gameData.active) {
                //my turn to write an argument
                if (session.ticker>0) {
                    $scope.setArgument();
                }
                //set animation for enemies last argument which can be marked as fallacious
                var lastArg = $scope.getLastArgument();
                if (lastArg) lastArg.animation = true;
            } else {
                $scope.unsetArgument();
                if ($scope.gameIsOver()) {
                    $scope.revealSolution();
                } else {
                    $scope.bgTask = $scope.checkForUpdates();
                }
            }
            $scope.clickHelp();

            $scope.prepareDidFinish();
        }, function (e) {
            console.log("FAILED!",e);
            alert("Oh no!",
                  "Downloading the game data failed!",
                  "Dismiss");
        });
    };

    //initializes the text-field for insert
    $scope.setArgument = function() {
        var fallacy = $scope.gameData.session.fallacy_choice[0];
        fallacy = $scope.fallacyForId(fallacy)
        $scope.gameData.fallacy = fallacy;

        var topicId = $scope.gameData.session.out_refersTo;

        var boilerPlate = {
            components: [{type:kComponentTypeClaim, body:''}],
            stance: '',
            _editorial: false,
            fallacyId: fallacy._id,
            context: true,
            out_refersTo: topicId,
            out_language: $scope.language
        };
        $scope.gameData.argument = boilerPlate;

    };

    //gets called when a player wants to swap the fallacy-type. Each session holds an array of two possible types (like [ATE, RH]).
    $scope.nextFallacy = function() {
        if ($scope.gameData.argument) {
            var fallacy = null
            if ($scope.gameData.fallacy['_id'] == $scope.gameData.session.fallacy_choice[0])
                fallacy = $scope.gameData.session.fallacy_choice[1]
            else
                fallacy = $scope.gameData.session.fallacy_choice[0]

            fallacy = $scope.fallacyForId(fallacy)
            if (fallacy) {
                $scope.gameData.fallacy = fallacy;
                $scope.gameData.argument.fallacyId = fallacy._id;
                $scope.clickHelp();
                return fallacy
            }
        }
        return null
    };

    //sets the true fallacy of an argument, if known
    $scope.setFallacies = function(own) {
        var arg = null;
        for (var i=0; i<$scope.gameData.args.length; i++) {
            arg = $scope.gameData.args[i];
            if (arg.out_fallacyType)
                arg.fallacy = $scope.fallacyForId(arg.out_fallacyType)
            else
                arg.fallacy = $scope.fallacyForId(arg.fallacyId)
        }
    };

    //when the game is over the points are set here, either the assumed ones if not finally judged or the correct ones
    $scope.setPoints = function() {
        var arg = null;
        var result = {'own' : 0, 'opponent' : 0};
        var user = 0;

        for (var i=0; i<$scope.gameData.args.length; i++) {
            arg = $scope.gameData.args[i];
            //pending means, that the point is not final, because
            //a gold-label does not yet exist
            arg.point = {
                own : { set : false, pending : true},
                opponent : { set : false, pending : true}
            }
            compareTo = arg.fallacyId
            if (arg.out_fallacyType) {
                arg.point.own.pending = false
                arg.point.opponent.pending = false
                compareTo = arg.out_fallacyType
            }
            if (arg.indicator.own && arg.indicator.own._id == compareTo) {
                arg.point.own.set = true;
                result.own += 1
            }
            if (arg.indicator.opponent && arg.indicator.opponent._id == compareTo) {
                arg.point.opponent.set = true;
                result.opponent += 1
            }
        }

        $scope.gameData.result = result;
    };

    //set the stance of the active player.
    //Is the stance of the first argument, if the player wrote it, or the opposite stance.
    $scope.setStance = function() {
        //stance exists, because other player chose a side
        if ($scope.gameData.args.length > 0) {
            var firstStance = $scope.gameData.args[0].stance;
            var username = UserAccount.username();
            if ($scope.gameData.session.users[0] == username) {
                $scope.gameData.stance = firstStance;
                $scope.gameData.oppositeStance = $scope.oppositeStance(firstStance);
            }
            else {
                $scope.gameData.oppositeStance = firstStance;
                $scope.gameData.stance = $scope.oppositeStance(firstStance);
            }
        }
        return $scope.gameData.stance;
    };

    $scope.showHelp = function() {
        if ($scope.gameData.resultMessage)
            return {
                template: '<p ng-bind-html="gameData.resultMessage"></p>',
                subtitle: '<p class=\"big\">'+$translate.instant("THE_GAME_IS_OVER")+'</p>'
            }
            else {
                if ($scope.gameData.active) {
                    if (!$scope.gameData.fallacy) {
                        return {
                            template: $translate.instant("JUST_MARK_THE_LAST_ARGUMENT"),
                            subtitle: '<h3>'+$translate.instant("LAST_ROUND")+'</h3>'
                        };
                    }
                    return {
                        template: '<arg-fallacy model="gameData.fallacy"></arg-fallacy>',
                        subtitle: '<h3>'+$translate.instant("WRITE_AN_ARGUMENT_OF_THIS_TYPE")+'</h3>'
                    };
                } else {
                    return {
                        template: "{{'WONT_TAKE_LONG'|translate}}",
                        subtitle: '<h3>'+$translate.instant("WAIT_FOR_OPPONENT")+'</h3>'
                    };
                }
            }
    };

    //This is the background-function which checks periodically for updates to the actual game-session and performs them as necessary.
    //This is especially useful when the virtual player is activated and the session gets updated in about 5 seconds.
    //In this case the user can immediately continue playing
    $scope.checkForUpdates = function() {
        var date = $scope.gameData.session._timestamp;
        return $interval(function() {
            console.log('checking for updated session!!!!!!!!!!!11 in round itself');
            var params = [];
            downloadSession = SessionStore.sessionById({
                    id: $scope.gameData.session._id
            });
            downloadSession.then(function (sessionUpdated) {
                console.log('got updated session', sessionUpdated)
                if (sessionUpdated._timestamp > date) {
                    $scope.updateSession(sessionUpdated);
                    repeat = true;
                    $scope.clickToggle($scope, null);
                }
            });
            }, 5000);
    };

    //unset the text-field if the user is not active
    $scope.unsetArgument = function() {
        $scope.gameData.argument = null;
        $scope.gameData.fallacy = null;
        $scope.gameData.placeHolder = null;
    };

    //Replace the old session-object with the updated one, if the other user wrote his argument or if this user did his turn.
    //This does also update the view of the SessionSelection-round, as it holds a reference to the original object.
    $scope.updateSession = function(session) {
        angular.copy(session, $scope.gameData.session);
    };

    //If the player is the first active one, he has to chose one stance. Watch if he chose a side.
    $scope.$watch('gameData.stance', function () {
        console.log('stance changed');
        if ($scope.gameData.argument)
            $scope.gameData.argument.stance = $scope.gameData.stance;
    });

    //save the argument if one was written, as well as the indicator on the previus opponents argument.
    $scope.submitData = function() {

        var updateSession = null;
        // only an indicator is submitted
        if ($scope.gameData.session.ticker == 0) {
            return SessionStore.argue({s_id: $scope.gameData.session._id, indicator: $scope.gameData.indicator._id}).then(function (session) {
                            $scope.updateSession(session);
                            console.log("arguing done", session);
                        }, function(err){console.log('arguing failed', err)});
        } else {
            // submit arg + indicator
            if (BaasBox.objectMatchesModelScheme($scope.gameData.argument, {components: [],stance: 'string',fallacyId: 'string'})) {
                    $scope.gameData.submitting = true;

                    var indicator = $scope.gameData.indicator ? $scope.gameData.indicator._id : null
                    var saveArg = BaasBox.save(preparedForSaving($scope.gameData.argument), kCollectionArguments);
                    var argue = saveArg.then(function(arg) {
                        SessionStore.argue({s_id: $scope.gameData.session._id, a_id: arg._id, indicator: indicator}).then(function(session) {
                        console.log('argue -> success');
                        $scope.updateSession(session);
                        $scope.gameData.submitting = false;
                        repeat = true;
                    }, function (e) {
                        console.log("FAILED!",e);
                        alert($translate.instant("OH_NO"),
                        $translate.instant("MAYBE_SERVER_IS_DOWN"),
                        $translate.instant("DISMISS"));
                    })}, function(e) {
                        console.log("FAILED!",e);
                        alert($translate.instant("OH_NO"),
                        $translate.instant("MAYBE_SERVER_IS_DOWN"),
                        $translate.instant("DISMISS"));
                    });
                    return $q.all([argue])
                } else alert($translate.instant("INVALID_ARGUMENT"),
                      $translate.instant("ARGUMENT_IS_SOMEHOW_INVALID"));
            }
    };

    $scope.onComponentChange = function(component,tabIndex) {
        var element = document.getElementById("arg-textarea-"+tabIndex);
        element.style.height = element.scrollHeight + "px";

        var previousTextAreaHeight = $scope.previousTextAreaHeight;
        if (!previousTextAreaHeight || previousTextAreaHeight != element.style.height) {
            $scope.previousTextAreaHeight = element.style.height;
        }
    };

    $scope.pointsForNonVerifiableInput = function() {
        var points = 0;
        if ($scope.gameData.argument != null)
            points +=2;
        if ($scope.gameData.indicator != null)
            points +=1
        return points;
    };

    $scope.correctInputMessage = function() {
        return $translate.instant("THANKS");
    };

    $scope.inputCorrectnessVerifiable = function() {
        return false;
    };

    $scope.inputIsValid = function() {
        console.log('CHECKING FOR INPUTISVALID')

        // Reset All
        _invalidDueToTooShort = NO;
        _invalidDueToTooLong = NO;
        _invalidDueToMissingClaim = NO;
        _invalidDueToMissingStance = NO;
        _invalidDueToMissingIndicator = NO;
        _invalidDueToMissingIndicator = NO;
        _invalidDueToMissingIndicator =  ($scope.gameData.args.length > 0) && $scope.gameData.indicator == null;

        if ($scope.gameData.session.ticker == 0) return !_invalidDueToMissingIndicator;


        if (!$scope.gameData.argument.stance || $scope.gameData.argument.stance.length==0) {
            _invalidDueToMissingStance = YES;
        } else {
            angular.forEach($scope.gameData.argument.components, function (comp,key) {
                var len = comp.body.length;
                console.log('am i in hiere?', len);
                if (comp.type==kComponentTypeClaim) {
                    _invalidDueToMissingClaim = NO;
                    if (len < kComponentMinimumLength) {
                        _invalidDueToTooShort = YES;
                        return;
                    }
                    if (len > kComponentMaximumLength) {
                        _invalidDueToTooLong = YES;
                        return;
                    }
                }
            });
        }

        var valid = !_invalidDueToMissingClaim && !_invalidDueToTooLong && !_invalidDueToTooShort && !_invalidDueToMissingStance && !_invalidDueToMissingIndicator;

        return valid;
    };

    $scope.invalidInputMessage = function() {
        if (_invalidDueToMissingClaim) {
            return $translate.instant("ARGUMENT_IS_MISSING");
        } else if (_invalidDueToTooLong) {
            return $translate.instant("ARGUMENT_TOO_LONG");
        } else if (_invalidDueToTooShort) {
            return $translate.instant("ARGUMENT_TOO_SHORT");
        } else if (_invalidDueToMissingStance) {
            return $translate.instant("STANCE_IS_MISSING");
        } else if (_invalidDueToMissingIndicator) {
            return $translate.instant("WHAT_IS_ENEMYS_ARGUMENT");
        }
        else {
            return $translate.instant("ARGUMENT_IS_SOMEHOW_INVALID");
        }
    };

    $scope.$parent.setRoundControllerScope($scope);
});
