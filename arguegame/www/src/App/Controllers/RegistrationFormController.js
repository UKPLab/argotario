kRegistrationFormMinimumPasswordLength = 8;
kRegistrationFormMaximumPasswordLength = 64;

kRegistrationFormMinimumUsernameLength = 3;
kRegistrationFormMaximumUsernameLength = 64;

angular.module('ui.controllers').controller('RegistrationFormController', function($scope,$translate,$ionicPopup,UserAccount,EventStore,LanguageStore){

    $scope.languages = [];

    $scope.username = '';
    $scope.password = '';
    $scope.emailAddress = '';
    $scope.language = "de";

    LanguageStore.getTitles().then(function(languages){
      $scope.languages = languages;
    });

    $scope.applyLanguageChange = function(){
      LanguageStore.updateActiveLanguage($scope.language);
    }

    function setRegisterButtonEnabled(enabled) {
        if (enabled)
            angular.element('#arg-submit-registration').removeClass('disabled');
        else
            angular.element('#arg-submit-registration').addClass('disabled');
    }

    function _register() {
        var username = $scope.username,
            password = $scope.password,
            emailAddress = $scope.emailAddress,
            language = $scope.language;

        console.log("Registering with ", $scope.username,'********');

        if (!username || username.length < kRegistrationFormMinimumUsernameLength || username.length > kRegistrationFormMaximumUsernameLength) {
                $ionicPopup.alert({
                    title: $translate.instant("WHATS_YOUR_NICKNAME"),
                    template: $translate.instant("WE_NEED_A_VALID_USERNAME")
                }).then(function(res) {
                    //
                });
        } else if (!password || password.length < kRegistrationFormMinimumPasswordLength || password.length > kRegistrationFormMaximumPasswordLength) {
                $ionicPopup.alert({
                    title: $translate.instant("WHATS_YOUR_PASSWORD"),
                    template: $translate.instant("WE_NEED_A_VALID_PASSWORD")
                }).then(function(res) {
                    //
                });
        } else if(!language){
            $ionicPopup.alert({
              title: $translate.instant("SELECT_A_LANGUAGE"),
              template: $translate.instant("YOU_NEED_TO_SELECT_A_LANGUAGE")
            }).then(function(res){
              //
            });
        } else {
            setRegisterButtonEnabled(false);

            var register = function(un,pw,ea,ln) {
                UserAccount.register(un,pw,ea,ln, function (success,err) {
                    if (success) {
                        EventStore.storeEvent(kEventSuccessfulRegistration);

                        try {
                            $scope.registrationModal.hide();
                            $scope.authenticationModal.hide();
                        } catch (variable) {}

                        if ($scope.registrationFinishedCallback) {
                            $scope.registrationFinishedCallback(true);
                        }
                        LanguageStore.updateActiveLanguage(ln).then(function(active){
                          console.log('Changed active language to ', active);
                        });
                    } else {
                        EventStore.storeEvent(kEventFailedRegistration);

                        console.log("Error: ", err);
                        alert($translate.instant("OH_NO"),
                          $translate.instant("WE_COULD_NOT_CREATE_ACCOUNT"),
                          $translate.instant("DISMISS"));
                        setRegisterButtonEnabled(true);
                    }
                });
            };

            if ($scope.authenticated) {
                BaasBox.logout().done(function () {
                    console.log("Logging out first before registering.");
                    register(username,password,emailAddress,language);
                });
            } else {
                register(username,password,emailAddress,language);
            }
        }
    }

    $scope.clickRegister = function() {

        if (kAllowRegistration!==undefined && kAllowRegistration===false) {
            setRegisterButtonEnabled(false);
            confirm($translate.instant("OH_NO"),
                    $translate.instant("REGISTRATION_IS_DISABLED"),
                    "Login",
                    function () {
                        $scope.openAuthentication();
                    });
            return;
        }

        _register();
    }
});
