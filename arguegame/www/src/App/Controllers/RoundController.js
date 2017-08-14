kRoundControllerBackgroundEvent = "kRoundControllerBackgroundEvent"; // Posted by background-functions

/** Every round view is encapsulated by a RoundController scope, and thus, inherits the methods from it, which you need to overwrite in your round controllers. These methods will then be triggered by the user's actions. This way we have some kind of inherited methods as known from serious languages. */
angular.module('arg.game.roundcontrollers').controller('RoundController', function($scope,$rootScope, $translate, GameWorldStore,UserAccount, $ionicBackdrop,$ionicCustomModal,$timeout,$q,$ionicGesture,$ionicScrollDelegate,EventStore,SoundStore) {

	var _$childScope = null;
	$scope.roundControllerSubclassScope = null;
	$scope.countdownController = {};
    $scope.disabledCheckButton = false;
    _hideModalDelay = 2000;

    //round - data set in the LevelController
    $scope.data = $scope.currentRound;

// - - - Data Source methods - - -
// Overwrite these methods in the RoundController subclass to customize the behavior of the round.

	/* The value returned by this method defines the duration of the countdown used in the round.
	 * A value of 0 means that no countdown will be used.
	@return		int		The countdown duration in milliseconds.
	*/
	$scope.countdownDuration = function() {
		return 0;
	}

    $scope.repeat = function() {
		return false;
	}

    $scope.modalDidClose = function() {
        if (!$scope.toReveal)
            $scope.clickContinue($scope,null);
        else
            $scope.disabledCheckButton = false;
    }

	/** The value returned by the following method will be used as the delay parameter for the countdown of the round.
	@return		int		The number of milliseconds the countdown shall wait before starting counting down.
	*/
	$scope.countdownDelay = function() {
		return 2000;
	}

	/** The string returned by this method will be presented in an alert if the provided input is input is invalid.
	@return		string		The message you want to show.
	*/
	$scope.invalidInputMessage = function() {
		return "Please check your input. This seems to be invalid!";
	}

	/** The user input must be assessed and scored. It has been validated before, that is, the input is valid.
	 * Next, the input has been verified before, that is, we think we can reliably say that the input is CORRECT
	 * or INCORRECT.
	@return		int		The number of points the input is worth.
	*/
	$scope.pointsForVerifiableInput = function() {
		console.error("Calling pointsForVerifiableInput on super class RoundController.",
		"You should overwrite this method in the controller for the current round.");
		// Overwrite
		return 0;
	}

	/** The user input must be assessed and scored. It has been validated before, that is, the input is valid.
	 * However, when this method is called, we cannot reliably say whether the user's input was CORRECT or
	 * incorrect.
	 */
	$scope.pointsForNonVerifiableInput = function() {
		console.error("Calling pointsForNonVerifiableInput on super class RoundController.",
		"You should overwrite this method in the controller for the current round.");
		// Overwrite
		return 0;
	}

	/** Return the amount of coins required to skip the round.
	 * Return 0 if skipping is for free.
	 * @return		int		The number of points required for skipping this round.
  	 */
	$scope.costsForSkip = function(){
		console.error("Calling costsForSkip on super class RoundController.",
		"You should overwrite this method in the controller for the current round.");
		// Overwrite
		return 0;
	}

	/** Return true of false, whether the round is skippable or not.
	 * @return		boolean		The flag if the round is skippable
	 */
	$scope.isSkippable = function() {
		return true;
	}

    $scope.setFooter = function() {
		// Overwrite
        return 'GameContent/StaticContent/Component.StaticContentCheckButton';
	}

    $scope.showEndModal = function() {
        return true;
    }

	/** Return true, if the duration of this round should be measured and send to the
	 * server. This also implies, that the user's input and the user's voting might
	 * be down-rated, if the user did not spend enough time with the round.
	 */
	$scope.shouldReportPlayingTime = function() {
		return true;
	}

	/** Return the duration in milliseconds which should be used as threshold for the
	 * decision if the user input and the user voting should be downgraded or not.
	 * If the round duration (from start until user input submission) is lower than
	 * the specified duration, the generated user data might be down-rated.
	 */
	$scope.minimumAssumedPlayingTime = function() {
		return 1;
	}

	/** Override this method in your round controller to reveal the solution of the Round
	 * after submitting the input.
	 */
	$scope.revealSolution = function() {
        return false;
	}

	/** Return the duration in ms the round should wait to, e.g., illustrate the solution,
	 * before going on.
	 */
	$scope.delayBeforeGoingOn = function() {
		return 1000;
	}

	// Overwrite the following method and return YES, if the correctness of the user's
	// input can reliably be determined. Return NO, if, e.g., there is a lack of confidence
	// in the game data currently due to lack of votings.
	$scope.inputCorrectnessVerifiable = function() {
		console.error("Calling inputCorrectnessVerifiable on super class RoundController.",
		"You should overwrite this method in the controller for the current round.");
		return true;
	}

	// Overwrite the following method and return YES, if clicking the Continue button
	// should skip the validation and scoring functions, and should switch to the
	// next round immediately. (E.g., in static content rounds, which only show some
	// text)
	$scope.continuesImmediately = function() {
		return false;
	}

	// Overwrite the following method and return false, if the Go On button to finish
	// the current round by submitting the data, should not be shown.
	$scope.showCheckButton = function () {
		return true;
	}

	// Return the round's output which will be handed to the upcoming round.
	$scope.output = function() {
		return null;
	}

	// The message returned by this method will be shown, if the user's input is correct,
	// that is, if the user's input is valid and is a solution for the round.
	// Overwrite the method if you would like to provide a better tailored message.
	$scope.correctInputMessage = function() {
		return $translate.instant("CORRECT");
	}

	// The message returned by this method will be shown, if the user's input is wrong.
	// Overwrite the method if you would like to provide a better tailored message.
	$scope.incorrectInputMessage = function() {
		return $translate.instant("SORRY_THAT_WAS_WRONG");
	}

	// The message returned by this method will be shown, if the user's input is valid,
	// but its correctness cannot really be determined due to, e.g., lack of confidence.
	// Overwrite the method if you would like to provide a better tailored message.
	$scope.acceptedInputMessage = function() {
		return $translate.instant("THANKS");
	}

	/** The following method will be called on the subclass to validate the input, once the user submits his selection (or triggered by time-out). The subclass has to keep track of the input, and thus, it is not available as a parameter for the method here.
	@return 	YES if the input is valid, NO otherwise */
	$scope.inputIsValid = function() {
		console.error("Calling inputIsValid on super class RoundController.",
		"You should overwrite this method in the controller for the current round.");
		console.trace();
		debugger;
		// Overwrite this in the customized round controller to validate the user input
		return true;
	}

	/** Overwrite this method to prepare your round for being revealed soon.
	 * Download required assets, e.g., data from servers here.
	 */
	$scope.preloadData = function() {
        return $q(function (resolve,reject) {resolve()});
		// Implement in inherited method
	}

    /**
     * Every round can define a background-function to be started on round-start.
     * Therein the roundcontroller can for example query for game-updates.
     * When an update took place, the background-function is supposed to fire a kRoundControllerBackgroundEvent
     */
    $scope.backgroundTask = null;

    $scope.afterloadData = function() {
        return $q(function (resolve,reject) {resolve()});
		// Implement in inherited method
	}

	/** Overwrite this method to submit any user-generated data after finishing
	 * a round. In this case, the round is not skipped. The input is valid.
	 */
	$scope.submitData = function() {
        return $q(function (resolve,reject) {resolve()});
	}

    $scope.showHelp = function() {
        return {
            template: "{{'NO_HELP_DEFINED'|translate}}",
            title: "{{'HELP'|translate}}",
            subtitle: ''
        }
    }


// - - - Round Lifecycle methods - - -
// Overwrite these methods to react on lifecycle events. Make sure to call $scope.$parent.XYZ() in the subclass

	/* This method will be performed slightly before the visual elements of the round become visible, and before the round actually starts. */
	$scope.roundWillStart = function() {
		console.log("Round will start...");
		// Overwrite this method to prepare your round before it is being made visible.
	}

	/* This method will be performed once the visual elements of the round has just been presented. */
	$scope.roundDidStart = function() {
		console.log("Round did start...");
		// Overwrite.
	}

    $scope.enableCheckButton = function() {
        $scope.disabledCheckButton = false;
    }

	// Note: will also be called when the round is being skipped!
	$scope.roundWillEnd = function() {
		console.log("Round will end...");
		// Overwrite this method to prepare your round before it is being made visible.
	}

	/* This method will be performed once the visual elements of the round has just been presented. */
	$scope.roundDidEnd = function() {
		console.log("Round did end...");
		// Overwrite.
	}


// The following methods should not get overwritten.

	$scope.countdownDidFinish = function(){
		$scope.countdownHasFinished = true;
	}

    $scope.prepareDidFinish = function() {
        $scope.prepareHasFinished = true;
    }

    $scope.preparing = function() {
        $scope.prepareHasFinished = false;
    }


// - - - Public, non-inherited methods - - - DO NOT OVERWRITE THESE METHODS, UNLESS YOU CALL THE PARENT METHOD.


	/* This methods lets the RoundController have a reference to the subclass methods, that implements the mechanics of the round. This is sometimes required to explicitely call the methods defined in the sub-scope instead of the scope of this RoundController.

	IMPORTANT: Therefore, this method must be called at the end of your subclass implementation, with '$scope' as the reference.

	*/
	$scope.setRoundControllerScope = function($childScope) {
		_$childScope = $childScope;
		$scope.roundControllerSubclassScope = $childScope;
		$scope.usedCountdownDuration = _$childScope.countdownDuration();
		$scope.usedCountdownDelay = _$childScope.countdownDelay();
	}

	// This makes the gameConfiguration definition of this round accessible via the data property
	$scope.data = $scope.round;

    $scope.start = function() {
		console.log("Starting round");

		$scope.roundStartTimestamp = new Date();

        $scope.hasSubmitted = false;

		// Reset the counter (if present)
		if ($scope.countdownController && 'start' in $scope.countdownController)
			$scope.countdownController.start();
    }

	$scope.end = function() {
		console.log("Ending round...");
	}

	var scrollDelegate;
	$timeout(function () {
		scrollDelegate = $ionicScrollDelegate.$getByHandle('RoundScrollView');
	});

	// Update the sroll view height
	$scope.updateScrollView = function() {
		scrollDelegate.resize();
	}

	$scope.scrollDown = function() {
		scrollDelegate.scrollBottom(true);
	}

    $scope.scrollUp = function() {
		scrollDelegate.scrollTop(true);
	}


// - - - Private, non-inherited methods - - -


// - - - User Interface methods - - -

    // bound to the go-on button
    $scope.clickToggle = function($event) {
        $scope.disabledCheckButton = true;
        if (!$scope.hasSubmitted) $scope.clickSubmitInput($event);
        else $scope.clickContinue($scope, null);
    }

    $scope.clickHelp = function($event) {
        console.log('clicked Help');
        var helpData = _$childScope.showHelp();
        $scope.$parent.popupHelp(helpData.template, helpData.subtitle);
    }

    $scope.clickSubmitInput = function($event) {

		// Throw error if the _$childScope has not been set by the RoundController subclass.
		if (!_$childScope || !$scope.prepareHasFinished) {
			console.error("$childScope undefined or prepare has not finished yet");
			return;
		}

		if ($scope.roundStartTimestamp) {
			// Note that the input may be invalid (incomplete)!
			var roundTime = new Date() - $scope.roundStartTimestamp;

			$scope.downrateInput = (roundTime < _$childScope.minimumAssumedPlayingTime());
			console.log("Assuming player took enough time ("+roundTime+"ms) to think: ", !$scope.downrateInput);
            if ($scope.downrateInput) {
                alert($translate.instant("DONT_SPAM"));
                $scope.disabledCheckButton = false;
			    return;
            }

			try {
				EventStore.storeEvent(kEventRoundDuration,angular.extend($scope.data,{
					skipped: false,
					duration: roundTime
				}));
			} catch(e){}
		}

		// If the round is not a real game round, but, e.g., presents some
		// static contents only, the round can return YES for the following
		// function to skip the usual points:yes/no process and switch
		// to the next round immediately
		if (_$childScope.continuesImmediately()) {
			$scope.clickContinue($scope,null);
			return;
		}

		// Let the subclass validate the input
    	if (_$childScope.inputIsValid()) {

			console.log("Input is valid");

			// We're ready to submit any user-generated data
            _$childScope.submitData().then(function(promise) {

                // Notify the Child Round Controller to reveal the solution
			    $scope.toReveal = _$childScope.revealSolution();

                $scope.hasSubmitted = true;

                // Let it tell us if it can verify the user's input
                $scope.correctnessVerifiable = _$childScope.inputCorrectnessVerifiable();

                // Based on whether we can verify it, or not, determine the gained Points
                if ($scope.correctnessVerifiable) {
                    console.log("Input is verifiable");
                    $scope.gainedPoints = _$childScope.pointsForVerifiableInput();
                    console.log("Gained "+$scope.gainedPoints+" points for VERIFIED input.");
                } else {
                    console.log("Input is non-verifiable");
                    $scope.gainedPoints = _$childScope.pointsForNonVerifiableInput();
                    console.log("Gained "+$scope.gainedPoints+" points for NON-verified input.");
                }

                $scope.setShownPoints($scope.gainedPoints);

                if (!_$childScope.showEndModal()) {
                    $scope.clickContinue($scope,null);
                    return;
                }

                // Continue after the period of time specified by the Child Round Controller
                $timeout(function () {
                    var modalHidden = null;
                    if ($scope.correctnessVerifiable) {
                        // Either a "Correct!" or "Sorry, wrong!" modal is shown based
                        // on whether the input was correct or not (== 0 Points).
                        if ($scope.gainedPoints>0) {
                            modalHidden = _$childScope.presentSuccess();
                        } else {
                            modalHidden = _$childScope.presentFailure();
                        }

                    } else {
                        // Otherwise we cannot verify the input
                        modalHidden = _$childScope.presentDone();
                    }
                }, _$childScope.delayBeforeGoingOn());
                });
    	} else {
			$scope.gainedPoints = 0;
			$scope.setShownPoints(0);
			_$childScope.presentInvalidInput(_$childScope.invalidInputMessage());
            $scope.disabledCheckButton = false;
    	}
    }

	var processGainedPoints = function() {

		if ($scope.gainedPoints > 0) {
			var vaporizedPoints = $('.arg-vaporizing-point').html('+'+$scope.gainedPoints).css('opacity',0);
			setTimeout(function () {
				$('.arg-vaporizing-point').css('opacity',1);
				FXVaporize(vaporizedPoints, 300, 10, 2000);
			}, 1500);

			try {
				doAnimation = false;
				if (doAnimation) {
					var coins = $('.arg-coin');
					var absPosition1 = $('.inline-modal.active .arg-coin:first').offset();
					var absPosition2 = $('[ng-controller="LevelController"] arg-account-display').offset();

					var dx = absPosition2.left - absPosition1.left,
						dy = absPosition2.top - absPosition1.top;

					var coinDuration = 1000;
					coins.each(function (k,elem) {
						setTimeout(function () {
							FXArcAnimation($(elem), {x:0,y:0}, {x:dx, y:dy+k*5}, coinDuration);
							setTimeout(function () {
								$(elem).hide();
							},coinDuration);
						},2000 -k*100);
					});
				}
			} catch(e){}

			setTimeout(function () {
				UserAccount.addPoints($scope.gainedPoints);
			},1750);

		}
	}

	// The Success Modal is shown, if we actually know the definite answer, and the user answered accordingly
	$scope.presentSuccess = function() {

		SoundStore.playSuccess();

		$scope.$parent.successModal.show();

		var successModalElem = angular.element('#arg-success-modal');
		var stack = successModalElem.find('arg-stack-of-coins');

		$ionicGesture.on('swipedown', function () {
			$scope.clickContinue($scope,null);
		}, successModalElem);

		processGainedPoints();

        return $timeout(function () {
            $scope.hideModalAnimated($scope.$parent.successModal);
        }, _hideModalDelay);
    }



	// The Done Modal is shown, if we don't really know the correct answer
	$scope.presentDone = function() {

		SoundStore.playConfirmation();

		$scope.$parent.doneModal.show();

		var doneModalElem = angular.element('#arg-done-modal');
		var stack = doneModalElem.find('arg-stack-of-coins');

		$ionicGesture.on('swipedown', function () {
			$scope.clickContinue($scope,null);
		}, doneModalElem);

		processGainedPoints();

        return $timeout(function () {
            $scope.hideModalAnimated($scope.$parent.doneModal);
        }, _hideModalDelay);
	}

	// The following will be performed once the user has submitted a valid input, but gained no points for it.
	$scope.presentFailure = function(){

		SoundStore.playFail();

		$scope.$parent.failureModal.show();
		$ionicGesture.on('swipedown', function () {
			$scope.clickContinue($scope,null);
		}, angular.element('#arg-failure-modal'));
        return $timeout(function () {
            $scope.hideModalAnimated($scope.$parent.failureModal);
        }, _hideModalDelay);
	}

	// The following will be performed if the user wants to go on, but the input is invalid.
	// This shows a warning with text specified by the sub-controller, or the default text, if non specified.
	$scope.presentInvalidInput = function(msg){
		alert($translate.instant("WAIT_A_SECOND"), msg || $scope.invalidInputMessage());
	}
});
