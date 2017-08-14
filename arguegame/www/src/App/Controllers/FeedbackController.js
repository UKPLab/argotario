kCollectionFeedback = 'feedback';

angular.module('ui.controllers').controller('FeedbackController', function($scope,$ionicModal,$ionicPopup){

    $scope.feedback = {
        emailAddress: '',
        text: '',
        type: ''
    };
    var empty = $scope.feedback;

    $scope.clearAll = function() {
        //$scope.feedbackForm.$setPristine();
        $scope.feedback = angular.copy(empty);
    }

    $scope.clickSubmitFeedback = function(){
        console.log("Will submit feedback: ",$scope.feedback);

        BaasBox.save( preparedForSaving($scope.feedback),kCollectionFeedback).done(function () {
            alert("Thanks a lot.", "Thanks for submitting feedback. It will help improving the app over time.","Dismiss",function () {
                $scope.clearAll();
                $scope.closeFeedback();
            });
        }).fail(function () {
            alert("Oh no!","Sorry, something went wrong while trying to submit the feedback. Please try again later.","Dismiss");
        });
    }

    $scope.onFeedbackTextChange = function() {
        var element = document.getElementById("arg-feedback-textarea");
        element.style.height = element.scrollHeight + "px";
    }

    $scope.clickClearFeedback = function(){
        $scope.clearAll();
    }
});
