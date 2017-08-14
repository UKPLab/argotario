angular.module('ui.controllers').controller('ImprovedRankingController', function($scope,$timeout){

    $timeout(function () {
        $("#arg-improved-ranking .current-ranking").sparkle({
            color: "white",
            count: 20,
            overlap: 10,
            speed: 1,
            minSize: 5,
            maxSize: 20,
            direction: "both"
        }).trigger("start.sparkle");
    },2500);


});
