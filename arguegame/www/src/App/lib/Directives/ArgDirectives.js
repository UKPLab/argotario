angular.module('arg.directives')

.directive('argArgument', function($interpolate){
    return {
        restrict: 'E',
        transclude: false,
        scope: {
            model: '=', /* array of 'components', a 'stance'=[pro, contra, neutral] maybe a fallacy*/
            language: '=',
            showOnly: '=?',
            onComponentTap: '&',
            onArgumentTap: '&',
            highlightedWrongly: '=?',
            highlightedCorrectly: '=?',
        },
        link: function(scope, element, attrs) {
            if (!('highlighted-wrongly' in attrs))
                scope.highlightedWrongly = [];
            if (!('highlighted-correctly' in attrs))
                scope.highlightedCorrectly = [];
            if (!('showOnly' in attrs))
                scope.showOnly = -1;

            if (element.height()<55) {
                element.addClass('arg-small-height');
            }

            scope.$watch('model.stance', function () {
                element.removeClass('arg-pro');
                element.removeClass('arg-contra');
                if (valueForKeyPath(scope, 'model.stance'))
                    element.addClass('arg-'+ scope.model.stance);
            });

            scope.$watch('model.animation', function () {
                element.removeClass('pulse');
                element.removeClass('animated');
                element.removeClass('infinite');
                element.removeClass('pause');
                if (valueForKeyPath(scope, 'model.animation')) {
                    element.addClass('pulse');
                    element.addClass('animated');
                    element.addClass('infinite');
                    element.addClass('pause');
                }
            });

            scope.element = element;
        },
        controller: function($scope,$timeout) {

            $scope.classForComponentIndex = function (idx) {
                if ($scope.showOnly==-1) {
                    return "";
                } else {
                    return parseInt(idx)==parseInt($scope.showOnly) ? 'arg-visible-component' : 'arg-nonvisible-component';
                }
            }
        },
        template: ''
        + '<p ng-click="onArgumentTap({id:model._id,event:$event})">'
            + '<span ng-if="model.fallacy" class="arg-argument-fallacy-description"><i class="icon {{model.fallacy.icon}}"></i> {{model.fallacy.title[language]}}<br/></span>'
            + '<span ng-repeat="component in model.components" '
            + 'class="arg-argument-component arg-argument-component-{{component.type}} {{classForComponentIndex($index)}}" '
            + 'ng-click="onComponentTap({idx:$index,component:component,event:$event})" '
            + 'ng-class="{\'highlighted-correctly\':highlightedCorrectly.indexOf($index)!=-1,\'highlighted-wrongly\':highlightedWrongly.indexOf($index)!=-1}">'
            + '{{component.body}} '
            + '</span>'
        + '</p>'
    };
})

.directive('argArgumentGameFallacyPart', function($interpolate) {
    return {
        restrict: 'E',
        scope: {
            model: '=',
            language: '='
        },
        link: function (scope,element,attr) {
            scope.fallacy = scope.model.fallacyId;
        },
        template: function() {
            return '<span class="arg-argument-fallacy-description"><i class="icon {{fallacy.icon}}"></i> {{fallacy.title[language]}}</span>'
                 + '<arg-argument-points bad="!model.points.imAuthor" points="model.points.fallacy" class="arg-argument-points-fallacy" ng-if="model.points.fallacy"></arg-argument-points>'

        + '<arg-argument-points bad="!model.points.imAuthor" points="model.points.argument" class="arg-argument-points-argument" ng-if="model.points.argument"></arg-argument-points>'
    + '<p class="arg-argument-indicator" ng-if="model.indicator">'
        + '<i class="icon {{model.indicator.icon}}" /> (marked as: {{model.indicator.title[language]}})'
        + '<arg-argument-points bad="model.points.imAuthor" points="model.points.indicator" class="arg-argument-points-indicator" ng-if="model.points.indicator"></arg-argument-points>'
        }
}
})

.directive('argRoundTitle', function () {
    return {
        restrict: 'E',
        link: function (scope, element, attrs) {
        }
    };
})


