/** This servive provices sounds to play back. */
angular.module('arg.services').provider('SoundStore', function() {

	var _success,_fail,_confirmation;

    this.$get = function($http,$q,$rootScope) { return {

		load: function() {
			_success = new Audio("Resources/Sounds/success.mp3");
			_fail = new Audio("Resources/Sounds/fail.mp3");
			_confirmation = new Audio("Resources/Sounds/confirmation.mp3");
			_ranking = new Audio("Resources/Sounds/ranking.mp3");

			window.sound = this;
		},

        playSuccess: function() {
			_success.play();
		},

		playFail: function() {
			_fail.play();
		},

		playConfirmation: function() {
			_confirmation.play();
		},

		playRanking: function() {
			_ranking.play();
		}

    }}
});
