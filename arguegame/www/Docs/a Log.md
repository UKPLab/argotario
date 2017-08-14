
General Note: When we take about a controller subclass, it means that the subclassing controller inherits the parent controller's scope, and thus, can overwrite its methods. It is not that kind of subclassing which we know from normal OOP languages though.

## Sat, 21st Feb '15

To improve the app (loading) performance, we made use of file concatination and minimization via gulp and cordova. Therefore we had to re-structure the folder hierarchy slightly. Currently, we are bundling all app-related files (which are not shared with any other project, e.g., argueadmin) into one file called bin/App.js. Except all vendor files, e.g., jQuery and the BaasBox JS SDK, which are all bundled into one file, caleld bin/Vendor.js. Shared code is bundled into bin/Shared.js, which is now included by the argueadmin, via "../../" links to reference the 'arguegame', instead of using any symlinks.

All the JS files (e.g., Controller files, etc.) must be placed in the respective src/XYZ/ subfolder, where XYZ is either App, Vendor or Shared. These subfolders will then automatically be bundled into one JS file in /bin, if ionic is running.



## Fri, 20th Feb '15

We can now specify an argumentId within the 'parameters' of a round to force choosing a specific argument as the subject of this round.

## Thu, 19th Feb '15

I added a new API "arg.entities/entityWithIdInCollection" to return a single entity (as a JSON) determined by its Id and its collection name. The API also lets you specify a comma-separated list of keyPaths which you would to get the voting distributions for.

## Wed, 18th Feb '15

Warning:
A user's input is VALID, if his answer can be processed. Usually, this means that the user has filled out all form fields, or specified his answer completely.
A user's input is VERIFIABLE, if we have the data to assess, whether the input is RIGHT or WRONG. This is either the case, if the (e.g.) argument has the
'isEditorial' flag set, or if there are enough votings for the data, so that a reliable majority voting result can be determined.

Anti-Cheating:
Every round can specify a minimumAssumedPlayingTime(). If the player takes less than this time, no content will generated during this round (neither data, nor votings).

## Fri, 13th Feb '15

### Voting system

Users can both generate data, and assess the data of others. We call this voting, and technically it works as follows.
There is a Document Collection named 'votings' in the back-end. Whenever a user votes any kind of object (any of its properties, to be precise), a new voting document is being created. The voting contains the three keys id, keyPath and value. The id is the record identity of the object whose attributes has been assessed by the user. The keyPath is the attribute key path of the attribute / property that has been assessed by this vote, beginning at the assessed object at the root. The value is the value which the user thinks the referenced attribute should contain.

So if a user for example is being asked whether a shown argument is a Pro or a Contra argument, and Pro has been chosen, a voting will be submitted with the following JSON content:

	{
		id: '…'
		keyPath: 'stance',
		value: 'pro'
	}

Similarly, when a user is being asked to pick the premise(s) within an argument, for each (!) of the picked components, the following voting will be submitted:

	{
		id: '…',
		keyPath: 'components.1.type',
		value: 'premise'
	},
	{
		id: '…',
		keyPath: 'components.2.type',
		value: 'premise'
	}

On the server side, within the respective BaasBox plug-in (e.g., arg.arguments), whenever objects are being returned by the API, the data of the voted objects are extended with the calculated result of the votings. The convention is that for every voted attribute A, a 'virtual' attribute is added next to it as a sibling, named 'votedA' (camel-case), prefixed with a '#' symbol to indicate that it's a virtual key (to make clear it doesn't belong to the DB data).
So for example, users have submitted many votings with regards to the component types of an argument. Since the components of the arguments are stored in the array referenced by the 'components' key, each of the array objects (= one component) are extended by one additional derived key-value pair, that summarizes the current votings for the 'type' attribute of the component. Thus, the key of this pair is '#votedType', and the value is a dictionary, that maps each of the submitted voting values onto their statistical value. Similarly, the stance of an argument can be voted, and thus, a new virtual key named '#votedStance' is added. An argument returned by the back-end could look as follows:

	{
		id: '…',
		components: [{
			body: '…',
			type: 'claim',
			#votedType: {
				claim: 0.75,
				premise: 0.25
			}
		},{
			body: '…',
			type: 'premise',
			#votedType: {
				claim: 0.1,
				premise: 0.9
			}
		}],
		stance: 'pro',
		#votedStance: {
			pro: 0.8,
			contra: 0.2
		}
	}