.directive('argAccountDisplay', function () {
    return {
        restrict: 'E',
        scope: {
            points: '=',
            secondaryPoints: '=',
            currency: '=',
            secondaryCurrency: '=',
            ranking: '='
        },
        link: function (scope, element, attrs) {
            scope.currency = scope.currency || "$";
            scope.secondaryCurrency = scope.secondaryCurrency || "A";
            scope.large = attrs.hasOwnProperty('large');
            if (scope.large)
                element.addClass('large');
        },
        template: function(scope,e,attrs) {
            return '<span ng-show="points != undefined"> <span style="font-family: Helvetica" class="arg-mini-coin">{{ currency }}</span><span ng-bind="points"></span></span><span ng-if="secondaryPoints != undefined">{{ secondaryCurrency }}<span ng-bind="secondaryPoints"></span></span><span ng-if="ranking!=undefined && ranking>0">{{ ranking }}.</span>';
        }
    };
})

.directive('argLevelProgressIndicator',function () {
    return {
        restrict: 'E',
        scope: {
            numberOfCompletedRounds: '=',
            numberOfRounds: '=',
            currentPoints: '=',
            currency: '=',
            currentSecondaryPoints: '=?',
            secondaryCurrency: '=?'
        },
        link: function (scope,element) {
            scope.element = element;
        },
        controller: function($scope,$timeout) {
            function update() {
                $timeout(function () {
                    var width = $scope.element.width();
                    $scope.element.css({marginLeft:'-'+width/2+'px'});
                });

                $scope.numberOfCompletedRoundsRange = [];
                $scope.numberOfNonCompletedRoundsRange = [];
                for(var i=0;i<$scope.numberOfRounds;i++) {
                    if (i<$scope.numberOfCompletedRounds) $scope.numberOfCompletedRoundsRange.push(i);
                    else $scope.numberOfNonCompletedRoundsRange.push(i);
                }
            }
            update();
            $scope.$watch('numberOfRounds',update);
            $scope.$watch('numberOfCompletedRounds',update);
        },
        template: function(scope) {
            var str = '<div class="arg-level-progress-wrapper">'
                        +'<div class="arg-progress-bar">'
                        +'<span class="filled" ng-repeat="n in numberOfCompletedRoundsRange" ng-class="{\'flashing\':$index==numberOfCompletedRounds-1}"></span>'
                        +'<span class="" ng-repeat="n in numberOfNonCompletedRoundsRange"></span>'
                        +'</div>'
                        +'<arg-account-display points="currentPoints" currency="currency" secondary-points="secondaryPoints" secondary-currency="secondaryCurrency" />'
                        +'</div>';
            return str;
        }
    };
})

.directive('argStackOfCoins', function () {
    return {
        restrict: 'E',
        scope: {
            coins: '@'
        },
        template: function(scope) {
            var str = ''
            +'<span class="arg-coin" ng-repeat="n in [coins] | makeRange" ng-class="{misplaced:($index % 2 == 0)}" style="top: {{-$index*8}}px; -webkit-animation-delay: {{$index*100}}ms"></span>';
            return str;
        }
    };
})

/**
* <arg-countdown defer="[ms]"
*             duration="[ms]"
*            on-finish="[js-callback]"
*           auto-start="[ifSet]"
*               height=[int]
*           controller="[someObject]"
*          blood-class="[css-class-name]"></arg-countdown>
*/
.directive('argCountdown', function(){
    return {
        restrict: 'E',
        scope: {
            onFinish: '&',
            controller: '='
        },
        template: '<div class="arg-countdown-blood"></div>',
        link: function(scope, element, attrs){
            var defer = parseInt(attrs['defer'] || 0);
            var duration = parseInt(attrs['duration'] || 2000);
            var autoStart = attrs['autoStart']!==undefined;
            var height = parseInt(attrs['height'] || 2);
            var color = attrs['color'] || 'red';
            var backgroundColor = attrs['backgroundColor'] || 'gray';

            element.css({
                height: height+'px',
                backgroundColor: backgroundColor
            });

            var transition = 'width '+duration+'ms linear '+defer+'ms';
            var noTransition = 'none';

            var bloodElem = element.find('.arg-countdown-blood');
            bloodElem.css({
                height: height+'px',
                backgroundColor: color,
                width: '100%'
            });

            var timeoutSet, timeoutFlash, timeoutCallback;

            scope.controller.start = function() {
                scope.controller.reset();

                bloodElem.addClass('flash');
                setTimeout(function () {
                    bloodElem.removeClass('flash');
                }, defer);

                bloodElem.css('-webkit-transition',transition).width(0);
                console.log(0);

                timeoutFlash = setTimeout(function () {
                    bloodElem.addClass('flash');
                }, defer+duration*0.66); // Start flashing in the last 33%

                if (scope.onFinish) {
                    timeoutCallback = setTimeout(function () {
                        scope.onFinish();
                    }, defer + duration);
                }
            }

            scope.controller.reset = function() {
                console.log(1);
                clearTimeout(timeoutSet);
                clearTimeout(timeoutFlash);
                clearTimeout(timeoutCallback);
                bloodElem.css('-webkit-transition',noTransition).width('100%');
                bloodElem.width();
            }

            if (autoStart) {
                scope.controller.start();
            }
        }
    };
})

