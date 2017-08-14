kGameWorldStoreWillLoadConfiguration = "kGameWorldStoreWillLoadConfiguration";
kGameWorldStoreDidLoadConfiguration = "kGameWorldStoreDidLoadConfiguration";
kGameWorldStoreDidFailLoadingConfiguration = "kGameWorldStoreDidFailLoadingConfiguration";
kGameWorldStoreSelectedWorldIndexDidChange = "kGameWorldStoreSelectedWorldIndexDidChange";

var kDefaultRemoteGameConfigurationFileName = 'gameConfiguration';
var kDefaultLocalFallbackGameConfigurationFileName = 'localGameConfiguration';

/** The GameWorldStore is a service that provides access to the gameConfiguration.js file. */
angular.module('arg.services').provider('GameWorldStore', function() {
    var that = this;

    var _game = null;
    var _selectedWorldIdx = 0;
    var _worlds = {};
    var _usedFilename = null;

    // Define the public API
    this.$get = function($http,$q,$rootScope, UserAccount) { return {


        loaded: function(){
            return _game!=null;
        },

        clear: function() {
            _game = null;
            _selectedWorldIdx = 0;
            _worlds = {};
            _usedFilename = null;
        },

        // Loads the game configuration, but returns a promise immediately
        // Parses the game configuration, which means, making sure that optional parameters
        // are set, etc.
        loadConfiguration: function(optionalFileName){
            $rootScope.$broadcast(kGameWorldStoreWillLoadConfiguration,nil);

            var self = this;

            return $q(function(resolve,reject) {
                if (_game && _usedFilename==optionalFileName) {

                    angular.forEach(_game.worlds, function (world) {
                        _worlds[world.id] = world;
                    });

                	console.log("Did already load levels, will return stored game level.");
                    $rootScope.$broadcast(kGameWorldStoreDidLoadConfiguration,nil);
                    resolve({success:true,game:_game});
                }

                function handleGameConfiguration(gameConfig) {
                    if (gameConfig) {
                        _game = gameConfig;
                        angular.forEach(_game.worlds, function (world) {

                            angular.forEach(world.levels,function (level) {

                                // Randomize subranges of level rounds array if specified
                                var randomizesRangesOfRounds = valueForKeyPath(level,'randomizesRangesOfRounds');
                                if (randomizesRangesOfRounds!==undefined) {
                                    try {
                                        angular.forEach(randomizesRangesOfRounds, function (range) {
                                            level.rounds = level.rounds.randomizedSubrange(range[0], range[1]);
                                        });
                                    } catch(e) {
                                        console.warn("Warning: illegal range for randomized game round sequence:",range);
                                    }
                                }
                                console.log('level ROUNDSSSS', level.rounds)

                                //// optional 'completable' flag
                                // Use 'true' as default value, if the value is not set
                                level.completable = valueForKeyPath(level, 'completable', true);

                                // optional 'enabled' flag
                                // Use 'true' as default value, if the value is not set
                                level.enabled = valueForKeyPath(level, 'enabled', true);

                                // optional 'repeatable' flag
                                // Use 'true' as default value, if the value is not set
                                level.repeatable = valueForKeyPath(level, 'repeatable', true);
                            });

                            // optional 'enabled' flag
                            // Use 'true' as default value, if the value is not set
                            world.enabled = valueForKeyPath(world, 'enabled', true);;

                            // optional 'repeatable' flag
                            // Use 'true' as default value, if the value is not set
                            world.repeatable = valueForKeyPath(world, 'repeatable', true);

                            _worlds[world.id] = world;
                        });
                        $rootScope.$broadcast(kGameWorldStoreDidLoadConfiguration,nil);
                        resolve({success: true, game: gameConfig}); // Resolve the promise
                    } else {
                        $rootScope.$broadcast(kGameWorldStoreDidFailLoadingConfiguration);
                        reject({success: false, game:null});
                    }
                }

                // Try to download the configuration file from the back-end.
                // If this fails, try to load the locally stored game configuration as a fallback.

                var filename = optionalFileName ? optionalFileName : kDefaultRemoteGameConfigurationFileName;
                var remoteGameConfigurationURL = kBaasBoxURL+ '/asset/'+filename;
                $http.get(remoteGameConfigurationURL).success(function(res){
                    console.log("Did download remote gameConfiguration", filename);
                    try {
                        _usedFilename = filename;
                        var gameConfiguration = res.data;
                        handleGameConfiguration(gameConfiguration);
                    } catch(e) {
                        handleGameConfiguration(null);
                        console.error(e.message);
                    }
                }).error(function(){
                    $http.get('GameContent/'+kDefaultLocalFallbackGameConfigurationFileName+'.json').success(function(res){
                        console.info("Did load local fallback gameConfiguration.");
                        _usedFilename = kDefaultLocalFallbackGameConfigurationFileName;
                        try { handleGameConfiguration(res); } catch(e) {
                            handleGameConfiguration(null);
                            console.error(e.message);
                        }
                    }).error(function(){
                        handleGameConfiguration(null);
                    });
                });

            });
        },


		/** Worlds **/

        // Sets the selection for the current world of the game
        setSelectedWorldIndex: function(idx) {
            if (idx >= _game.worlds.length) {
                throw("Index "+idx+" exceeds number of available worlds in game.");
            }
            _selectedWorldIdx = idx;
            $rootScope.$broadcast(kGameWorldStoreSelectedWorldIndexDidChange, idx);
        },

        numberOfWorlds: function() {
            return _game.worlds.length;
        },

        allWorlds: function() {
            return _game.worlds;
        },

        selectedWorldIndex: function(){
        	return _selectedWorldIdx;
        },

        worldByIndex: function(idx){
        	return _game.worlds[idx];
        },

        worldById: function(worldId) {
            return _worlds[worldId];
        },

        selectedWorld: function() {
            return _game.worlds[_selectedWorldIdx];
        },


		/** Levels **/

        // Return the number of levels in the currently selected world
        numberOfLevels: function(){
            return _game.worlds[_selectedWorldIdx].levels.length;
        },

        allLevels: function(){
            return _game.worlds[_selectedWorldIdx].levels;
        },

        getLevel: function(idx){
        	return _game.worlds[_selectedWorldIdx].levels[idx];
        },

        unlockedLevelsInWorldWithId: function (worldId) {
            var progress = UserAccount.completedLevelIndexesInWorldWithId(worldId);
            var lvls = valueForKeyPath(this.worldById(worldId),'levels');

            if (lvls===undefined) return [];

            var unlockedLevels = [];
            angular.forEach(lvls, function (level,idx) {
                var isEnabled = valueForKeyPath(level,'enabled');
                if (isEnabled==undefined)
                    isEnabled = true;

                if (level.requiresCompletion===undefined && isEnabled) {
                    // If there's no specification, make it unlocked automatically
                    unlockedLevels.push(idx);
                } else {
                    // If the level has an array of level indexes that need to be completed,
                    // check if all these levels are completed
                    var allRequiredLevelsCompleted = true;
                    angular.forEach(level.requiresCompletion, function (requiredIdx) {
                        allRequiredLevelsCompleted = allRequiredLevelsCompleted && UserAccount.isLevelWithIndexCompletedInWorldWithId(requiredIdx, worldId);
                    });
                    if (allRequiredLevelsCompleted && isEnabled)
                        unlockedLevels.push(idx);
                }
            });
            return unlockedLevels;
        }


        /** Rounds **/

    };
    };
});
