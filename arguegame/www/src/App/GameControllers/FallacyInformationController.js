/**
* Use the StaticContentRoundController to present a round consisting of some static HTML content only.
* @param	HTMLFile		The HTML file (must exist in GameContent/StaticContent/) with or without the HTML file extension
*/
angular.module('arg.game.roundcontrollers').controller('FallacyInformationController', function($scope,$ionicPopup,$ionicSlideBoxDelegate,$ionicActionSheet,FallacyStore,LanguageStore,EntityLinker,$timeout){

    $scope.gameData = {
        fallacies : null,
    };

    $scope.language = LanguageStore.activeLanguage().id;

    $scope.preloadData = function () {
        console.log("Pre-downloading data for round FallacyInformation");

        // The game configuaration can optionally specify a specific argumentId or the names of domains
        // of which arguments should be fetched:
        return FallacyStore.fallaciesWithDifficulty({
            difficulty: valueForKeyPath($scope.round,'parameters.difficulty')
        }).then(function (fallacies) {
            console.log('Downloaded fallacyInformation');
            $scope.gameData.fallacies = fallacies;
            $scope.prepareDidFinish();
        },function (e) {
            console.log("FAILED!",e);
            alert("Oh no!",
                  "Downloading the game data failed!",
                  "Dismiss");
        });

    }

	$scope.continuesImmediately = function() {
		return YES;
	}

    $scope.isSkippable = function() {
        return false;
    }

	$scope.$parent.setRoundControllerScope($scope);

});