.directive('ngDynamicController', ['$compile', '$parse',function($compile, $parse) {
    return {
        restrict: 'A',
        terminal: true,
        priority: 100000,
        link: function(scope, elem) {
            var name = $parse(elem.attr('ng-dynamic-controller'))(scope);
            elem.removeAttr('ng-dynamic-controller');
            elem.attr('ng-controller', name);
            $compile(elem)(scope);
        }
    }
}])

.directive('argArticleLink', function () {
    return {
        restrict: 'E',
        scope: {
            model: '=',
            onTap: '@'
        },
        link: function (scope,element,attr) {
            scope.element = element;
        },
        controller: function ($scope) {
            $scope.$on('ExpandArticleTails',function () {
                console.log("Did expand article tail.");
                $scope.element.find('.white-tail').removeClass('hidden-tail');
            });
        },
        template:''
            +'<div class="arg-article-border-top"></div>'
            +'<a class="" href="javascript:;" ng-click="onTap({URL:model.permalink})">'
            +'    <arg-article-newspaper-name>The Argue Times</arg-article-newspaper-name>'
            +'    <arg-article-icon>{{ model.publisher.substr(0,1) }}</arg-article-icon>'
            +'    <arg-article-headline>{{ model.headline }}</arg-article-headline>'
            +'    <arg-article-publisher>On <span>{{ model.publisher }}</span></arg-article-publisher>'
            +'    <span class="hint">Tap here to read article</div>'
            +'</a>'

    }
})

.directive('argFallacy', function () {
    return {
        restrict: 'E',
        scope: {
            model: '='
        },
        link: function (scope,element,attr) {
            scope.language = scope.$parent.language || 'en'
        },
        template:''
        +'<div class="item item-icon-left">'
            +'<i class="icon {{model.icon}}"></i>'
            +'<h2 class="royal title">{{model.title[language]}}</h2>'
        +'</div>'
        +'<div class="item item-body">'
            +'<p>{{model.definition[language]}}</p>'
            +'<div ng-if="model.example">'
                +"<h3>{{'HERE_IS_AN_EXAMPLE'|translate}}:</h3>"
                +'<p>{{model.example[language]}}</p>'
            +'</div>'
        +'</div>'
    }
})

.directive('argSessionDescription', function () {
    return {
        restrict: 'E',
        scope: {
            topic: '=',
            domain: '=',
            fallacy: '=',
            stance: '=',
            language: '='
        },
        link: function (scope,element,attr) {
        },
        template:'<div class="card">'
        + '<div class="domain item item-divider item-icon-left"><i class="icon {{domain.icon}}"></i><h2>{{ domain.title[language] }}</h2></div>'
        + '<div ng-if="fallacy" class="fallacy item item-text-wrap"><i class="icon {{fallacy.icon}}"></i>{{ fallacy.title[language] }}</div>'
        + '<div ng-if="stance" class="item item-text-wrap arg-session-stance-{{stance}}">Your Position: {{stance}}</div>'
        + '<div class="topic item item-text-wrap">&ldquo;{{ topic.title }}&rdquo;</div>'
        + '</div>'
    }
})

.directive('argTopicDescription', function () {
    return {
        restrict: 'E',
        scope: {
            model: '=',
            icon: '='
        },
        link: function (scope,element,attr) {

        },
        template:'<div class="item item-text-wrap">&ldquo;{{ model.title }}&rdquo;</div>'
    }
})

