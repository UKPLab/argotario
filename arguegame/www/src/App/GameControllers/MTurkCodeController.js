/**
* This Round creates a code which can bee redeemed on the server. 
*/
angular.module('arg.game.roundcontrollers').controller('MTurkCodeController', function($scope,$ionicPopup,$ionicSlideBoxDelegate,$ionicActionSheet,UserAccount,UserStore,EntityLinker,$timeout){

    $scope.gameData = {
        fallacies : null,
    };

    /**
     * If a user has not reached the required number of points, call this function and show an exuse-message.
     *
     */
    $scope.notify = function(id, event) {
        var msg =  'You need <br> <strong class="big">{{data.requiresPoints}} points</strong> <br> to get your Amazon-Code!'

        if ($scope.notififaction) $scope.notification.close();
        $scope.notification = $ionicPopup.show({
            template: '<div id="excuse">'
                        + '<img src="Resources/Images/Betty-Support@2x.png">'
                        + '<p>' + msg + '</p>'
                    + '</div>',
            scope: $scope,
            buttons: [
                { text: '<b>OK!</b>',
                  type: 'button-positive'
                }]
            });
            $scope.notification.then(function () {
                $scope.clickEndLevel();
            });
    };

    /**
     * Checks if the code can already be shown.
     * This is dependent of the requiresPoints configuration-variable.
     */
    $scope.allowedToPlay = function() {
        points = UserAccount.points();
        return (points >= $scope.data.requiresPoints);
    };


    $scope.roundWillStart = function() {
        if (!$scope.allowedToPlay()) {
            $scope.notify();
        } else {
            var downloadCode = UserStore.getMTurkCode({});
            console.log('AIGHT');
            downloadCode.then(function(code){
                $scope.gameData.code = code
                $scope.prepareDidFinish();
            });
        }
    };

	$scope.continuesImmediately = function() {
		return YES;
    };

    $scope.isSkippable = function() {
        return false;
    };

	$scope.$parent.setRoundControllerScope($scope);

});
