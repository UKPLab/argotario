angular.module('ui.controllers').controller('UserProfileController', function($scope,$translate,$ionicPopup,$ionicActionSheet,UserAccount,$localStorage,LanguageStore){

    $scope.profileUser = {
        user: '',
        followers: [],
        following: [],
        topics: [],
        isUser: true,
        followedByUser: false
    };

    var emptyUser = $scope.profileUser;

    var topicsSetUp = false;
    $scope.availableTopics = ["Tech", "Politics", "Globalisation", "Diversity", "Education", "Health"];
    $scope.topics = [];


    $scope.$on(kUserAccountFollowersChanged, function () {
        $scope.profileUser.followers = UserAccount.followers();
        $scope.$apply();
    });

    $scope.$on(kUserAccountFollowingChanged, function () {
        $scope.profileUser.following = UserAccount.following();
        $scope.$apply();
    });

    $scope.$on(kUserAccountAuthenticationStateChanged, function () {
        if (UserAccount.authenticated()) {
            $scope.profileUser.user = UserAccount.username();
        } else {
            $scope.profileUser = emptyUser;
        }
    });

    $scope.clickLogout = function() {
        confirm($translate.instant("LOG_OUT")+"?",$translate.instant("ARE_YOU_SURE"),$translate.instant("LOG_OUT"), function () {
            UserAccount.logOut(function (success) {

                if (success) {
                    $scope.userProfileModal.hide();
                } else {
                    alert($translate.instant("OH_NO"),$translate.instant("LOGGING_OUT_FAILED"), $translate.instant("DISMISS"));
                }
            });
        });
    }


    // Observe changes to the chosen topics
    $scope.$watch('topics', function(newV, oldV){
        if (!topicsSetUp) return;

        // Build a String array of the topics the user has chosen
        var chosenTopics = [];
        $.each($scope.topics, function(k,v){
            if (v.chosen) chosenTopics.push(v.title);
        });

    },true);


    /** Progress */
    $scope.clickRemoveLocalData = function() {
        confirm($translate.instant("REMOVE_LOCAL_DATA"),
                $translate.instant("REMOVE_LOCAL_DATA_EXP"),
                'Reset',
                function () {
                    $localStorage.$reset();
                    UserAccount.logOut(function () {
                        location.reload();
                    });
                });
    }

    /** Avatar */
    $scope.clickAvatar = function(){
        $scope.openChooseAvatarModal();

        return;

        var hideSheet = $ionicActionSheet.show({
         buttons: [
           { text: $translate.instant("CHOOSE_NEW_PICTURE") },
           { text: $translate.instant("DELETE_CURRENT_PICTURE") }
         ],
         titleText: $translate.instant("CHANGE_YOUR_AVATAR_PICTURE"),
         cancelText: $translate.instant("CANCEL"),
         cancel: function() {
              // add cancel code..
            },
         buttonClicked: function(index) {
            alert("To implement: button handler idx #"+index);
            return true;
         }
       });
    }
}).config(function($stateProvider) {
  $stateProvider
  .state('userprofiledummy', {
    url: '/user/',
    templateUrl: 'Views/UserProfile.html'
  });
});
