/**
 * Use the StaticContentController to present a round consisting of some static HTML content only.
 * @param	HTMLFile		The HTML file (must exist in GameContent/StaticContent/) with or without the HTML file extension
 */
angular.module('arg.game.roundcontrollers').controller('StaticContentController', function($scope,$ionicPopup,UserAccount,$ionicSlideBoxDelegate,$ionicActionSheet,$sce){

	// The 'round' sub-scope emerges from the iteration on 'rounds' of the 'currentLevel' in the StandLevel.html
	if ($scope.data.parameters.HTMLFile) {
		if ($scope.data.parameters.HTMLFile.indexOf('GameContent/StaticContent')==-1)
			$scope.data.parameters.HTMLFile = 'GameContent/StaticContent/' + $scope.data.parameters.HTMLFile;

		if (!$scope.data.parameters.HTMLFile.endsWith('.html')) {
			$scope.data.parameters.HTMLFile += '.html';
		}
	}

    $scope.roundDidStart = function() {
        $scope.prepareDidFinish();
    }

	if ($scope.data.parameters.HTMLContent) {
		$scope.data.parameters.HTMLContent = $sce.trustAsHtml($scope.data.parameters.HTMLContent);
	}

	$scope.inputIsValid = function(){
		return YES;
	}

    $scope.isSkippable = function(){
		return false;
	}

	$scope.continuesImmediately = function() {
		return YES;
	}

	$scope.showCheckButton = function () {
		var show = valueForKeyPath($scope.data, 'parameters.showCheckButton');
		if (show===undefined)
			show = YES;
		return show;
	}

    $scope.changeGameConfiguration = function (previous, next) {
        UserAccount.saveProperties({'previousGameConfiguration': previous});
        UserAccount.saveProperties({'gameConfiguration': next});
        UserAccount.refresh();
    }

	$scope.$parent.setRoundControllerScope($scope);
});
