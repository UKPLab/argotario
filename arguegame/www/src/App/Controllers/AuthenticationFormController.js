angular.module('ui.controllers').controller('AuthenticationFormController', function($scope,$ionicModal,$ionicPopup,UserAccount,EventStore){

    $scope.username = $scope.$storage.username || '';
    $scope.password = '';
    $scope.stayLoggedIn = true;

    $scope.clickSignIn = function(username,password) {
        console.log("Authenticating with ",username,'********');

        if (username && password) {

            $scope.$storage.username = username;

            var relogin = function(un,pw) {
                UserAccount.authenticateWithCredentials(un, pw, function (success) {
                    if (success) {
                        EventStore.storeEvent(kEventSuccessfulAuthentication);

                        if ($scope.authenticationModal)
                            $scope.authenticationModal.hide();
                    } else {
                        EventStore.storeEvent(kEventFailedAuthentication);

                        alert("Oh no!", "Your username and password combination was wrong, or something else went wrong!", "Dismiss");
                    }
                });
            };
            if ($scope.authenticated) {
                BaasBox.logout(function(){
                    relogin(username,password);
                });
            } else {
                relogin(username,password);
            }

        } else {
            if (!username) {
                $ionicPopup.alert({
                    title: "What's your nickname?",
                    template: 'We need a valid nickname for signing in!'
                }).then(function(res) {
                    //
                });
            } else if (!password) {
                $ionicPopup.alert({
                    title: "What's your password?",
                    template: 'We need a valid password for signing in!'
                }).then(function(res) {
                    //
                });
            }
        }
    }
});
