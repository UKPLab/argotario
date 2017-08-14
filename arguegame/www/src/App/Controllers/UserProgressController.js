angular.module('ui.controllers').controller('UserProgressController', function($scope,$ionicPopup,$timeout){

		$scope.chart = {
			labels : ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
			datasets : [
				{
					fillColor : "rgba(151,187,205,0)",
					strokeColor : "#e67e22",
					pointColor : "rgba(151,187,205,0)",
					pointStrokeColor : "#e67e22",
					data : [4, 3, 5, 4, 6]
				},
				{
					fillColor : "rgba(151,187,205,0)",
					strokeColor : "#f1c40f",
					pointColor : "rgba(151,187,205,0)",
					pointStrokeColor : "#f1c40f",
					data : [8, 3, 2, 5, 4]
				}
			],
		};

		$scope.options = {

		};

	$timeout(function () {
	});


});
