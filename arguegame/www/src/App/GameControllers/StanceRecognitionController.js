/**
* Use the StaticContentRoundController to present a round consisting of some static HTML content only.
* @param	HTMLFile		The HTML file (must exist in GameContent/StaticContent/) with or without the HTML file extension
*/
angular.module('arg.game.roundcontrollers').controller('StanceRecognitionController', function($scope,$ionicPopup,$ionicSlideBoxDelegate,$ionicActionSheet,ArgumentStore,EntityLinker,$timeout){

    $scope.gameData = {
        article: null,
        argument: null,
        indexOfShownComponent: -1,
    };

    var _distribution = null;
    var _chosenRandomIdx = -1;


    $scope.prepareData = function () {
        console.log("Pre-downloading data for round StanceRecognition");

        var givenDomainTitle = valueForKeyPath($scope.round,'parameters.domain');

        var download = givenDomainTitle ? ArgumentStore.argumentInDomainWithTitle({
            title: valueForKeyPath($scope.round,'parameters.domain'),
            valid: true,
            kraken: ['articles', 'votedStance']
        }) :  ArgumentStore.randomArgument({
            valid: true,
            kraken: ['articles', 'votedStance', 'topic', 'domain']
        })

        return download.then(function (arg) {
            console.log("Downloaded random argument: ", arg);

            _distribution               = arg['#votedStance'];

            $scope.gameData.topic       = valueForKeyPath( arg, '&refersTo[0]' );
            $scope.gameData.article     = valueForKeyPath( arg, '&refersTo[0].&references[0]' );
            $scope.gameData.domain      = valueForKeyPath( arg, '&refersTo[0].&belongsTo[0]' );
            $scope.trueStance = (arg.isEditorial) ? arg.stance : reliablyHighestVotedKeyAndValue(_distribution).key;

            arg.stance = 'neutral';
            $scope.gameData.argument    = arg;

            // Choose one random component which will be shown. All others are hidden.
            _chosenRandomIdx = valueForKeyPath($scope.round,'parameters.visibleComponentIndex');
            if (_chosenRandomIdx===undefined)
                _chosenRandomIdx = Math.floor(Math.random()*arg.components.length);

            $scope.gameData.indexOfShownComponent = _chosenRandomIdx;

            $scope.updateScrollView();

        },function (e) {
            console.log("FAILED!",e);
            alert("Oh no!",
                  "Downloading the game data failed!",
                  "Dismiss");
        });

    }

    var _selection = null;
    $scope.$watch('gameData.argument.stance', function () {
        if (valueForKeyPath($scope.gameData,'argument.stance') && ($scope.gameData.argument.stance=='pro' || $scope.gameData.argument.stance=='contra')) {
            _selection = $scope.gameData.argument.stance;
        }
    });


    // First: Let's specify when the user's input is valid
    // The input is valid if the user has chosen anything.
    $scope.inputIsValid = function() {
        return _selection!=null;
    }

    // Can we reliably say that the user's input is valid or invalid?
    $scope.inputCorrectnessVerifiable = function() {
        // If, after loading the argument, the true stance could be determined,
        // then YES.
        return $scope.trueStance != null;
    }

    // So if we can verify the input, how much points is the input worth?
    $scope.pointsForVerifiableInput = function() {

        if ($scope.trueStance && $scope.trueStance == $scope.gameData.argument.stance) {
            return 20;
        } else {
            return 0; // We DO know the correct answer, and the answer was wrong.
        }
    }

    // Otherwise, if we cannot verify the input, what should the user be rewarded with?
    $scope.pointsForNonVerifiableInput = function() {
        return 10;
    }


    $scope.delayBeforeGoingOn = function() {
        return 1500;
    }

    $scope.invalidInputMessage = function() {
        return "Wait, pick a stance first: Pro or Contra!";
    }

    $scope.revealSolution = function () {
        //angular.element('.arg-nonvisible-component').removeClass('arg-nonvisible-component');
        $scope.gameData.indexOfShownComponent = -1;
        return false;
    }

    $scope.submitData = function() {
        if (_selection) {
            if (!$scope.downrateInput) {
                saveVotingWithKeyPathAndValueForEntity(EntityLinker, "stance",
                                                                     _selection,
                                                                     $scope.gameData.argument);
            }
        }
    }

    // This is how many points will be substracted from the user's Points
    // if he decides to skip this round
    $scope.costsForSkip = function(){
        return 15;
    }

    // Yes, this round is (in general) skippable
    $scope.isSkippable = function() {
        return true;
    }

    // How much time will users have to make a choice?
    $scope.countdownDuration = function() {
        return 0;
    }

    $scope.$parent.setRoundControllerScope($scope);
});
