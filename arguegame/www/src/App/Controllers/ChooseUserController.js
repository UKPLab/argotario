angular.module('app').controller('ChooseUserController', function($scope,$rootScope,$ionicScrollDelegate, $timeout, UserStore, $rootScope){

    $scope.search = { query: '' };
    $scope.results = [];
    $scope.recentUsers = [];


    $scope.startSearch = function(query) {
        if (query.length < 4) {
            if (query.length==0) {
                $scope.results = [];
            }
            return;
        }

        console.log("Will start user search for ", query);
        UserStore.usersMatchingSearchQuery({searchQuery: query}).then(function (users) {
            $scope.results = users;
            console.log("Found users: ",users);
        },function (res) {
            console.error(res);
            alert("Oh no!","Sorry, searching failed. Please try again later.");
        });
    }

    $scope.$watch('searchQuery', function() {
    //    $scope.startSearch($scope.searchQuery);
    });

    $scope.clickRefresh = function() {
        UserStore.allUsers({
            orderBy: 'signUpDate',
            ordering: 'DESC'
        }).then(function (users) {
            $rootScope.$broadcast('scroll.refreshComplete');
            $scope.recentUsers = users;
        });
    }

    $scope.clearSearch = function() {
        $scope.search.query = '';
        $scope.startSearch('');
    }

    $scope.clickSelectUser = function(user) {
        $rootScope.$broadcast(kNotificationUserDidChooseUser, user);
        $scope.chooseUserModal.hide();
    }

    $scope.$watch('authenticated', function () {
        //$scope.clickRefresh();
    });
});