.directive('argDomainDescription', function () {
    return {
        restrict: 'E',
        scope: {
            model: '=',
            language: '='
        },
        link: function (scope,element,attr) {

        },
        template:'<div class="item item-divider item-icon-left"><i class="icon {{model.icon}}"></i><h2>{{ model.title[language] }}</h2></div>'
    }
})

.directive('argArticleListItem', function () {
    return {
        restrict: 'E',
        scope: {
            model: '=',
            language: '=',
            onTapAttach: '&',
            onTapVisit: '&'
        },
        controller: function ($scope) {
            $scope.didTapAttach = function() {
                $scope.onTapAttach({article: $scope.model});
            }
            $scope.hasAttachButton = $scope.onTapAttach !== undefined;

        },
        template:'<ion-item class="item-avatar item-icon-right"><img src="{{ model.icon }}" style="background: #efefef; border-radius:7px;" width=45 height=45 />'
                +'<h2>{{ model.title[language] }}</h2>'
                +'</ion-item>'
    }
})

.directive('argAvatar', function() {
    return {
        restrict: "E",
        scope: {
            avatar: '='
        },
        template: '<img style="width: 100px; height: 100px; border-radius: 500px; background: white; border: 4px solid white; box-shadow: 0 0 0 1px #ccc;" src="Resources/Images/{{src}}@2x.png"></img>',
        link: function(scope,element,attrs) {
            var size = attrs['size'] || 100;
            size = parseInt(size);

            var img = element.children('img');

            element.css({
                display: 'block',
                width: (size+2*4)+'px',
                height: (size+2*4)+'px'

            }).children().css({
                width: size+'px',
                height: size+'px'
            });

            scope.src = scope.avatar || 'AvatarPlaceholder';

            scope.$watch('avatar', function () {
                scope.src = scope.avatar || 'AvatarPlaceholder';
            });
        }
    };
})

/**
 * This directive allows you to quickly include a static HTML snippet into your template.
 * You specify which component / snippet you'd like to include via the 'src' attribute,
 * which should contain the name of the snippet, e.g., StaticContentContinueButton.
 * This will then include the file 'gamecontent/static/Component.StaticContentContinueButton.html'.
 * If you set the optional attribute 'absolute' to 'true', the specified src attribute will not
 * be modified, so that you can include any file with an arbitrary location.
 *
 * <arg-component src="[name|fullpath]"
 *          (absolute="[true|false]")"></arg-component>
 *
 * Example:
 * <arg-component src="StaticContentContinueButton"></arg-component>
 * // Includes the file Component.StaticContentContinueButton.html
 */
.directive('argComponent', function($sce){
    return {
        restrict: 'E',
        /* No scope, in order to inherit the scope
        scope: {
            onFinish: '&'
        },*/
        replace: true,
        template: function(elem, attrs) {
        	var src = attrs['src'] || '';
        	var absolute = attrs['absolute'] || false;
        	if (!absolute) {
        		src = 'GameContent/StaticContent/Component.' + src + '.html';
        	}
        	return '<div class="arg-component" ng-include="'+"'"+src+"'"+'"></div>';
        }
    };
})

.directive('argProContraChoice', function(){
    return {
        restrict: 'E',
        scope: {
            selectedStance: '=',
            onProTap: '@',
            onContraTap: '@'
        },
        link: function (scope,element,attr) {

        },
        template:    '<ion-radio ng-model="selectedStance" ng-value="\'pro\'" ng-class="{\'arg-selected-stance\': selectedStance==\'pro\'}">'
                    +'<span class="arg-stance arg-pro">'
                    +'<i><img src="Resources/Images/Pro@2x.png" /></i>Pro'
                    +'</span>'
                    +'</ion-radio>'

                    +'<ion-radio ng-model="selectedStance" ng-value="\'contra\'" ng-class="{\'arg-selected-stance\': selectedStance==\'contra\'}">'
                    +'<span class="arg-stance arg-contra">'
                    +'<i><img src="Resources/Images/Contra@2x.png" /></i>Contra'
                    +'</span>'
                    +'</ion-radio>'
    }
})

