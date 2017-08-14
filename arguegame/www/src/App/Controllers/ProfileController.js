angular.module('ui.controllers').controller('ProfileController', function($scope,$translate,$ionicPopup,$ionicActionSheet,UserAccount,$ionicLoading,EventStore){

    $scope.clickFollowUser = function(username){
        EventStore.storeEvent(kEventFollowedUser,{username:username});

        UserAccount.follow(username, function (success) {
            if (!success) {
                alert("Oh no!","Something went wrong while trying to add the friend you have mentioned. Please try again later.","Dismiss");
            }

        });
    }

    $scope.clickUnfollowUser = function (username) {
        EventStore.storeEvent(kEventUnfollowedUser,{username:username});

        UserAccount.unfollow(username, function (success) {
            if (!success) {
                alert("Oh no!","Something went wrong while trying to unfollow the friend you have mentioned. Please try again later.","Dismiss");
            }

        });
    }

    $scope.$on(kNotificationUserDidChooseUser, function (user) {
        alert("Did choose "+user);
        console.log(">>",user);
    })

    $scope.clickFollowSomeone = function(){

        $scope.openChooseUser();

        return;
        // Old way:

        $ionicPopup.prompt({
            title: 'Add Friend',
            template: 'Enter the name of the friend you want to follow.',
            inputType: 'textarea',
            inputPlaceholder: 'Nickname'
        }).then(function(friendUsername) {
            console.log('Will attempt to add friend named', friendUsername);
            if (friendUsername==null || friendUsername.length < 3) {
                alert("Is that a nickname?","Please provide a nickname with at least 3 characters.","Dismiss");
                return;
            }

            UserAccount.follow(friendUsername,function (success) {
                if (success) {
                    //alert("Friend added!","Check out his profile!");
                } else {
                    alert("Oh no!","Something went wrong while trying to add the friend you have mentioned. Please try again later.","Dismiss");
                }
            })
        });
    }

});
