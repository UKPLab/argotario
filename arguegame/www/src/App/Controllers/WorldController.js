angular.module("ui.controllers").controller("WorldController", function($scope,$rootScope, $controller,$translate,$timeout,GameWorldStore,$interval, $ionicModal, $ionicCustomModal, $localStorage, UserAccount,EventStore){

	var _levelController = null;
    //contains this triple: [background-function, params for function, interval-execution needed to cancel]
    var _backgroundTasks = {};

	var _initWorld = function() {

		// initialise how many levels the user already complete in the current world
		$scope.completedLevels = UserAccount.completedLevelIndexesInWorldWithId($scope.world.id);

		//
		$scope.unlockedLevels = GameWorldStore.unlockedLevelsInWorldWithId($scope.world.id);

		// Compare Number of Levels in the World and Levels which the user already completed in the word
		$scope.world.completed = ($scope.world.levels.length && $scope.world.levels.length==$scope.completedLevels.length);

		$timeout(function () {
			$scope.world.$ready = true;
		},200);

	};

	$timeout(function () {
		_initWorld();
	});


	// Provide the data for the current World's Levels to the WorldView
	$scope.data = $scope.world;

	$scope.$on(kGameWorldStoreSelectedWorldIndexDidChange, function(e,data) {
        //nothing do do so far
	});

	$scope.$on(kGameWorldStoreDidLoadConfiguration, function () {
		_initWorld();
	});

    $scope.$on(kRoundControllerBackgroundEvent, function(_,backgroundKey){
        console.log('IT CHANGED< GOT A NOTIFICATION', backgroundKey);
        if (backgroundKey in _backgroundTasks) {
            $interval.cancel(_backgroundTasks[backgroundKey][1]);
            split = backgroundKey.split('/');
            level = split[0];
            round = split[1];
            for (var i=0; i<$scope.data.levels.length; i++) {
                if ($scope.data.levels[i].id == level) {
                    $scope.data.levels[i].changed = true;
                    return;
                }
            }
        }
    });

	$scope.$on(kUserAccountAuthenticationStateChanged, function () {
		$scope.completedLevels = UserAccount.completedLevelIndexesInWorldWithId($scope.world.id);
		$scope.unlockedLevels = GameWorldStore.unlockedLevelsInWorldWithId($scope.world.id);
        for (key in _backgroundTasks) {
            $interval.cancel(_backgroundTasks[key][1]);
        }
		$timeout(function () {
			$scope.world.$ready = true;
		},500);
	});

	$scope.$on(kUserAccountCompletedLevelsChanged, function () {
		// Whenever the set of completed levels change, re-render the view.
		$scope.completedLevels	= UserAccount.completedLevelIndexesInWorldWithId($scope.world.id);
		$scope.unlockedLevels	= GameWorldStore.unlockedLevelsInWorldWithId($scope.world.id);
		isCompleted				= ($scope.world.levels.length && $scope.world.levels.length==$scope.completedLevels.length);
		if (isCompleted && !$scope.world.completed) {
			$ionicCustomModal.fromTemplateUrl('Views/WorldDone.html', {
				scope: $scope,
				animation: 'slide-in-up'
			}).then(function(modal) {
				$scope.doneModal = modal;
				$scope.doneModal.show();
			});
		}

		var before = $scope.world.completed;
		$scope.world.completed = isCompleted;
		if (!before && isCompleted) {
			EventStore.storeEvent(kEventFinishedWorld,{worldId: $scope.world.id});
		}

		angular.forEach($scope.completedLevels, function (idx) {
			var level = $scope.world.levels[idx];

			if (level && level['isBonusLevel']!==undefined && level.isBonusLevel && $localStorage.kPrefDidExplainBonusLevels!==true) {
				alert($translate.instant("BONUS_LEVELS"),
					  $translate.instant("YOU_HAVE_COMPLETED_A_BONUS_LEVEL"),
					  $translate.instant("DISMISS"), function () {
					$localStorage.kPrefDidExplainBonusLevels = true;
				});
			}
		});
	});

	$scope.isLevelCompleted = function (idx) {
		return UserAccount.isLevelWithIndexCompletedInWorldWithId(idx, $scope.world.id);
	};

	$scope.currentLevelController = function () {
		return _levelController;
	};

	$timeout(function () {
		$(".bonus-level").sparkle({
			color: "white",
			count: 30,
			overlap: 10,
			speed: 1,
			minSize: 2,
			maxSize: 7,
			direction: "both"
		}).trigger("start.sparkle");
	},2500);

// - - - User Interface handling - - -

	// MESSAGE FOR LOCKED LEVEL
	$scope.clickLockedLevel = function(level,index) {
		alert($translate.instant("NOT_YET"),
			$translate.instant("COMPLETE_THE_REMAINING_LEVELS"),
			$translate.instant("DISMISS"));
		return true;
	};

	// MESSAGE FOR DISABLED LEVEL
	$scope.clickDisabledLevel = function(level,index) {
		alert($translate.instant("NOT_YET"),
			$translate.instant("THIS_LEVEL_IS_CURRENTLY_DISABLED"),
			$translate.instant("DISMISS"));
		return true;
	};

	$scope.clickStartLevel = function(level,levelIndex) {
        console.log($scope.data)
		function playLevel() {
			$scope.currentLevel = GameWorldStore.getLevel(levelIndex);
            $scope.currentLevel.changed = false;
			$scope.currentLevel.idx = levelIndex;
            $scope.stopLevelBackgroundTasks($scope.currentLevel);

			/* The Game Session Pop-Over */
			$ionicModal.fromTemplateUrl('Views/LevelContainer.html', {
			    scope: $scope,
			    animation: 'slide-in-up',
				backdropClickToClose: false
			}).then(function(modal) {
				_levelController.levelWillOpen();

				$scope.levelModal = modal;
                $scope.levelModal.show().then(function () {
					_levelController.start();
					_levelController.levelDidOpen();
					EventStore.storeEvent(kEventOpenedLevel, {levelId:_levelController.data.id});
				});
			});
		}

		var completedBefore = $scope.isLevelCompleted(levelIndex);
		if (completedBefore) {
			var repeatable = ($scope.world.levels[levelIndex].repeatable);
			if (repeatable) {
				confirm($translate.instant("ALREADY_COMPLETED"),
						$translate.instant("DO_YOU_WANT_TO_PLAY_THIS_LEVEL_AGAIN"),
						$translate.instant("PLAY_AGAIN"),
						function () {
							EventStore.storeEvent(kEventRepeatedLevel, {levelId:$scope.data.levels[levelIndex].id});
						 	playLevel();
						});
			} else {
				alert($translate.instant("ALREADY_COMPLETED"),
					  $translate.instant("LOOK_FOR_ANOTHER_LEVEL"),
					  $translate.instant("DISMISS"));
			}
		} else {
			playLevel();
		}
    };

	$scope.clickEndLevel = function() {
		// Mark this level as complete
		if (_levelController.userDidComplete()) {
            var completable = (_levelController.data.completable)
            if (completable) {
			    UserAccount.setLevelWithIndexCompletedInWorldWithId($scope.currentLevel.idx, $scope.world.id);
			    EventStore.storeEvent(kEventFinishedLevel, {levelId:_levelController.data.id});
            }
		}
		_levelController.levelWillClose();
		_levelController.end();

        $scope.startBackgroundTasks(_levelController.getBackgroundTasks());
		$scope.levelModal.remove().then(function () {
			_levelController.levelDidClose();
            _levelController.$destroy();
		});
	};

	$scope.clickQuitLevel = function(){
		confirm($translate.instant('QUIT_GAME_SESSION'),
				$translate.instant('ARE_YOU_SURE'),
				$translate.instant('QUIT'), function () {
					$timeout($scope.clickEndLevel, 500);
					EventStore.storeEvent(kEventQuitLevel, {levelId:_levelController.data.id});
					$rootScope.$broadcast('WillQuitLevel');
				});
	};

    $scope.startBackgroundTasks = function(bgTasks){
        //start background-tasks from round-controllers
        for (key in bgTasks) {
            console.log('adding bg task to list', key)
            _backgroundTasks[key] = [bgTasks[key]];
            console.log('starting bg task', key)
            _backgroundTasks[key][1] = _backgroundTasks[key][0](key);
        }
    };

    $scope.stopLevelBackgroundTasks = function(level) {
        for (var i=0; i<level.rounds.length; i++) {
            identifier = level.id + '/' + level.rounds[i].id;
            if (identifier in _backgroundTasks) {
                console.log('stopping bg task', key)
                $interval.cancel(_backgroundTasks[identifier][1]);
            }
        }
    };

	$scope.registerLevel = function(levelScope) {
		_levelController = levelScope;
	};

});
