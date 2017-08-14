angular.module('app').controller('ChooseAvatarController', function($scope,$rootScope,$ionicScrollDelegate, $timeout, UserAccount, $rootScope){

    var avatars = [];
    for(var i=1;i<=11;i++) avatars.push('Avatar'+i);
    $scope.avatars = avatars;

    $scope.currentAvatar = UserAccount.avatar();

    $scope.$on(kUserAccountAvatarDidChange, function () {
        $scope.currentAvatar = UserAccount.avatar();
        console.log($scope.currentAvatar);
    });

    $scope.clickAvatar = function(avatarName) {
        UserAccount.setAvatar(avatarName);
        $scope.currentAvatar = avatarName;
        $rootScope.$broadcast(kNotificationUserDidChooseAvatar);

        $timeout(function () {
            $scope.chooseAvatarModal.hide();
        },300);
	}

});
