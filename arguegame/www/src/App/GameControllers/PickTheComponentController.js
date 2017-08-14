angular.module('arg.game.roundcontrollers').controller('PickTheComponentController', function($scope,$ionicPopup,ArgumentStore,$ionicSlideBoxDelegate,$ionicActionSheet,EntityLinker){

    var compTypes = ['claim','premise'];
    var compNames = {
        'claim': 'claim',
        'premise': 'reason'
    };

    var chosenIndexForComponentTypeBasedOnDataDemand = function() {
        return Math.floor(Math.random()*compTypes.length);
    }

    var idx = chosenIndexForComponentTypeBasedOnDataDemand();

    $scope.gameData = {
        componentType: compTypes[idx],
        componentName: compNames[compTypes[idx]],
        topic: null,
        argument: null,
        highlightedCorrectlyIndexes: [],
        highlightedWronglyIndexes: [],
        loading: true
    };

    var _verifiedComponents = [];
    $scope.prepareData = function () {
        console.log("Pre-downloading data for round PickTheComponent");

        var givenDomainTitle = valueForKeyPath($scope.round,'parameters.domain');

        var download = null;
        if (givenDomainTitle) 
            download = ArgumentStore.argumentInDomainWithTitle({
                title: valueForKeyPath($scope.round,'parameters.domain'),
                valid: true,
                kraken: ['articles', 'votedType']}) 
        else download = ArgumentStore.randomArgument({
                valid: true,
                kraken: ['articles', 'votedType', 'topic', 'domain']
            })

        return download.then(function (arg) {

            for(var idx in arg.components) {
                arg.components[idx].$index  = idx;
                arg.components[idx].trueType= (arg.isEditorial) ? arg.components[idx].type
                                                                : reliablyHighestVotedKeyAndValue(arg.components[idx]['#votedType']).key;
                if (arg.components[idx].trueType!=null)
                    _verifiedComponents.push(arg.components[idx]);
            }

            $scope.gameData.argument = arg;
            $scope.gameData.topic = valueForKeyPath( arg, '&refersTo[0]' );
            $scope.gameData.article = valueForKeyPath( arg, '&refersTo[0].&references[0]' );

            console.log("Topic: ", $scope.gameData.topic);
            console.log("Article: ", $scope.gameData.article);
            console.log("Downloaded random argument: ", arg);

            $scope.gameData.loading = false;

            $scope.updateScrollView();

        },function (e) {
            console.error("Downloading the game data failed!",e);
            alert("Oh no!",
                  "Downloading the game data failed!",
                  "Dismiss");
        });
    }

    // Stores the components ({type:,body:}) currently selected by the user
    var _selection = [];


    // First: Let's specify when the user's input is valid
    // The input is valid if the user has chosen anything.
    $scope.inputIsValid = function() {
        return _selection.length > 0;
    }

    // Can we reliably say that the user's input is valid or invalid?
    $scope.inputCorrectnessVerifiable = function() {
        // If we could verify the type of EACH component, only then we can verify the input
        if ($scope.gameData.componentType=='claim') {
            // In this case, we can verify the input, if we have one component with the verified type 'claim'
            var verifiedClaimFound = false;
            angular.forEach(_verifiedComponents, function(verifiedComponent) {
                if (verifiedComponent.trueType=='claim')
                    verifiedClaimFound = true;
            });
            return verifiedClaimFound;

        } else {
            // Otherwise we actually need to know the true type of every single component
            return _verifiedComponents.length == $scope.gameData.argument.components.length;
        }
    }

    // So if we can verify the input, how much points is the input worth?
    $scope.pointsForVerifiableInput = function() {
        // In this case we really think we know the true type of each of the components in the argument

        var correctSelection = true;

        angular.forEach($scope.gameData.argument.components, function(component,idx) {

            // First, check if the user has selected this component
            var userHasSelectedThis = false;
            angular.forEach(_selection, function(selectedComponent, idx) {
                if (selectedComponent.$index == component.$index) userHasSelectedThis = true;
            });

            if (component.type==$scope.gameData.componentType) {
                // The user must have selected this component,
                // if this component's type is what we asked to select
                correctSelection = correctSelection && userHasSelectedThis;
            } else {
                // The user may not have selected this component,
                // if this component'stype is not what we asked to select
                correctSelection = correctSelection && !userHasSelectedThis;
            }

        });

        return correctSelection ? 30 : 0;
    }

    // Otherwise, if we cannot verify the input, what should the user be rewarded with?
    $scope.pointsForNonVerifiableInput = function() {
        return 10;
    }

    var _revealed = false;
    $scope.revealSolution = function() {
        if (_revealed)
            return;
        _revealed = true;

        var highlightedCorrectlyIndexes = [];
        var highlightedWronglyIndexes = [];

        angular.forEach($scope.gameData.argument.components, function (component,idx) {
            if (component.type==$scope.gameData.componentType)
                highlightedCorrectlyIndexes.push(idx);
        });

        angular.forEach(_selection, function (selectedComponent,idx) {
            if (selectedComponent.type!=$scope.gameData.componentType) {
                highlightedWronglyIndexes.push( parseInt(selectedComponent.$index));
            }
        });

        angular.forEach(_clickedElements, function (element) {
            element.removeClass('arg-component-highlighted');
        });

        $scope.gameData.highlightedCorrectlyIndexes = highlightedCorrectlyIndexes;
        $scope.gameData.highlightedWronglyIndexes = highlightedWronglyIndexes;

    }

    $scope.submitData = function() {
        // Save votings
        if (!$scope.downrateInput) {
            angular.forEach(_selection, function (selectedComponent) {
                saveVotingWithKeyPathAndValueForEntity(EntityLinker, "components." + selectedComponent.$index + ".type",
                                                                     $scope.gameData.componentType,
                                                                     $scope.gameData.argument);
            });
        }
    }

    $scope.costsForSkip = function(){
        return 15;
    }

    $scope.countdownDuration = function() {
        return 0;
    }

    $scope.delayBeforeGoingOn = function() {
        return 1500;
    }

    $scope.output = function() {
        return null;
    }

    $scope.invalidInputMessage = function(){
        return "You need to tap one of the argument components before going on!";
    }

    var _clickedElements = [];
    $scope.clickComponent = function(idx,component,event){
        var element = $(event.target);
        _clickedElements.push(element);

        var component = $scope.gameData.argument.components[idx];
        if ($scope.gameData.componentType=='premise') {
            // Premise: Allow multiple selection (reason(s))
            if (element.hasClass('arg-component-highlighted')) {
                var removedIdx = -1;
                angular.forEach(_selection, function(comp,k){
                    if (comp.type==component.type && comp.body==component.body)
                        removedIdx = k;
                });
                if (removedIdx!=-1)
                    _selection.splice(removedIdx,1);
            } else {
                var foundIdx = -1;
                angular.forEach(_selection, function(comp,k){
                    if (comp.type==component.type && comp.body==component.body)
                        foundIdx = k;
                });
                if (foundIdx==-1)
                    _selection.push(component);
            }
            element.toggleClass('arg-component-highlighted');
        } else if ($scope.gameData.componentType=='claim'){
            // Claim: Allow selecting only one component at a time (claim)
            element.parents('arg-argument').find('.arg-component-highlighted').removeClass('arg-component-highlighted');
            element.addClass('arg-component-highlighted');
            _selection = [component];
        }
    }

    $scope.$parent.setRoundControllerScope($scope);
});
