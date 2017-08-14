angular.module('ui.controllers').controller('ForeignProfileController', function($scope,$ionicPopup,$ionicActionSheet, UserAccount, UserStore, HighscoreStore,$ionicScrollDelegate){

    $scope.emptyUser = {
        user: null,
        followers: [],
        following: [],
        topics: [],
        isUser: $scope.visitedForeignUser ? $scope.visitedForeignUser.user==UserAccount.username() : false,
        followedByUser: false
    };

    var update = function() {
        $scope.alreadyFollowing = false;

        if ($scope.visitedForeignUser) {
            console.log("Updating profile data for user ",$scope.visitedForeignUser);

            var username = valueForKeyPath($scope.visitedForeignUser, 'user')

            // Does the main user follow this user?
            angular.forEach(UserAccount.following(), function (followedUser, key) {
                console.log(followedUser.user, username);
                if (followedUser.user == username) {
                    $scope.followedByUser = true;
                    return;
                }
            });

            // Fetch Followings & Followers
            UserStore.loadFollowing(username, function (friends) {
                $scope.visitedForeignUser.following = friends;
            });

            UserStore.loadFollowers(username, function (friends) {
                $scope.visitedForeignUser.followers = friends;
            });

            HighscoreStore.rankingOfUsername(username).then(function (ranking) {
                $scope.visitedForeignUser.ranking = ranking.ranking;
            },function () {
            });
        }
    }

    // Once the user is loaded, sync the chosen selected topics
    $scope.$on(kNotificationUserWillVisitUserProfile, function() {
        $ionicScrollDelegate.$getByHandle('ForeignProfileScrollView').scrollTop(true);
        if ($scope.visitedForeignUser==null)
            $scope.visitedForeignUser = $scope.emptyUser;
        else
            update();
    });

    $scope.$on(kUserAccountFollowingChanged, function () {
        update();
    });

});
