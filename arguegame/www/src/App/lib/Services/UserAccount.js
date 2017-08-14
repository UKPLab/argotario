kUserAccountPointsAreChanging = "kUserAccountPointsAreChanging"; // Posted while the points are incrementing coin by coin
kUserAccountPointsDidChange = "kUserAccountPointsDidChange"; // Posted once the incrementing has finished
kUserAccountLevelProgressChanged = "kUserAccountLevelProgressChanged";
kUserAccountCompletedLevelsChanged = "kUserAccountCompletedLevelsChanged";
kUserAccountAuthenticationStateChanged = "kUserAccountAuthenticationStateChanged";
kUserAccountFollowersChanged = "kUserAccountFollowersChanged";
kUserAccountFollowingChanged = "kUserAccountFollowingChanged";
kUserAccountAvatarDidChange = "kUserAccountAvatarDidChange";

kCollectionPointsOverTime = "pointsOverTime";

/** The UserAccount is a service that provides access to the gameConfiguration.js file. */
angular.module('arg.services').provider('UserAccount', function() {
    var _user;
    var _authenticated = false;
    var _followers = null;
    var _following = null;

    // Define the public API
    this.$get = function($http, $q, $rootScope, $localStorage, $timeout) {

        var self = {};

        self.finishAuthenticationWithSuccess = function(success) {
            _authenticated = success;
            $rootScope.$broadcast(kUserAccountAuthenticationStateChanged,null);

            if (success) {
                // Fetch followed friends
                self.fetchFollowers();
                self.fetchFollowing();
            }
        }

        angular.extend(self,{

            register: function(username, password, emailAddress, language, callbackWithSuccessFlag) {

                BaasBox.signup(username,password,{email: emailAddress, lang: language}).done(function () {
                    console.log("Did finish saving initial properties for new account.");
                    self.authenticateWithCredentials(username,password,callbackWithSuccessFlag);
                }).fail(function (err) {
                    callbackWithSuccessFlag(false,err);
                });
            },

            fetchFollowers: function(callbackWithSuccessFlag) {
                //var self = this;
                BaasBox.fetchFollowers(this.username()).done(function(res){
                    _followers = res.data;

                    // Adds a 'followedByUser' flag to each of the main user's followers
                    function addFollowedByUserFlag() {
                        angular.forEach(_followers, function (userFollowingMainUser,k) {
                            userFollowingMainUser.followedByUser = false;
                            angular.forEach(_following, function(userFollowedByMainUser, k2){
                                if (userFollowedByMainUser.user == userFollowingMainUser.user) {
                                    userFollowingMainUser.followedByUser = true;
                                    return;
                                }
                            });
                        });
                    }


                    if (_following) {
                        // IF the users, that follows the main user has already been loaded, go on:
                        addFollowedByUserFlag();
                        $rootScope.$broadcast(kUserAccountFollowersChanged,null);
                        if (callbackWithSuccessFlag)
                            callbackWithSuccessFlag(true);
                    } else {
                        // ELSE, fetch the Followings first
                        self.fetchFollowing(function (success) {
                            if (success)
                                addFollowedByUserFlag();

                            $rootScope.$broadcast(kUserAccountFollowersChanged,null);
                            if (callbackWithSuccessFlag)
                                callbackWithSuccessFlag(true);
                        });
                    }

                }).fail(function () {
                    if (callbackWithSuccessFlag)
                        callbackWithSuccessFlag(false);
                });
            },

            fetchFollowing: function (callbackWithSuccessFlag) {
                // Fetch the user's followers
                BaasBox.fetchFollowing(this.username()).done(function (res) {
                    _following = res.data;

                    angular.forEach(_following, function (userFollowedByMainUser,k) {
                        userFollowedByMainUser.followedByUser = true;
                    });

                    $rootScope.$broadcast(kUserAccountFollowingChanged,null);
                    if (callbackWithSuccessFlag)
                        callbackWithSuccessFlag(true);
                }).fail(function () {
                    if (callbackWithSuccessFlag)
                        callbackWithSuccessFlag(false);
                });
            },

            authenticateWithCredentials: function(username,password,callbackWithSuccessFlag) {
                console.log("Authenticating with ", username, '***');

                if (username===undefined || password===undefined) {
                    // No credentials stored, pop-over the login screen
                    _authenticated = false;
                    if (callbackWithSuccessFlag!==undefined)
                        callbackWithSuccessFlag(false);
                } else {
                    //var self = this;
                    BaasBox.login(username, password).done(function (user) {
                        console.log("Freshly authenticated as user ", user);
                        _user = user
                        self.finishAuthenticationWithSuccess(true);
                        callbackWithSuccessFlag(true);
                    }).fail(function (err) {
                        // Could not connect to back-end
                        console.error("Error while trying to authenticate: ", err);
                        self.finishAuthenticationWithSuccess(false);
                        callbackWithSuccessFlag(false);
                    });
                }
            },

            restoreSessionIfPossible: function(callbackWithSuccessFlag) {
                setTimeout(function () {
                    BaasBox.fetchCurrentUser().done(function (res) {
                        _user = res.data;
                        console.log("Fetched current user successfully", _user);
                        self.finishAuthenticationWithSuccess(true);
                        callbackWithSuccessFlag(true);

                    }).fail(function (err) {
                        console.log("Failed fetching current user.",err);
                        console.log("Will fininsh with failed authentication.");
                        self.finishAuthenticationWithSuccess(false);
                        callbackWithSuccessFlag(false);

                    });
                },200);
            },

            logOut: function(callbackWithSuccessFlag) {

                BaasBox.logout().done(function () {
                    callbackWithSuccessFlag(true);
                    _user = null;
                    _authenticated = false;
                    $rootScope.$broadcast(kUserAccountAuthenticationStateChanged,null);
                }).fail(function (err) {
                    _user = null;
                    _authenticated = false;
                    callbackWithSuccessFlag(false);
                    $rootScope.$broadcast(kUserAccountAuthenticationStateChanged,null);
                });

            },

            authenticated: function() {
                return _authenticated;
            },

            user: function() {
                if (!_user)
                    _user = BaasBox.getCurrentUser();
                return _user;
            },

            username: function() {
                return self.user().user;
            },

            language: function() {
                return self.user().customData.language;
            },

            followers: function() {
                return _followers || [];
            },

            following: function() {
                return _following || [];
            },

            follow: function(username, callbackWithSuccessFlag) {
                //var self = this;
                BaasBox.followUser(username).done(function () {
                    self.fetchFollowing(callbackWithSuccessFlag);
                }).fail(function () {
                    callbackWithSuccessFlag(false);
                });
            },

            unfollow: function(username, callbackWithSuccessFlag) {
                //var self = this;
                BaasBox.unfollowUser(username).done(function () {
                    self.fetchFollowing(callbackWithSuccessFlag);
                }).fail(function () {
                    callbackWithSuccessFlag(false);
                });
            },

            refresh: function(){
                $rootScope.$broadcast(kUserAccountAuthenticationStateChanged,null);
            },

            registrationDate: function() {
                return "registrationDateDummy";
            },

            /* Avatar */
            avatar: function () {
                return valueForKeyPath(_user,'customData.avatar');
            },

            setAvatar: function (avatarName) {
                self.saveProperties({avatar:avatarName}, function () {
                    console.log("Did store changed avatar name:", avatarName);
                    $rootScope.$broadcast(kUserAccountAvatarDidChange);
                }, function (err) {
                    console.error("Changing avatar failed: ", err);
                })
            },

            /* Points */

            // get a Number of points and subtracted this
            spendPoints: function(points) {
                self.addPoints(-points);
            },

            // get a Number of points and add this
            addPoints: function (points) {

                var pointsBeforeAdding = _user.customData.points;
                var newPoints = pointsBeforeAdding + points;

                var maxPointsIncrementDuration = 3000;
                var duration = points * 100;
                if (duration > maxPointsIncrementDuration) duration = maxPointsIncrementDuration;

                var stepDuration = duration / points;
                var temporaryUserPoints = pointsBeforeAdding;
                var stepFrame = function () {

                    temporaryUserPoints++;
                    $rootScope.$broadcast(kUserAccountPointsAreChanging,temporaryUserPoints);
                    // Since we've already stored the new points value in the back-end,
                    // which is higher, than the animated increasing temporary user points value
                    // we have to send out a temporary value, which is lower than the actual
                    // current user points value.

                    if (temporaryUserPoints < newPoints) {
                        setTimeout(function () {
                            requestAnimationFrame(stepFrame);
                        }, stepDuration);
                    } else {
                        $rootScope.$broadcast(kUserAccountPointsDidChange, newPoints);
                    }
                };

                if (points>0) {
                    requestAnimationFrame(stepFrame);
                } else {
                    $rootScope.$broadcast(kUserAccountPointsAreChanging, newPoints);
                    $rootScope.$broadcast(kUserAccountPointsDidChange, newPoints);
                }
                if (_user) {
                    // Save the new points as a history sample
                    BaasBox.save( preparedForSaving({
                        points: self.points(),
                        timestamp: new Date()
                    }),kCollectionPointsOverTime).fail(function () {
                        console.log("Could not store pointsOverTime sample");
                    });

                    return this.saveProperties({points: newPoints}, function () {

                    });
                }
            },

            // GET POINTS
            points: function () {
                return _user.customData.points;
            },

            worlds: function () {
                return _user.customData.worlds;
            },

            save: function(successCallback, failCallback) {
                return BaasBox.updateUserProfile(_user.customData)
                              .done(successCallback)
                              .fail(failCallback);
            },

            /* Saves one key-value in the customData storage on the server. */
            saveProperties: function(keyValues, successCallback, failCallback) {
                console.log('SAVING', keyValues);
                _user.customData = angular.extend(_user.customData, keyValues);
                return BaasBox.updateUserProfile(_user.customData)
                              .done(successCallback)
                              .fail(failCallback);
            },

            property: function(name) {
                if (!_user) return null;
                return valueForKeyPath(_user,'customData.'+name);
            },

            /* Levels */

            // SET LEVEL ID AS COMPLETED
            setLevelWithIndexCompletedInWorldWithId: function(levelIdx, worldId) {

                // Store it temporarily at least, if the user has not authed
                if (typeof _user.customData.progress[worldId]==='undefined') {
                    _user.customData.progress[worldId] = [levelIdx];
                } else {
                    if (_user.customData.progress[worldId].indexOf(levelIdx)==-1)
                        _user.customData.progress[worldId].push(levelIdx);
                }

                // Try saving it remotely
                this.saveProperties(_user.customData, function () {
                    console.log("Completed levels stored successfuly.");
                },function (err) {
                    console.error("Storing completed levels remotely failed.", err);
                });

                $rootScope.$broadcast(kUserAccountCompletedLevelsChanged);
                console.log("Completed the level #",levelIdx,"in world ",worldId);
            },

            // GET LEVEL ID COMPLETE? TRUE/ FALSE
            isLevelWithIndexCompletedInWorldWithId: function(levelIdx, worldId) {
                var completed = false;
                var progress = this.completedLevelIndexesInWorldWithId(worldId);

                $.each( progress,function (k,val) {
                    if (val==levelIdx) {
                        completed = true;
                        return;
                    }
                });

                return completed;
            },

            // GET AN ARRAY WITH THE COMPLETED LEVELS
            completedLevelIndexesInWorldWithId: function(worldId) {
                var progress = valueForKeyPath(_user, 'customData.progress.'+worldId) || [];
                return progress;
            }

        });

        return self;
    }
});