.directive('argPlayerChoice', function($interpolate){
    return {
        restrict: 'E',
        scope: {
            model: '=',
            winner: '=',
            onOneTap: '@',
            onTwoTap: '@'
        },
        link: function (scope,element,attr) {
        },
        template: function() {
            return '<ion-radio ng-repeat="player in model" '
            + 'ng-model="$parent.winner" '
            + 'ng-value="\'{{player.id}}\'" >'
            + '<i class="icon ion-person"></i> {{player.user.user}}</ion-radio>'
        }
    }
})

.directive('argFallacyChoice', function($interpolate) {
    return {
        restrict: 'E',
        scope: {
            model: '=',
            selectedFallacy: '=',
            onProTap: '@',
            onContraTap: '@',
            highlightedWrongly: '=?',
            highlightedCorrectly: '=?'
        },
        link: function (scope,element,attr) {
            scope.language = scope.$parent.language || 'en';
            if (!('highlighted-wrongly' in attr))
                scope.highlightedWrongly = [];
            if (!('highlighted-correctly' in attr))
                scope.highlightedCorrectly = [];
        },
        template: function() {
            return '<ion-radio ng-repeat="fallacy in model" '
            + 'ng-model="$parent.selectedFallacy" '
            + 'ng-value="\'{{fallacy._id}}\'" '
            + 'ng-class="{'
            + '\'highlighted-correctly-fallacy\':highlightedCorrectly.indexOf($index)!=-1,'
            + '\'highlighted-wrongly-fallacy\':highlightedWrongly.indexOf($index)!=-1'
            + '}"><i class="icon {{fallacy.icon}}"></i> {{fallacy.title[language]}}</ion-radio>'
        }
    }
})


.directive('argFallacySolution', function($interpolate) {
    return {
        restrict: 'E',
        scope: {
            fallacy: '=',
            explanation: '='
        },
        link: function (scope,element,attr) {
            scope.language = scope.$parent.language || 'en'
        },
        template: function() {
            return '<div>'
            + '<p>{{"THE_CORRECT_ANSWER"|translate}}:<br> <i class="icon {{fallacy.icon}}"></i>'
            + '<strong>{{fallacy.title[language]}}</strong>'
            + '</p>'
            + '<p ng-if="explanation">{{fallacy.explanation[language]}}</p>'
            + '</div>'
        }
    }
})


.directive('argUserSublist', function(){
    return {
        restrict: 'E',
        scope: {
            users: '=',
            space: '=?',
            showRanking: '='
        },
        link: function(scope,element,attrs) {
            scope.title = attrs['title'] || null;
            scope.emptyLabel = attrs['emptyLabel'] || null;

            // I need the methods of the current scope within the scope of the directive, but still also need a new scope.
            // I couldn't find a better way than copying all methods of the parent scope into the isolated scope
            for(var m in scope.$parent) {
                if(typeof scope.$parent[m] == "function") {
                    scope[m] = scope.$parent[m];
                }
            }

            /*
            scope.isUser = scope.$parent.isUser;
            scope.isFollowing = scope.$parent.isFollowing;
            scope.openForeignProfile = scope.$parent.openForeignProfile;
            scope.clickFollowUser = scope.$parent.clickFollowUser;
            */
        },
        templateUrl: 'Views/ArgUserSublist.html'
    }
})

