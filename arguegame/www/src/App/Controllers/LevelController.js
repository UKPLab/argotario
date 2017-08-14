angular.module("ui.controllers").controller("LevelController", function($scope,$translate,$ionicPopup,$ionicSlideBoxDelegate,$ionicActionSheet,UserAccount, $ionicCustomModal, $ionicPopover, $timeout, EventStore){

    var levelSlideBox;

    $timeout(function () {
        levelSlideBox = $ionicSlideBoxDelegate.$getByHandle('LevelSlideBox');
    });

    var _outputOfPreviousRound = null;

    var _currentRoundIdx = 0;
    var _roundControllers = [];

    $scope.data = $scope.currentLevel; // currentLevel is set on the WorldController
    console.log('level is completable', $scope.data.completable);

// - - - Level Lifecycle methods - - -

    $scope.levelWillOpen = function() {
        console.log("Level will open.");
    };

    $scope.levelDidOpen = function() {
        console.log("Level did open.");
        console.log('LEVELSCOPE IS', $scope);
    };

    $scope.levelWillClose = function() {
        console.log("Level will close.");
        $scope.levelCompleteModal.hide();
    };

    $scope.levelDidClose = function() {
        console.log("Level did close.");
    };

// - - - Public methods - - -

    // Defines the number of coins in the coin stack after finishing a round
    $scope.visibleCoins = 6;

    $scope.start = function() {
        console.log("Starting level...");

        $scope.translationData = {skipCosts: Math.abs( $scope.currentRoundController().costsForSkip() )};

        $ionicCustomModal.fromTemplateUrl('Views/LevelComplete.html', {
            scope: $scope,
            animation: 'bounceInUp'
        }).then(function(modal) {
            $scope.levelCompleteModal = modal;
        });

        // Subscribe to user points change event
        $scope.currentPoints = UserAccount.points();

        // Subscribe to Points changes
        var pointsChangedCallback = function (presentedPoints) {
            $scope.currentPoints = presentedPoints;// Which is smaller or equal to UserAccount.points();
            $scope.$apply();
        };

        $scope.$on(kUserAccountPointsAreChanging, function (_,temporaryUserPoints) {
            pointsChangedCallback(temporaryUserPoints);
        });
        $scope.$on(kUserAccountPointsDidChange, function (_,finalUserPoints) {
            pointsChangedCallback(finalUserPoints);
        });

        // Pre-load data of all rounds.
        var roundPromise = _roundControllers[0].preloadData();
        for(var i=0; i<_roundControllers.length; i++) {
            if (_roundControllers[i+1]) {
                roundPromise = roundPromise.then(_roundControllers[i+1].preloadData);
            }
        }

        $scope.startRound(0);
    };

    //return key, function and params for the background-function defined in the roundcontroller
    $scope.getBackgroundTasks = function() {
        var bgTasks = {};
        for(var i=0; i<_roundControllers.length; i++) {
            if (_roundControllers[i].backgroundTask) {
                identifier = $scope.currentLevel.id + '/' + $scope.data.rounds[_currentRoundIdx].id;
                bgTasks[identifier] = _roundControllers[i].backgroundTask;
            }
        }
        return bgTasks;
    };

    $scope.end = function() {
        console.log('level end');
    };

    $scope.startRound = function(roundIndex) {

        _currentRoundIdx = roundIndex;

        $scope.currentRound = $scope.data.rounds[_currentRoundIdx];

        $scope.visibleCoins = 6;

        // Prepare the next round
        console.log("Current Round Controller: ",$scope.currentRoundController());

		$scope.previousOutput = _outputOfPreviousRound;

        $scope.currentRoundController().roundWillStart();

        $scope.roundStartTimestamp  = new Date();

        $scope.correctInputMessage  = $scope.currentRoundController().correctInputMessage();
        $scope.incorrectInputMessage= $scope.currentRoundController().incorrectInputMessage();
        $scope.acceptedInputMessage = $scope.currentRoundController().acceptedInputMessage();

        $scope.footer =  $scope.currentRoundController().setFooter();

        $scope.currentRoundController().enableCheckButton();

        reloadModals();

        // Switch to the next slide
        levelSlideBox.slide(_currentRoundIdx,500);

        $timeout(function () {
            $scope.currentRoundController().start();
            $scope.currentRoundController().roundDidStart();
            $scope.currentRoundController().scrollUp();
        }, 200);
    };

    $scope.backgroundTasks = function() {
        return _backgroundTasks;
    }

    $scope.hideModalAnimated = function(modal) {
            try {
                modal.$el.find('.custom-modal').removeClass('bounceInUp').removeClass('slide-in-up').addClass('bounceOutDown');
                $timeout(function () {
                    modal.hide();
                },500).then($scope.currentRoundController().modalDidClose());
            } catch(e){}
    };

    $scope.endCurrentRound = function() {
        $timeout(function () {
            $scope.currentRoundController().roundWillEnd();

            _outputOfPreviousRound = $scope.currentRoundController().output();
            $scope.currentRoundController().end();
            $scope.currentRoundController().preparing();
            $scope.currentRoundController().roundDidEnd();

            // Defer it slightly for the animations.
            var delay = $scope.currentRoundController().continuesImmediately() ? 0 : 500;
            $timeout(nextRound, delay);
        } ,200);

    };

    $scope.outputOfPreviousRound = function() {
        return _outputOfPreviousRound;
    };

    // Called in ng-init in the view of a RoundController scope. Needed for Round Lifecycle management.
    $scope.registerRoundController = function(roundScope, idx) {
        _roundControllers[idx] = roundScope;
        if (idx+1 == $scope.data.rounds.length)
            $scope.registeringRoundControllerHasFinished = true;
    };

    $scope.currentRoundIndex = function() {
        return _currentRoundIdx;
    };

    $scope.numberOfRounds = function() {
        return $scope.data.rounds.length;
    };

    $scope.currentRoundController = function () {
        return _roundControllers[_currentRoundIdx];
    };

    $scope.userDidComplete = function() {
        var completed = _currentRoundIdx == $scope.data.rounds.length;
        return completed;
    };
// - - - Private methods - - -

    // Switch to the next round of the level
    function nextRound() {

        if (!$scope.currentRoundController().repeat()) {
            console.log("Level progress: Switch from round #",
                    _currentRoundIdx,
                    "to #",
                    _currentRoundIdx+1);
            _currentRoundIdx++;
        }

        var levelComplete = _currentRoundIdx == $scope.data.rounds.length;

        if (levelComplete) {
            if ($scope.data.completable) {
                $scope.levelCompleteModal.show();
            } else {
                _currentRoundIdx = 0;
                $scope.startRound(_currentRoundIdx);
            }
        } else {
            $scope.startRound(_currentRoundIdx);
        }
    }

    $scope.setShownPoints = function (coins) {
        $scope.shownPoints = coins;
    }

    function reloadModals() {
        $scope.setShownPoints(0);

        if ($scope.successModal) {
            $scope.successModal.remove();
        }

        function makeModalInline(modal) {
            modal.$el.remove();
            modal.$el.addClass('inline-modal');

            var parentModal = angular.element('ion-modal-view[ng-controller="LevelController"]');

            (function (org) {
                modal.orgShow = org;
                modal.show =  function() {
                    modal.orgShow(); // Let ionic do the stuff internally
                    //Move the modal HTML node inside the current Level Modal, next to the footer bar.
                    parentModal.find('ion-slide[data-index="'+_currentRoundIdx+'"] ion-footer-bar').parent().append(modal.$el);
                }
            })(modal.show);
        }

        $ionicCustomModal.fromTemplateUrl('Views/RoundSuccess.html', {
            scope: $scope,
            animation: 'bounceInUp',
            backdropClickToClose: false
        }).then(function(modal) {
            makeModalInline(modal);
            $scope.successModal = modal;
        });

        if ($scope.failureModal) {
            $scope.failureModal.remove();
        }

        $ionicCustomModal.fromTemplateUrl('Views/RoundFailure.html', {
            scope: $scope,
            animation: 'bounceInUp',
            backdropClickToClose: false
        }).then(function(modal) {
            makeModalInline(modal);
            $scope.failureModal = modal;
        });

        if ($scope.doneModal)
            $scope.doneModal.remove();

        $ionicCustomModal.fromTemplateUrl('Views/RoundDone.html', {
            scope: $scope,
            animation: 'bounceInUp',
            backdropClickToClose: false
        }).then(function(modal) {
            makeModalInline(modal);
            $scope.doneModal = modal;
        });

        $scope.popupHelp = function(template, subtitle) {
            if ($scope.helpPopup) $scope.helpPopup.close();
            $scope.helpPopup = $ionicPopup.show({
                template: template,
                title: '',
                subTitle: subtitle,
                scope: $scope.currentRoundController(),
                buttons: [
                    { text: '<b>Ok</b>',
                      type: 'button-positive',
                      onTap: function(e) {
                        return '';
                    }
                    }]});
            $scope.helpPopup.then(function(modal) {
                $scope.helpPopup = null;
            });
        };
    };

// - - - User Interface Actions - - -
    $scope.clickReportData = function() {
        confirm($translate.instant("FLAG_DATA"),
                $translate.instant("IS_THIS_SPAM"),
                $translate.instant("REPORT_DATA"),
                function () {
                    var data = {
                        concern: 'roundData',
                        roundData: $scope.currentRoundController().gameData,
                    };

                    BaasBox.save(preparedForSaving(data), kCollectionSpamReports).done(function (res) {
                        alert($translate.instant("THANKS"),
                              $translate.instant("WE_WILL_HAVE_A_LOOK"),
                              $translate.instant("DISMISS"));
                    }).fail(function (err) {
                        alert($translate.instant("REPORTING_DATA_FAILED"),
                              $translate.instant("SOMETHING_WENT_WRONG_REPORTING_DATA"),
                              $translate.instant("DISMISS"));
                        console.log("Reporting failed:",err);
                    })
                });
    }

    $scope.clickSkipRound = function() {
        var skippable = Math.abs( $scope.currentRoundController().isSkippable() );
        var requiredCoins = Math.abs( $scope.currentRoundController().costsForSkip() );
        var skippingAffordable = UserAccount.points() -requiredCoins >= 0;

        EventStore.storeEvent(kEventSkippedRound, {roundId:$scope.currentRoundController().data.id});

        if (!skippable) {
            alert($translate.instant("NO_WAY"),
                  $translate.instant("YOU_CANT_SKIP_THIS_ROUND"),
                  $translate.instant("DISMISS"));
        } else if (skippingAffordable) {
            confirm($translate.instant("SKIP_ROUND"),
              $translate.instant("DO_YOU_REALLY_WANT_TO_SKIP"),
              $translate.instant("SKIP"),
              function(){
                UserAccount.spendPoints(requiredCoins);
                $scope.endCurrentRound();
            });
        } else {
            alert($translate.instant("YOU_DONT_HAVE_ENOUGH_COINS"),
                  $translate.instant("YOU_NEED_AT_LEAST_X_COINS_TO_SKIP"),
                  $translate.instant("DISMISS"));
        }
    }

    $scope.$on('WillQuitLevel', function () {
        $scope.currentRoundController().roundWillEnd();

        _outputOfPreviousRound = $scope.currentRoundController().output();
        $scope.currentRoundController().end();
        $scope.currentRoundController().roundDidEnd();
    });

    /* This method should be bound to an element that moves the game to the next round. */
    $scope.clickContinue = function($scope,$event) {
        $scope.endCurrentRound();
    }

    $scope.userDidFail = function(){
        $ionicActionSheet.show({
         buttons: [
            { text: 'I\'m an expert but I had no clue' },
            { text: 'I\'m no expert and it was too hard' },
            { text: 'I\'m had no clue, and no luck' },
         ],
         titleText: 'Oh no, wrong! Why do you think did it you fail?',
         cancel: function() {
              // add cancel code..
            },
         buttonClicked: function(index) {
            $scope.nextGame();
            return true;
         }
       });
    };

    $scope.userDidSucceed = function(){
        $ionicActionSheet.show({
         buttons: [
            { text: 'I\'m a domain expert' },
            { text: 'I\'m no expert, but it was easy' },
            { text: 'I have no clue' },
         ],
         titleText: 'Yay! How did you know this?',
         //cancelText: 'Cancel',
         cancel: function() {
              // add cancel code..
            },
         buttonClicked: function(index) {
            $scope.nextGame();
            return true;
         }
       });
    };
});
