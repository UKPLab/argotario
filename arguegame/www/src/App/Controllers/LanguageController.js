angular.module('ui.controllers').controller('LanguageController', function($scope,$ionicPopup,$ionicActionSheet,UserAccount,$localStorage, LanguageStore){

    $scope.availableLanguages = [];
    $scope.active = LanguageStore.activeLanguage();
    $scope.selected = null;

    LanguageStore.getTitles().then(function(languages){
        $scope.availableLanguages = languages;
        console.log('downloaded language titles', languages)
    });

    $scope.selectLanguage = function() {
        LanguageStore.updateActiveLanguage($scope.selected._id).then(function(active){
            console.log('Changed active language to ', active);
            UserAccount.saveProperties({'language' : active.id}).then(function(){
                $scope.active = active;
            });
        });
        console.log($scope.selected)
    };

    /** Change Language */
$scope.clickChangeLanguage = function() {
    confirm('Change Language?',
        'This will change the game content of the playing rounds. ',
        'Reset',
        function () {
            $localStorage.$reset();
            UserAccount.logOut(function () {
                location.reload();
            });
    });
}
});