In every distribution, there is also a '#confidence' key-value, which is a value within 0 and 1, that indicates how definite the current voting is. 1 means that all votings agree, whereas 0 means that there is currently no agreement at all. At least today, this confidence level is being computed very simply: substract the average of all non-max values from the maximum value of all values, e.g.:

	#votedType: {
		claim: 0.1,			// nonMaxValue
		premise: 0.9,		// maxValue
		#confidence: 0.8	// == maxValue - avg(nonMaxValues) = 0.9 - 0.1/1
	}

Now based on the distribution of votings, the front-end (the game) must decide how to handle the user's game input. If the confidence level does not exceed a certain threshold, the users will be thanked and they get some coins. If the confidence is high, they will see either a Wrong! or Right! feedback.


## unauthCache

To allow visitors to use the app, we need to store their current progress temporarily. Therefore, the UserAccount has an unauthCache, which is a transient user object with the same data structure as the normal user object, coming from BaasBox. The UserAccount library has been adapted to make use of the unauthCache object instead of the user object whenever the user is not authenticated and its data needs to be read or changed.

This means we also need to offer transferring the progress of visitors to a proper account once the registration (which will be offered after completing a level) is done.

## 26th Jan '15

During the past days I've been extending the app in all kind of ways.
Today I began integrating BaasBox as the Backend for the client app. Most of the BaasBox functionality has been wrapped by the UserAccount service. Some important functions:
- authenticateIfPossible: reads the credentials from the localStorage, and, if they are present, tries to authencate.
- save() saves the currently locally stored user data on the server
- saveProperty({'key':'value'} stores one specific key-value in the visibleForRegisteredUsers storage of the user on the server
- property(name) returns the value of specified key
- the RootScope now has a $scope.user, which is a mirrored object of the BaasBox user object.

## 21th Jan '15

Improved the docs in World/Level/RoundController and grouped methods semantically.

Improved the lifecycle of levels and rounds. There are now hooks (willOpen/didOpen/willEnd/didEnd), etc., and clear, dedicated starting methods (start()) in each respective kind of class.

argCountdown
Continued working on the countdowns. The argCountdown directive now has additional attributes, such as auto-start, controller, and more. Pass any object (e.g., {}) of the current shope as the countdown's controller attribute. This object then will be extended in the directive linking code with methods that let you then control the countdown from your normal controller: start() resets the controller and starts counting down (after the defer phase). reset() only resets the progress back to 100%.


## 20th Jan '15

Made the countdown work per round.


## 19th Jan '15

I set up a workflow to automate the compilation of SASS files (scss) using gulp. The ionic.project file lists the watchSass gulp task, which observes all .scss files in the /www folder, and compiles them into their minified .css files in the same directory of the original .scss file.

That said, I also added a new ionic-custom.scss file, which lets you customize the SCSS variables, which the Ionic SCSS file is using for its colors, fonts, margin, etc. This file then includes the normal Ionic file, which has been included by index.html before. By prepending the variable definition via the ionic-custom.scss file, future Ionic library updates on the project will not overwrite the variable customizations.

CONVENTION: All game related angular directives will now be placed into the ArgDirectives.js / ArgDirectives.css files, to not have thousands of Arg?.js/.css files for each individual directive.


## 18th Jan '15

I introduced the $ionicCustomModal provider, which acts exactly as $ionicModal, except the fact, that the HTML of the modal window is completely customizable. The way this is implmeneted is that $ionicCustomModal uses the same code as $ionicModal, except some very slight modifications. The custom modal(s) are used for, e.g., the Failure and Success modal, which also have a custom animation (bounceInUp).

I finished the ArgArgument directive, which lets you display an argument based on an argument model inside the HTML.

Next, I also started working on the PickTheComponentController round.


## 16th Jan '15

I again worked on the foundation for the future.
CONVENTION:
- Every [World/Level/Round]Controller provides the data, that has been configured in the gameConfiguration via the $scope.data key to the view. Thus, the respective [World/Level/Round]View always has a reference to the gameConfiguration via the 'data' model, e.g., {{ data.id }}.
- Controller specific data must be placed inside the 'parameters' key: Every custom data that can be passed into custom controller subclasses, must be in the gameConfiguration underneath the 'parameters' key. E.g., the "StaticContent" round has a "HTMLFile" input parameter that defines which HTML snippet to display. This HTMLFile value is set via the "parameters: { HTMLFile: 'Lvl1.html'}" data in the gameConfiguration.

Concerning the Rounds input validation flow:
- User clicks any button with the clickSubmitInput
- inputIsValid() is being called on the special RoundController subclass
- if YES, presentSuccess() will be called on RoundController. Otherwise, presentFailure() will be called, which opens a modal
- if the input was, pointsForInput() is being called on the special RoundController subclass
- the amount is then added coin by coing to the user's account (for the animation)
- the unlockContinue() is being called that unlocks the Continue button
- ---
- once the user clicks clickContinue()...


## 15th Jan '15

I restructured the project to have more Xcode project like folder hierarchy: Resources, Controllers, Views, Models, Vendors in the root level.

I also added TypeScript compilation: Whenever a '.ts' file changes, its compiled version (via tsc) will be placed next to the original TypeScript file. To do this, the project's ionic.project file has been modified to run the 'watchTypeScript' gulp task while serving (ionic serve). The watchTypeScript task is defined in the project's gulpfile.js.


## 5th Jan '15

Today I finished extending the architecture to allow configuring the game, its worlds and levels, via a JSON file.
This file is called gameConfiguration.js and is placed in the new 'gamecontent' top-level folder, where all game related contents reside. From now on, the game contents are completely separated from the core files, to allow treating the core itself as a black-box when someone decides to extend the game with new levels or rounds.

Since future extensions of the game may require the game to be fully customizable, both the controllers for the levels, and for the rounds need to be extendable. Since Angular-JS and JavaScript do not provide a direct way to subclass controller classes, a work-around had to be used to allow customization. For the levels, this subclassing is implemented in a more complex way than for the rounds.

Customizing a level enables you to overwrite, e.g., the handlers for the UI buttons 'Skip' or 'Quit'. By doing so, you can disable the skipping button for the level. Currently, when a level is selected by a user, a modal will come up. The contents of the modal is defined by the *LevelContainer* view, which simply defines the root class *LevelController* to be the controller for the scope of the modal. Next, this view simply includes the sub-view specified by the *levelView* variable, which is by default the *StandardLevel* view, unless the gameConfiguration specifies a different one via the 'customView' key. If you make use of such a custom view, you can introduce a new controller scope in your custom sub-view, in which you can overwrite the methods of the default LevelController. You then should include the 'StandardLevel' view again within your custom view. Thus, the custom view generally should be very lightweight. Remember that the rounds are not part of the levels, but have dedicated round views instead.

A level consists of a set of rounds, which will each be displayed as an individual page in a slidebox. Every type of a mini-game has its own controller. Each round is encapsulated by a RoundController, whose methods you should overwrite in the respective round controllers. Which controller is being used by the round, is defined by the 'view' key in the gameConfiguration. Each round has a dedicated subfolder of the same name in the gamecontents/rounds/ folder, containing the $(round).html view and the $(round)Controller.js
