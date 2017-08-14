angular.module('ui.controllers').controller('GameSessionController', function($scope,$translate,$ionicPopup,$ionicSlideBoxDelegate,$ionicActionSheet){

    var gameSessionSlideBox = $ionicSlideBoxDelegate.$getByHandle('game-session-slidebox');

    $scope.countdownOver = function(){
        alert("countdown over!");
    }

    $scope.skipGame = function() {
        confirm($translate.instant("SKIP_ROUND"), $translate.instant("ARE_YOU_SURE"), $translate.instant("SKIP"), function(){
            $scope.nextGame();
        });
    }

    $scope.nextGame = function() {
        console.log(gameSessionSlideBox.currentIndex(), gameSessionSlideBox.slidesCount()-1);
        if (gameSessionSlideBox.currentIndex() == gameSessionSlideBox.slidesCount()-1) {
            $scope.closeGameSession();
            $scope.$parent.userDidFinishSession(0);
        } else {
            gameSessionSlideBox.next();
        }
    }

    $scope.currentGameIndex = function(){
        return gameSessionSlideBox.currentIndex() +1;
    }

    $scope.numberOfGames = function(){
        return gameSessionSlideBox.slidesCount();
    }


    $scope.quitGameSession = function(){
        confirm($translate.instant("SKIP_GAME_SESSION"),
                $translate.instant("YOU_WILL_LOSE_THE_PROGRESS"),
                $translate.instant("QUIT"),
                function(){
                    $scope.closeGameSession();
                });
    }

    $scope.userDidFail = function(){
        $ionicActionSheet.show({
         buttons: [
            { text: 'I\'m an expert but I had no clue' },
            { text: 'I\'m no expert and it was too hard' },
            { text: 'I\'m had no clue, and no luck' },
         ],
         titleText: 'Oh no, wrong! Why do you think did it you fail?',
         /*cancelText: 'Cancel',*/
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
         /*cancelText: 'Cancel',*/
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
