/** Explanation:

	This file acts as a template for a new game round you would like to implement.
	The architecture follows the two pricinples a) Inheritance and b) Delegation.
	The logic required to define rounds has been reduced to a minimum by moving
	most of the implementation into the LevelController and RoundController
	controllers. Thus, it might feel like some methods are missing here, but it
	actually is the case, that most of the lifecycle management is done in the
	parent controller which you do not have to alter. Instead, you simply
	implement the respective 'hooks' in this controller, and only, if required.
	
	The scope of the controller you define here inherits many methods from the
	parent scope, defined by RoundController (which is a parent controller for 
	every round controller). The LevelController executes methods of the current
	round controller (e.g., PickTheComponentController), and if that round
	controller does not implement certain methods, its parent RoundController will
	definitely implement it. So to customize the behavior of this round controller,
	such as the countdown time, the number of points for the input, or the input
	verification, the custom round controller must overwrite the RoundController's
	methods.
	
	Next, this round controller's lifecycle is managed by the delegating parent
	RoundController, which will try the execute methods on this controller, such as
	roundWillBegin, or roundDidEnd. It is important to place your round logic code
	in the correct delegate method.
	
	Note: The user finishes the round by clicking the big Go On button at the
	bottom of the screen. This button click is handled by the RoundController,
	which then asks this controller what to do.
 */
angular.module('arg.game.roundcontrollers').controller('NewRoundTemplateController', function($scope /* LIST YOUR DEPENDENCIES HERE, e.g., ArgumentStore, TopicStore, $ionicPopover, etc.*/){

	// At the top, you might want to define some private, local variables.
	var localVariable1, localVariable2;
	
	// You might also want to define some private, local functions.
    var doSomething = function() {
        return 123;
    }

	// One of the conventions: Define everything related to the game of this round within the $scope.gameData object:
    $scope.gameData = {
        topic: null,
        argument: null,
        someArray: []
    };


	// Next, implement the methods inherited of RoundController to customize the behavior of this round.
	// Some of the methods are optional, others must be implemeted. Check the RoundController.js file
	// to see which methods you can impement, and what their interface looks like.

	// Use this method to download data from the back-end, which will be used by this round,
	// e.g., a random argument, or a topic. Inject it into $scope.gameData, so that it will be available
	// within your view.
	$scope.prepareData = function() {
	
	}

	$scope.inputIsValid = function() {
        // ...
    }

    // Can we reliably say that the user's input is valid or invalid?
    $scope.inputCorrectnessVerifiable = function() {
        // ...
    }

    // So if we can verify the input, how much points is the input worth?
    $scope.pointsForVerifiableInput = function() {
        // ...
    }

    // Otherwise, if we cannot verify the input, what should the user be rewarded with?
    $scope.pointsForNonVerifiableInput = function() {
        // ...
    }

	// If your round can reveal a solution, e.g., by framing a text snippets, etc.,
	// do it here.
    $scope.revealSolution = function() {
        // ...
    }

	// Use this method to submit any data to the back-end, e.g., a newly composed
	// argument, or a user voting on some data
    $scope.submitData = function() {
        // ...
        // E.g., to vote for a 'pro' stance in the argument object of the gameData:
        saveVotingWithKeyPathAndValueForEntity(EntityLinker, "stance", "pro", $scope.gameData.argument);
    }

	// Return the number of coins required to skip this round.
    $scope.costsForSkip = function(){
        // ...
    }

	// In milliseconds...
    $scope.countdownDuration = function() {
        // ...
    }

 	// In milliseconds...
    $scope.countdownDelay = function() {
        // ...
    }

	// In milliseconds...
    $scope.delayBeforeGoingOn = function() {
        // ...
    }

	// The round can produce some output, which will be forwared to the following round.
	// Reference the output of the previous round using $scope.previousOutput;
    $scope.output = function() {
        // ...
    }

	// Return the message to show if the current input is invalid.
    $scope.invalidInputMessage = function(){
        // ...
    }



	// Finally, it is VERY important to register this controller in the parent controller:
    $scope.$parent.setRoundControllerScope($scope);
});
