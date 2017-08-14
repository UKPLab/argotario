angular.module('ui.controllers').controller('BrowserController', function($scope){

    $scope.historyGo = function(delta) {
        var iframe = angular.element('#browser-view')[0];
        iframe.contentWindow.history.go(delta); // back
    }

    $scope.$watch('browserURL',function () {
        var iframe = angular.element('#browser-view')[0];
        if ($scope.browserURL) {
            iframe.src=$scope.browserURL;
        }
    });

    $scope.openInNativeBrowser = function () {
        window.open($scope.browserURL, "_system");
    }
});