.directive('argWorld', ['$window',function($window){
    return {
        restrict: 'E',
        scope: {
            model: '=',
            completedLevels: '=',
            unlockedLevels: '=',
            completed: '=',
            onTapLevel: '&',
            onTapLockedLevel: '&',
            onTapDisabledLevel: '&'
        },
        link: function(scope,element,attrs) {
            function update() {
                var winWidth = $(document).width(),
                    winHeight= $(document).height();

                var worldWidth = winWidth - 50;
                if (worldWidth > 500) worldWidth = 500;
                if (worldWidth < 280) worldWidth = 280;
                element.css({
                    width: worldWidth+'px',
                    height: worldWidth+'px',
                    marginTop: -(worldWidth/2)+'px',
                    marginLeft: -(worldWidth/2)+'px'
                })

                element.find('.fog-of-war-container').css({
                    width: (worldWidth+40)+'px',
                    height: (worldWidth+40)+'px'
                });
            }
            update();

            scope.onTouch = function(level) {
                level.touched = true;
            }

            scope.onRelease = function(level) {
                level.touched = false;
            }

            scope._onTapLevel = function(params) {
                var level = params.level,
                    index = params.index;

                if (level.enabled==false) {
                    scope.onTapDisabledLevel(params);
                } else if (level.unlocked==false) {
                    scope.onTapLockedLevel(params);
                } else {
                    scope.onTapLevel(params);
                }
            }
            scope.completedLevels = scope.completedLevels ? scope.completedLevels : [];
            scope.unlockedLevels = scope.unlockedLevels ? scope.unlockedLevels : [];
            scope.element = element;

            angular.element($window).bind("resize",update);
        },
        controller: function($scope,$timeout) {
            function update() {

                var svg = $scope.element.find('svg'),
                    numUnlockedLevels = 0,
                    numLevels = 0;

                // For each level, set a flag if it's a) unlocked and b) completed
                angular.forEach($scope.model.levels, function(level,idx) {
                    level.completed = $scope.completedLevels.indexOf(idx)!=-1;
                    level.unlocked = $scope.unlockedLevels.indexOf(idx)!=-1;
                    if (level.unlocked) {
                        numUnlockedLevels++;
                    }
                    numLevels++;
                });

                // For the Fog of War, a SVG is being used as a overlay on top of the
                // map background. The SVG is a white rect, which has a mask, which consists
                // of one circle per level.
                // So for each level we create a new circle in this mask, which is hidden or
                // visible based on the level's 'unlocked' flag.
                // Since the flags change over time, we need to make sure to not re-create the
                // circles twice, which is why we reference the level of the circle by the
                // circle's artificial 'level-index' attribute.
                // Thus, we only create a new level, if the level's circle hasn't been created
                // yet before.
                $scope.$watch('model.$ready',function () {
                    if (!$scope.model.$ready) return;
                    var f = 1 + 2*numUnlockedLevels/numLevels;
                        f = 0.4;

                    angular.forEach($scope.model.levels, function(level,idx) {
                        // Punch some holes in the fog-of-war
                        var levelCircle = $scope.element.find('[level-index='+idx+']').length==0 ?
                                          null: $scope.element.find('[level-index='+idx+']')[0];
                        if (levelCircle==null) {
                            // Important: We need to create the object manually, instead of using jQuery!
                            levelCircle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
                            levelCircle.setAttributeNS(null, "r", '20%');
                            levelCircle.setAttributeNS(null, "cx", (level.coordinates.x*100)+'%');
                            levelCircle.setAttributeNS(null, "cy",  (level.coordinates.y*100)+'%');
                            levelCircle.setAttributeNS(null, "fill", "black");
                            levelCircle.setAttributeNS(null, "visibility", "hidden");
                            levelCircle.setAttributeNS(null, "level-index", idx);
                            var mask = $scope.element.find('#world-hole-mask-'+$scope.model.id);
                            if (mask && mask[0])
                                mask[0].appendChild(levelCircle);
                        }
                        if (level.unlocked) {
                            levelCircle.setAttributeNS(null, "visibility", "visible");
                        }
                        // Fix for Google Chrome: hide&show to force-update the SVG
                        setTimeout(function () {
                            $scope.element.hide();
                            setTimeout(function() {
                                $scope.element.show();
                            },0);
                        },0);
                    });
                });
            }

            $timeout(function () {
                update();
            });

            $scope.$watch('completedLevels', function () {
                update();
            },true);

            $scope.$watch('unlockedLevels', function () {
                update();
            },true);

        },
        templateUrl: 'Views/ArgWorld.html'
    }
}])

.filter('makeRange', function() {
    return function(input) {
        var lowBound, highBound;
        switch (input.length) {
        case 1:
            lowBound = 0;
            highBound = parseInt(input[0]) - 1;
            break;
        case 2:
            lowBound = parseInt(input[0]);
            highBound = parseInt(input[1]);
            break;
        default:
            return input;
        }
        var result = [];
        for (var i = lowBound; i <= highBound; i++)
        result.push(i);
        return result;
    };
})

.filter('capitalize', function() {
    return function(input, all) {
        return (!!input) ? input.replace(/([^\W_]+[^\s-]*) */g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();}) : '';
    }
})
