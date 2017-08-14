angular.module('arg.game.roundcontrollers').controller('FallacyRecognitionController', function($scope,$translate,$ionicPopup,$ionicSlideBoxDelegate,$ionicActionSheet,ArgumentStore,LanguageStore,UserAccount,EntityLinker,$timeout, $location, $anchorScroll) {

    var _revealed = false;
    var _selection = null;

    $scope.gameData = {
        allFallacies: null,
        argument: null,
        contextArguments: null,
        article: null,
        domain: null,
        topic: null,
        claimedFallacy: null,
        highlightedCorrectlyIndexes: [],
        highlightedWronglyIndexes: [],
    };

    $scope.language = LanguageStore.activeLanguage().id;

    $scope.costsForSkip = function() {
        return 1;
    };

    $scope.countdownDuration = function() {
        return 0;
    };

    $scope.delayBeforeGoingOn = function() {
        return 3000;
    };

    $scope.fallacyClaimedIsTrue = function(id) {
        return $scope.gameData.claimedFallacy == $scope.gameData.argument.out_fallacyType;
    };

    $scope.fallacyForId = function(id) {
        for(var i=0; i<$scope.gameData.allFallacies.length; i++) {
            if ($scope.gameData.allFallacies[i]._id == id)
                return $scope.gameData.allFallacies[i];
        }
        return null;
    };

    $scope.inputCorrect = function() {
        return $scope.gameData.argument.out_fallacyType == $scope.gameData.argument.fallacyId;
    };

    $scope.inputCorrectnessVerifiable = function() {
        return $scope.gameData.argument.out_fallacyType != null;
    };

    $scope.invalidInputMessage = function() {
        return $translate.instant("PICK_A_FALLACY");
    };

    $scope.inputIsValid = function() {
        return _selection != null;
    };

    $scope.getDifficulty = function() {
        if ($scope.difficultyStr) return parseInt($scope.difficultyStr);

        var difficulty = 0;
        for (var i=0; i< $scope.gameData.allFallacies.length; i++) {
                var iteratorDiff = $scope.gameData.allFallacies[i].difficulty;
                if (iteratorDiff > difficulty) difficulty = iteratorDiff;
            }
        return difficulty;
    };

    $scope.pointsForNonVerifiableInput = function() {
        return 1;
    };

    $scope.pointsForVerifiableInput = function() {
        if ($scope.inputCorrect()) return 1;
        else return 0;
    };

    $scope.preloadData = function () {
        console.log("Pre-downloading data for round FallacyRecognition");
        $scope.difficultyStr = valueForKeyPath($scope.round,'parameters.difficulty');
        $scope.operator = valueForKeyPath($scope.round,'parameters.operator');

        return ArgumentStore.fallaciousArgumentWithDifficulty({
            username: UserAccount.username(),
            difficulty: $scope.difficultyStr,
            operator: $scope.operator,
            language: $scope.language
        }).then(function (arg) {
            console.log("Downloaded fallacious argument: ", arg);

            $scope.gameData.argument = arg;
            $scope.gameData.allFallacies    = valueForKeyPath( arg, '&allFallacies')
            $scope.gameData.claimedFallacy  = arg.fallacyId;

            if (!arg.context) {
                $scope.gameData.topic           = valueForKeyPath( arg, '&refersTo[0]' );
                $scope.gameData.domain          = valueForKeyPath( $scope.gameData.topic, '&belongsTo[0]' );
            }
            else {
                $scope.gameData.topic            = valueForKeyPath( arg.in_session, '&refersTo[0]' );
                $scope.gameData.domain           = valueForKeyPath( arg.in_session, '&belongsTo[0]' );
                $scope.gameData.contextArguments = valueForKeyPath( arg.in_session, '&args' );
                if ($scope.gameData.contextArguments.length == 0)
                    $scope.gameData.contextArguments = null
            }

            $scope.gameData.argument.fallacyId = 'unknown';
            $scope.prepareDidFinish();

        }, function (e) {
            console.log("FAILED!",e);
            alert("Oh no!",
                  "Downloading the game data failed!",
                  "Dismiss");
        });
    };

    $scope.revealSolution = function () {
        if (_revealed) {
            console.log("already revealed");
            return;
        }
        _revealed = true;

        if ($scope.inputCorrectnessVerifiable()) {

            var highlightedCorrectlyIndexes = [];
            var highlightedWronglyIndexes = [];

            angular.forEach($scope.gameData.allFallacies, function (fallacy,idx) {
                if (fallacy._id==$scope.gameData.argument.out_fallacyType)
                    highlightedCorrectlyIndexes.push(idx);
                else
                    highlightedWronglyIndexes.push(idx);

            });
            $scope.gameData.highlightedCorrectlyIndexes = highlightedCorrectlyIndexes;
            $scope.gameData.highlightedWronglyIndexes = highlightedWronglyIndexes;
        }

        $timeout(function () {
                $scope.show_solution_explanation = true;
                $scope.scrollTo('solution');
            }, (!$scope.inputCorrectnessVerifiable() ? 1000 : 3000));

        return true;
    };

    $scope.showHelp = function() {
        return {
            template: '<arg-round-title>Chose the fallacy-type!</arg-round-title>'
                    + '<div class="list card" ng-repeat="fallacy in $parent.gameData.allFallacies">'
                    + '<arg-fallacy model="fallacy"></arg-fallacy></div>',
            subtitle: ''
        };
    };

    $scope.scrollTo = function(where) {
        $location.hash(where);
        $scope.updateScrollView();
        $anchorScroll();
    };

    $scope.submitData = function() {
       return ArgumentStore.vote({
               id: $scope.gameData.argument._id,
               keypath: 'fallacyId',
               value: _selection,
               collection: 'arguments'
        });
    };

    $scope.$watch('gameData.argument.fallacyId', function () {
        if (valueForKeyPath($scope.gameData.argument,'fallacyId')){
            for (var i = 0; i < $scope.gameData.allFallacies.length;i++){
                if ($scope.gameData.argument.fallacyId == $scope.gameData.allFallacies[i]._id) {
                    _selection = $scope.gameData.argument.fallacyId;
                }
            }
        }
    });

    $scope.$parent.setRoundControllerScope($scope);
});
