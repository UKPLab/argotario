angular.module('ui.controllers').controller('AccountController', function($scope,$ionicCustomModal,$ionicActionSheet,UserAccount, HighscoreStore, $ionicLoading, $q) {

    $scope.refresh = function () {
        if (!$scope.authenticated)
            return;

        var done = false;
        setTimeout(function () {
            if (!done) {
                $ionicLoading.show({
                    template: '<i class="icon ion-load-d"></i>'
                });
            }
        }, 500);

        globalHighscore = HighscoreStore.globalHighscore();
        weeklyHighscore = HighscoreStore.weeklyHighscore();

        globalHighscore.then(function (result) {
            console.log("Highscore result:", result);
            $scope.globalHighscore = {
                best : result['top'],
                user : result['user'],
                space : result['user'] !== undefined
            }
            console.log($scope.globalHighscore)
        });
        weeklyHighscore.then(function (result) {
            console.log("Highscore result:", result);
            $scope.weeklyHighscore = {
                best : result['top'],
                user : result['user'],
                space : result['user'] !== undefined
            }
        });

        $q.all([globalHighscore, weeklyHighscore]).then(function() {
            console.log('loaded all highscores!!!11elf')
            $ionicLoading.hide();
            done = true;
            $scope.$broadcast('scroll.refreshComplete');
        }, function () {
            alert("Oh no!","The app was unable to fetch the current highscore, sorry!");
            $ionicLoading.hide();
            done = true;
            $scope.$broadcast('scroll.refreshComplete');
        });
    };

    $scope.openPOTWModal = function(potw) {
        var scope = $scope.$new();
        scope.potw = potw;
        $ionicCustomModal.fromTemplateUrl('Views/PlayerOfTheWeek.html', {
            scope: scope,
            animation: 'bounceInUp'
        }).then(function(modal) {

            $scope.potwModal = modal;
            scope.hideImprovedRankingModal = function() {
                modal.hide().then(function () {
                    modal.remove();
                });
            }
            modal.show();
        });
    };

    $scope.clickRefresh = function() {
        console.log("Refreshing highscore...");
        $scope.refresh();
    };

    $scope.$on(kUserAccountAuthenticationStateChanged, function () {
        $scope.refresh();
    });

    $scope.$on(kRootControllerRankingDidChange, function(_,delta) {
        $scope.refresh();
    });

    $scope.clickRefresh();

});
