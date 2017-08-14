kRootControllerRankingDidChange = "kRootControllerRankingDidChange";

/** Call this method before opening a modal. This will fix an issue in IonicFramework where modals, that were loaded before the currently upfront modal, are displayed behind the currently active modal. */
function orderFrontModal(modal) {
    $('.modal-backdrop').css('z-index',5);
    if (modal && modal.el)
        $(modal.el).css('z-index',10);
}

function fixZOrdering(modal) {
    modal.originalShow = modal.show;
    modal.show = function(){
        $('.modal-backdrop').css('z-index',5);
        if (modal && modal.el)
            $(modal.el).css('z-index',10);
        return modal.originalShow();
    }
}

angular.module('ui.controllers').controller('RootController', function($scope,$ionicModal,$ionicPopup,$translate,$timeout,$rootScope,$localStorage,$ionicCustomModal,GameWorldStore,UserAccount, UserStore,DomainStore, TopicStore,ArgumentStore,HighscoreStore,EventStore,LanguageStore,SoundStore,EntityLinker,$ionicSlideBoxDelegate){

    $scope.visitedForeignUser = null;

    EventStore.storeEvent(kEventOpenedApp);

    SoundStore.load();

    window.onbeforeunload = function(){
        EventStore.storeEvent(kEventQuitApp);
    };

    window.angularServices.UserAccount = UserAccount;
    window.angularServices.EntityLinker = EntityLinker;

    window.originalAlert = window.alert;
    window.alert = function(title, subtitle, closeButtonLabel, callback) {
        if (subtitle===undefined) {
            window.originalAlert(title);
        } else {
            $ionicPopup.alert({
                title: (!subtitle)?"Alert":title,
                template: (subtitle)?subtitle:title,
                okText: (closeButtonLabel)?closeButtonLabel:'Ok'
            }).then(function(res) {
                if (callback)
                    callback();
            });
        }
    }

    window.originalConfirm = window.confirm;
    window.confirm = function(title, subtitle, confirmTitle, callback) {
        confirmTitle = confirmTitle || 'Ok';
        if (subtitle===undefined) {
            window.originalConfirm(title);
        } else {
            $ionicPopup.alert({
                title: (!subtitle)?"Alert":title,
                template: (subtitle)?subtitle:title,
                buttons: [
                  { text: $translate.instant('CANCEL') },
                  { text: '<b>'+confirmTitle+'</b>', type: 'button-positive', onTap: function(){return true;} }
                ]
            }).then(function(res) {
                if (res && callback!==undefined)
                    callback();
            });
        }
    }
    /* WICHTIG */
    /* wird zum Beginn der ROOTVIEW geladen */

    $scope.loadGameConfiguration = function(optionalFileName) {
        GameWorldStore.loadConfiguration(optionalFileName).then(function(){
            // Set the initial world selection to 0
            $scope.clickSwitchWorld(0, true);
            var worlds = GameWorldStore.allWorlds();
            angular.forEach(worlds, function (world) {
                world.$ready = false;
            });
            $scope.worlds = worlds;
            var worldSlideBox = $ionicSlideBoxDelegate.$getByHandle('WorldsSlideBox');
            $timeout(function() {
                worldSlideBox.update();
            });
            console.log("Did load game configuration.");
        },function () {
            alert("Oh no!",
                  "The game configuration could not be loaded. Please try again later.",
                  "Dismiss");
        });
    }

    $scope.clickSwitchWorld = function (worldIdx, slide) {
        if (worldIdx != GameWorldStore.selectedWorldIndex()) {
            EventStore.storeEvent(kEventOpenedWorld, {worldIdx: worldIdx});
            GameWorldStore.setSelectedWorldIndex(worldIdx);
            if (slide)
                $ionicSlideBoxDelegate.$getByHandle('WorldsSlideBox').slide(worldIdx);
        }
    };

    $scope.$storage = $localStorage.$default({
        kPrefDidShowIntro: false,
        cachedHighscore: {}
    });

    $scope.currency = "₳";

    /** Provide globally the user object, or null if not authenticated. */
    var _previousRanking = -1;
    $scope.user = null;
    $scope.authenticating = true;
    $scope.authenticated = false;
    $scope.userRanking = -1;

    $scope.fetchUserRanking = function() {
        HighscoreStore.currentUsersRanking().then(function (ranking) {
            $scope.userRanking = ranking.ranking;
            if (_previousRanking==-1) {
                _previousRanking = ranking.ranking;
            } else {
                var deltaRanking = _previousRanking - $scope.userRanking
                _previousRanking = $scope.userRanking;
                if (deltaRanking) {
                    $scope.$broadcast(kRootControllerRankingDidChange, deltaRanking);
                }
            }
        }, function (err) {
            console.log("Could not fetch current user's ranking.", err);
        });
    }

    $scope.$on(kRoundControllerBackgroundEvent, function(_,backgroundKey){
        $scope.openBackgroundEventModal(backgroundKey);
    });

    /** Handle Authentication state changes */
    $scope.$on(kUserAccountAuthenticationStateChanged, function () {
        $scope.authenticating = false;

        var wasUnauthenticated = !$scope.authenticated;

        $scope.authenticated = UserAccount.authenticated();
        $scope.user = UserAccount.user();
        $scope.$apply();

        console.log("Token:");
        console.log(($scope.user) ? $scope.user.token : null);

        var customGameConfiguration = undefined;

        if ($scope.authenticated) {
            $scope.fetchUserRanking();
            customGameConfiguration = valueForKeyPath($scope.user,'visibleByRegisteredUsers.gameConfiguration');
            LanguageStore.updateActiveLanguage(UserAccount.language() || 'en');
        } else {
            $scope.openIntroduction();
        }

        $scope.loadGameConfiguration(customGameConfiguration);
    });

    /** Handle User Points changes */
    $scope.$on(kUserAccountPointsDidChange, function(_,temporaryUserPoints) {
        if (UserAccount.authenticated())
            $scope.fetchUserRanking();
    });

    $scope.$on(kRootControllerRankingDidChange, function(_,delta){
        console.log('ranking changed')
        //if (delta>0)
        //   $scope.openImprovedRankingModal(delta);
    });


    $scope.openImprovedRankingModal = function(delta) {
        var scope = $scope.$new();
        scope.newRanking = _previousRanking;
        scope.oldRanking = _previousRanking-delta;
        $ionicCustomModal.fromTemplateUrl('Views/ImprovedRanking.html', {
            scope: scope,
            animation: 'bounceInUp'
        }).then(function(modal) {

            SoundStore.playRanking();

            $scope.improvedRankingModal = modal;
            scope.hideImprovedRankingModal = function() {
                modal.hide().then(function () {
                    modal.remove();
                });
            }
            modal.show();
        });
    }


    $scope.openImprovedRankingModal = function(delta) {
        var scope = $scope.$new();
        scope.newRanking = _previousRanking;
        scope.oldRanking = _previousRanking-delta;
        $ionicCustomModal.fromTemplateUrl('Views/ImprovedRanking.html', {
            scope: scope,
            animation: 'bounceInUp'
        }).then(function(modal) {

            SoundStore.playRanking();

            $scope.improvedRankingModal = modal;
            scope.hideImprovedRankingModal = function() {
                modal.hide().then(function () {
                    modal.remove();
                });
            }
            modal.show();
        });
    }

    $scope.openBackgroundEventModal = function(bgKey) {
        var scope = $scope.$new();
        split = bgKey.split('/')
        scope.head = split[0];
        scope.body = split[1];
        $ionicCustomModal.fromTemplateUrl('Views/BackgroundEvent.html', {
            scope: scope,
            animation: 'bounceInUp'
        }).then(function(modal) {

            SoundStore.playRanking();

            $scope.backgroundEventModal = modal;
            scope.hideBackgroundEventModal = function() {
                modal.hide().then(function () {
                    modal.remove();
                });
            }
            modal.show();
        });
    }

    UserAccount.restoreSessionIfPossible(function(success){
        if (!success && $localStorage[kPrefDidShowIntro]==true) {
            $scope.openAuthentication();
        } else {
            $scope.authenticating = false;
        }
    });

    $scope.isFollowing = function(username) {
        if (username==null) return false;

        var isFollowing = false;
        angular.forEach( UserAccount.following(), function (userFollowedByMainUser,k) {
            if (userFollowedByMainUser.user == username) {
                isFollowing = true;
                return;
            }
        });

        return isFollowing;
    }

    $scope.isUser = function(username) {
        return UserAccount.user() && username == UserAccount.username();
    }

    /* The Introduction Pop-Over */
    $ionicModal.fromTemplateUrl('Views/Introduction.html', {
        scope: $scope,
        animation: 'none',
        backdropClickToClose: false
    }).then(function(modal) {
        fixZOrdering(modal);
        $scope.introductionModal = modal;

        if (!$scope.$storage.kPrefDidShowIntro) {
            modal.show();
        }
    });

    $scope.openIntroduction = function() {
        $scope.introductionModal.show();
    };
    $scope.closeIntroduction = function(){
        $scope.introductionModal.hide();
    }

    /* The Profile Pop-Over */
    $ionicModal.fromTemplateUrl('Views/UserProfile.html', {
        scope: $scope,
        animation: 'slide-in-up'
    }).then(function(modal) {
        fixZOrdering(modal);
        $scope.userProfileModal = modal;
    });

    $scope.openUserProfile = function() {
        EventStore.storeEvent(kEventOpenedUserProfile);
        $timeout(function () {
            $scope.visitedForeignUser = $scope.user;
            $rootScope.$broadcast(kNotificationUserWillVisitUserProfile);
            $scope.userProfileModal.show();
        }, 50);
    };
    $scope.closeUserProfile = function() {
        $scope.userProfileModal.hide();
    };


    /* The Profile Pop-Over */
    $ionicModal.fromTemplateUrl('Views/ChooseAvatar.html', {
        scope: $scope,
        animation: 'slide-in-up'
    }).then(function(modal) {
        fixZOrdering(modal);
        $scope.chooseAvatarModal = modal;
    });

    $scope.openChooseAvatarModal = function() {
        EventStore.storeEvent(kEventOpenedChooseAvatar);
        $scope.chooseAvatarModal.show();
    };
    $scope.closeChooseAvatarModal = function() {
        $scope.chooseAvatarModal.hide();
    };

    /* The Account Pop-Over */
    $ionicModal.fromTemplateUrl('Views/Account.html', {
        scope: $scope,
        animation: 'slide-in-up'
    }).then(function(modal) {
        fixZOrdering(modal);
        $scope.accountModal = modal;
    });

    $scope.openAccount = function() {
        EventStore.storeEvent(kEventOpenedAccount);
        $scope.accountModal.show();
    }
    $scope.closeAccount = function() {
        $scope.accountModal.hide();
    };

    //Cleanup the modal when we're done with it!
    $scope.$on('$destroy', function() {
        console.log('DESTROYED');
        $scope.gameSessionModal.remove();
    });
    // Execute action on hide modal
    $scope.$on('gameSessionModal.hidden', function() {
        alert('gameSessionModal hidden');
    });
    // Execute action on remove modal
    $scope.$on('gameSessionModal.removed', function() {
        // Execute action
        alert('gameSessionModal removed');
    });

    /* The Browser Pop-Over */
    $ionicModal.fromTemplateUrl('Views/Browser.html', {
        scope: $scope,
        animation: 'slide-in-up'
    }).then(function(modal) {
        fixZOrdering(modal);
        $scope.browserModal = modal;
    });

    $scope.openBrowser = function(URL) {
        if ('cordova' in window) {
            window.open(URL, '_system');
        } else {
            console.log("Will open browser with URL ",URL);
            $scope.browserModal.show();
            $scope.browserURL = URL;
        }
    };

    $scope.closeBrowser = function() {
        $scope.browserModal.hide();
    };


    /* The Authentication Pop-Over */
    var showAuthenticationModalRequired = false;
    $ionicModal.fromTemplateUrl('Views/Authentication.html', {
        scope: $scope,
        animation: 'slide-in-up'
    }).then(function(modal) {
        fixZOrdering(modal);
        $scope.authenticationModal = modal;
        if (showAuthenticationModalRequired) {
            showAuthenticationModalRequired = false;
            modal.show();
        }
    });

    $scope.openAuthentication = function() {
        if (!$scope.authenticationModal) {
            showAuthenticationModalRequired = true;
            return;
        }
        EventStore.storeEvent(kEventOpenedAuthentication);
        $scope.authenticationModal.show();
    };
    $scope.closeAuthentication = function() {
        EventStore.storeEvent(kEventAbortedAuthentication);
        $scope.authenticationModal.hide();
    };


    /* The Registration Pop-Over */
    $ionicModal.fromTemplateUrl('Views/Registration.html', {
        scope: $scope,
        animation: 'slide-in-up'
    }).then(function(modal) {
        fixZOrdering(modal);
        $scope.registrationModal = modal;
    });

    $scope.openRegistration = function() {
        EventStore.storeEvent(kEventOpenedRegistration);
        $scope.registrationModal.show();
    };
    $scope.closeRegistration = function() {
        EventStore.storeEvent(kEventAbortedRegistration);
        $scope.registrationModal.hide();
    };

    $ionicModal.fromTemplateUrl('Views/UserProgress.html', {
        scope: $scope,
        animation: 'slide-in-up'
    }).then(function(modal) {
        fixZOrdering(modal);
        $scope.progressModal = modal;
    });

    $scope.openProgress = function() {
        $scope.progressModal.show();
    };
    $scope.closeProgress = function() {
        $scope.progressModal.hide();
    };

    $ionicModal.fromTemplateUrl('Views/Feedback.html', {
        scope: $scope,
        animation: 'slide-in-up'
    }).then(function(modal) {
        fixZOrdering(modal);
        $scope.feedbackModal = modal;
    });

    $scope.openFeedback = function() {
        $scope.feedbackModal.show();
    };
    $scope.closeFeedback = function() {
        $scope.feedbackModal.hide();
    };

    $ionicModal.fromTemplateUrl('Views/Language.html', {
        scope: $scope,
        animation: 'slide-in-up'
    }).then(function(modal) {
        fixZOrdering(modal);
        $scope.languageModal = modal;
    });

    $scope.openLanguage = function() {
        $scope.languageModal.show();
    };
    $scope.closeLanguage = function() {
        $scope.languageModal.hide();
    };


    /* The Registration Pop-Over */
    $ionicModal.fromTemplateUrl('Views/Acknowledgements.html', {
        scope: $scope,
        animation: 'slide-in-up'
    }).then(function(modal) {
        fixZOrdering(modal);
        $scope.acknowledgementsModal = modal;
    });

    $scope.openAcknowledgements = function() {
        $scope.acknowledgementsModal.show();
    };
    $scope.closeAcknowledgements = function() {
        $scope.acknowledgementsModal.hide();
    };


    /* The Foreign Profile modal */
    $ionicModal.fromTemplateUrl('Views/ForeignProfile.html', {
        scope: $scope,
        animation: 'slide-in-up'
    }).then(function(modal) {
        fixZOrdering(modal);
        $scope.foreignProfileModal = modal;
    });

    $scope.openForeignProfile = function(username) {
        $scope.closeUserProfile();
        EventStore.storeEvent(kEventOpenedForeignProfile,{username: username});
        UserStore.load(username, function (user) {
            if (user) {
                $scope.visitedForeignUser = user;
                $rootScope.$broadcast(kNotificationUserWillVisitUserProfile);
                $scope.foreignProfileModal.show();
            } else {
                alert("Oh no!","The user could not be loaded. Please try again later.", "Dismiss");
            }
        })
    };

    $scope.closeForeignProfile = function() {
        $scope.foreignProfileModal.hide();
    };


    /* The Choose User modal */
    $ionicModal.fromTemplateUrl('Views/ChooseUser.html', {
        scope: $scope,
        animation: 'slide-in-up'
    }).then(function(modal) {
        fixZOrdering(modal);
        $scope.chooseUserModal = modal;
    });

    $scope.openChooseUser = function() {
        EventStore.storeEvent(kEventUsedUserSearch);
        $scope.chooseUserModal.show();
    };

    $scope.closeChooseUser = function() {
        $scope.chooseUserModal.hide();
    };
    /*setTimeout(function(){
        $scope.openGameSession();
    }, 500);
*/
});
