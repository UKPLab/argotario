/** This controller illustrates how you can make use of a custom level controller to overwrite the LevelController's default behavior. You need to specify a value for the customView: key in the game level configuration. The template you specify must contain a simple <div> node, which uses this controller as the ng-controller. The <div> then simply inlcudes the file includedLevelView.*/
angular.module('ui.controllers').controller('CustomLevelController', function($scope,$ionicPopup,$ionicSlideBoxDelegate,$ionicActionSheet){

	// Overwrite existing LevelController methods: clickSkipRound(), clickclickQuitLevel(), etc.
	$scope.clickSkipRound = function() {
		alert("You cannot skip rounds in this level!");
		// You could still call the parent's clickSkipRound tough, if you would like to inherit its behavior:
		//$scope.$parent.clickSkipRound();
	}

});
