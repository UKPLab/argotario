angular.module('arg.game.roundcontrollers').controller('SessionSelectController', function($scope,$rootScope,$translate,$ionicPopup,$ionicSlideBoxDelegate,$ionicActionSheet,$ionicScrollDelegate,$localStorage,$interval,SessionStore,UserAccount,ArgumentStore,FallacyStore,EntityLinker) {

    var _selection = null;
    var kMaxSessions = 4;
    var preloading = true;

    $scope.gameData = {
        sessions: [],
        activeSessions: [],
        gameoverSessions: [],
        sessionPointer: null,
        pointingActive : true,
        username: null
    };

    $scope.continuesImmediately = function() {
        return false;
    };

    //check if user can continue to another round based on the input provided
    //the value checked here is kmaxSessions, which is the maximum number of active sessions allowed.
    $scope.inputIsValid = function() {
        console.log('selection is', _selection);
        console.log('active sessions', $scope.nrActiveSessions());
        if (!_selection && $scope.nrActiveSessions() >= kMaxSessions) return false
        return true;
    };

    $scope.inputCorrectnessVerifiable = function() {
        return false;
    };

    $scope.delayBeforeGoingOn = function(){
        return 0;
    };

    $scope.invalidInputMessage = function() {
        return $translate.instant("MAX_NUMBER_OF_GAMES_REACHED");
    };

    $scope.nrActiveSessions = function() {
        var counter = 0;
        for (var i=0; i<$scope.gameData.sessions.length; i++) {
            var session = $scope.gameData.sessions[i];
            if (session.ticker != null) counter ++;
        }
        return counter;
    };

    $scope.iWin = function(session) {
        return (session.out_winner == UserAccount.username());
    };
    $scope.draw = function(session) {
        return (session.out_winner instanceof Array)
    };
    $scope.iLose = function(session) {
        return !$scope.draw(session) && (session.out_winner != UserAccount.username());
    };
    $scope.iGotRewarded = function(session) {
        return (session.out_rewarded && (session.out_rewarded.indexOf(UserAccount.username()) != -1));
    };

    $scope.isSkippable = function() {
		return false;
    };

    $scope.showEndModal = function() {
        return false;
    };

    $scope.showCheckButton = function () {
		return false;
    };

    $scope.output = function() {
        return _selection;
    };

    $scope.pointsForNonVerifiableInput = function() {
        return 0;
    };

    //sets the reference of the shown list to the active-list.
    //i.e. show the active list
    $scope.pointActive = function() {
        $scope.unselectSession();
        $scope.gameData.sessionPointer = $scope.gameData.activeSessions;
        $scope.gameData.pointingActive = true;
        $scope.updateScrollView();
    };

    //sets the reference of the shown list to the gameover-list.
    //i.e. show the gameover-list
    $scope.pointGameover = function() {
        $scope.unselectSession();
        $scope.gameData.sessionPointer = $scope.gameData.gameoverSessions;
        $scope.gameData.pointingActive = false;
        $scope.updateScrollView();
    };

    $scope.preloadData = function () {
        preloading = true;
        $scope.gameData.username = UserAccount.username();

        console.log("Pre-downloading data for round PlayerVsPlayerSelect");

        return SessionStore.sessionSelect({}).then(function (sessions) {
            console.log("Downloaded session-list", sessions);
            $scope.gameData.sessions = sessions || [];
            $scope.createSessionArrays(null);
            $scope.gameData.sessionPointer = $scope.gameData.activeSessions;
            preloading = false;
            $scope.prepareDidFinish();
        },function (err) {
            alert("Loading the session-list failed.");
            console.log(err);
            preloading = false;
        });
    };

    //creates an interval calling the background-function periodically
    $scope.backgroundTask = function(identifier) {
        var date = $scope.getMaxTimestamp();

        return $interval(function() {
            console.log('checking for updated session!!!!!!!!!!!11', identifier);
            var params = [];
            var session = null;
            SessionStore.checkForUpdates({
                    timestamp : date
            }).then(function (sessions) {
                if (sessions && sessions.length > 0) {
                    console.log('got updated sessions', sessions)
                    $rootScope.$broadcast(kRoundControllerBackgroundEvent, identifier);
                }
            });
        }, 15000)
    };

    $scope.imActive = function(session) {
        var username = UserAccount.username();
        return (session.users[session.active] == username);
    };

    //get the timestamp of the last updated session.
    //if any session of this user has a newer timestamp, an update took place.
    $scope.getMaxTimestamp = function() {
        var max_timestamp = '';
        for (var i=0; i<$scope.gameData.sessions.length; i++) {
            if ($scope.gameData.sessions[i]._timestamp > max_timestamp)
                max_timestamp = $scope.gameData.sessions[i]._timestamp;
        }
        return max_timestamp;
    };

    //a background-function checking for updates of all sessions in both lists (uses the latest-timestamp method).
    //checks if a session changed the active player, turned inactive or is finally judged because of a mace-decision.
    $scope.checkForUpdates = function() {
        var date = $scope.getMaxTimestamp();
        return $interval(function() {
            console.log('checking for updated session!!!!!!!!!!!11 in round itself');
            if ($scope.gameData.sessions) {

                var params = [];
                SessionStore.checkForUpdates({
                        timestamp: date
                }).then(function (updates) {
                if (updates && updates.length > 0) {
                    console.log('got updated sessions', updates)
                    for (var j=0; j<updates.length; j++) {
                        var update = updates[j];
                        $scope.updateSession(update);
                    }
                }
                });
            }
        }, 15000)
    };

    //shifts a session from the active list to the inactive one.
    //This happens if a session-object was updated in place
    $scope.sessionActiveToGameover = function(session) {
        for (var j=0; j<$scope.gameData.activeSessions.length;j++) {
            if ($scope.gameData.activeSessions[j]._id == session._id) {
                $scope.gameData.activeSessions.splice(j, 1);
                session.moved = true;
                $scope.gameData.gameoverSessions.push(session);
                $scope.pointGameover();
                return true;
            }
        }
        return false;
    };

    //gets called by the checkforupdates-background-function when a session-object has actually changed.
    //Does then check if a shift into the gameOver-list is necessary, if the session has finished meanwhile.
    $scope.updateSession = function(newSession) {
        if ($scope.gameData.sessions) {
            for (var i=0; i<$scope.gameData.sessions.length; i++) {
                if ($scope.gameData.sessions[i]._id == newSession._id) {
                    newSession.changed = true;
                    if (($scope.gameData.sessions[i].ticker != null) && (newSession.ticker == null))
                        $scope.sessionActiveToGameover(newSession);
                    angular.copy(newSession, $scope.gameData.sessions[i])
                    break;
                }
            }
        }
    };

    //instantiates two lists, one stores active sessions and the other one finished sessions.
    $scope.createSessionArrays = function(passed) {
        var session = null;
        $scope.gameData.gameoverSessions = []
        $scope.gameData.activeSessions = []

        insert = true;
        point_active = true;
        for (var i=0; i<$scope.gameData.sessions.length; i++) {
            session = $scope.gameData.sessions[i]
            if (passed != null && (session._id == passed._id)) {
                insert = false
                if (session.ticker == null)
                    point_active = false;
            }
            if (session.ticker == null) $scope.gameData.gameoverSessions.push(session);
            else $scope.gameData.activeSessions.push(session);
        }
        if (passed != null && insert) {
            $scope.gameData.sessions.push(passed);
            $scope.gameData.activeSessions.push(passed);
        }

        return point_active;
    };

    $scope.roundWillStart = function() {
        console.log('all sessions', $scope.gameData.sessions)
        point_active = $scope.createSessionArrays($scope.previousOutput);
        point_active ? $scope.pointActive() : $scope.pointGameover();
        if (!preloading)
            $scope.prepareDidFinish();
    };

    $scope.roundDidStart = function() {
        if ($scope.bgtask)
            $interval.cancel($scope.bgtask);
        $scope.bgtask = $scope.checkForUpdates();
    };

    $scope.roundWillEnd = function() {
        $interval.cancel($scope.bgtask);
    };

    //adds the createButton to the bottom of the view
    $scope.setFooter = function() {
        return 'GameContent/Rounds/SessionSelect/CreateButton';
    };

    //gets called when a user taps a session from one of both lists
    $scope.selectSession = function(session) {
        console.log('selected session', session);
        //unset previous selection
        $scope.highlightCreate = false;
        if (_selection) _selection.selected = null;
        _selection=session;
        if (_selection)
            _selection.selected = true;
        $scope.clickToggle($scope, null);
    };

    //called when the user taps the createGame-button instead of an existing session
    $scope.tapCreateGame = function(){
        $scope.selectSession(null);
        $scope.highlightCreate = true;
        console.log('AIGHT I CLICKED TAPCREATEGAME');
    };

    //removes the selection of a session
    $scope.unselectSession = function() {
        if (_selection) {
            _selection.selected = null;
            _selection.animation = null;
            _selection = null;
        }
    };

    $scope.$parent.setRoundControllerScope($scope);
});
