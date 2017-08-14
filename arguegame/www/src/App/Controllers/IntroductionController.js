angular.module('ui.controllers').controller('IntroductionController', function($scope,$translate,$ionicPopup,$ionicSlideBoxDelegate,$timeout,$localStorage,EventStore,UserAccount,LanguageStore){

    var slideBox = $ionicSlideBoxDelegate.$getByHandle('IntroductionSlideBox');

    $scope.languages = [];
    $scope.language = "de";

    LanguageStore.getTitles().then(function(languages){
      $scope.languages = languages;
    });

    $scope.applyLanguageChange = function(){
      LanguageStore.updateActiveLanguage($scope.language);
    }

    $scope.$on(kUserAccountAuthenticationStateChanged, function () {
        if (UserAccount.authenticated()) {
            $scope.completeIntroduction();
        }
    });

    $scope.clickSkipRegistration = function () {
        if (kAllowRegistration!==undefined && kAllowRegistration===false) {
            alert("Oh no!",
                  "During our user study, registration can't be skipped. Please use the nickname and password mentioned in the user study introduction to log in.",
                  "Dismiss");
            return;
        }
        EventStore.storeEvent(kEventSkippedRegistration);
        confirm("No Registration?","All the game progress will not be saved if you choose to not create an account.", "Skip", $scope.nextSlide);
    }

    $scope.clickCompleteIntroduction = function () {
        $scope.completeIntroduction();
    }

    $scope.registrationFinishedCallback = function(success) {
        console.log("Registration in introduction is done. Thanks for that.");
        slideBox.next();
    }

    /** Marks the introduction as 'shown', so that it won't be shown again in future. Closes the introduction modal window. */
    $scope.completeIntroduction = function() {
        $scope.$storage.kPrefDidShowIntro = true;
        $scope.introductionModal.hide();
    }

    /** Moves on to the next slide of the introduction. */
    $scope.nextSlide = function() {
        slideBox.next();
    }

    /** Animates the character. */
    $scope.twerk = function(characterId) {
        EventStore.storeEvent(kEventTwerk);
        angular.element('#'+characterId).addClass('tada');
        $timeout(function () {
            angular.element('#'+characterId).removeClass('tada');
        },2000);
    }
});
