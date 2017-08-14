var attempts = 0;
var SSL = setInterval(function () {
	try {
		cordova.plugins.certificates.trustUnsecureCerts(true);
		clearInterval(SSL);
	} catch (e) {
		attempts++;
		if (attempts>20)
			clearInterval(SSL);
	}
},250);

/**
 * app.js
 * This file is the main JavaScript file, that manages the dependencies,
 * contains configuration parameters, and builds the app.
 */

angular.module('arg.directives', []);
angular.module('arg.services', []);
angular.module('ui.controllers', ['ngStorage','arg.services','ngCordova']);
angular.module('arg.game.roundcontrollers', ['arg.services']);


// Foundation
YES = true;
NO = false;
nil = null;


// Preferences compNames
kPrefDidShowIntro										= "kPrefDidShowIntro";
kPrefDidExplainBonusLevels								= "kPrefDidExplainBonusLevels";

// Notification names
kNotificationUserDidChooseUser							= "kNotificationUserDidChooseUser";
kNotificationUserDidAcceptToCreateAccountAfterPlaying	= "kNotificationUserDidAcceptToCreateAccountAfterPlaying";
kNotificationUserDidChooseAvatar						= "kNotificationUserDidChooseAvatar";
kNotificationUserWillVisitUserProfile					= "kNotificationUserWillVisitUserProfile";

app = angular.module('app',[
							'ionic',					// The Ionic Framework
							'ngCordova',				// The Cordova Framework
							'pascalprecht.translate',	// framework for multilinguality
							'arg.services',				// All Arg-related Services
							'ui.controllers',			// All UI controllers
							'arg.game.roundcontrollers',// All game related controllers
							'arg.directives',			// All custom game related Angular directives
							]);

// configure angular-translate
angular.module('app').config(function ($translateProvider) {
	// configure loading the language files
	$translateProvider.useStaticFilesLoader({
    prefix: 'Resources/Languages/lang-',
    suffix: '.json'
  });

  // set default language to English
 	$translateProvider.preferredLanguage('de');
});

// configure logging
app.config(['$logProvider', function($logProvider){
	DEBUG = true;
    $logProvider.debugEnabled(DEBUG);
}]);

BaasBox.setEndPoint(kBaasBoxURL);

app.run(function($ionicPlatform) {

	// Make sure all links with _blank will be opened by the native browser
	$(document).on('click', 'a[target=_blank]',function(e) {
		e.preventDefault();
		window.open($(this).attr('href'), '_system');
		return false;
	});

    $ionicPlatform.ready(function() {

		if ("corodva" in window) {

			$(document).ready(function () {
				//
			});

			if(window.cordova) {
				cordova.plugins.Keyboard.hideFormAccessoryBar(true);
				cordova.plugins.Keyboard.hideFormAccessoryBar(true);
			}

	        // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
	        // for form inputs)
	        if(window.cordova && window.cordova.plugins.Keyboard) {
	            cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
	        }

	        if(window.StatusBar) {
	            StatusBar.styleDefault();
	        }

		}

    });
});


/**
 * A clone of the Node.js util.inherits() function. This will require
 * browser support for the ES5 Object.create() method.
 *
 * @param {Function} ctor
 *   The child constructor.
 * @param {Function} superCtor
 *   The parent constructor.
 */
angular.inherits = function (ctor, superCtor) {
    ctor.super_ = superCtor;
    ctor.prototype = Object.create(superCtor.prototype, {
        constructor: {
            value: ctor,
            enumerable: false
        }
    });
};
