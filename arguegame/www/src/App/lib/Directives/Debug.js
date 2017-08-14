angular.module('arg.directives')

/**
 * The <debug> directive displays the inner HTML only if DEBUG is set to true.
 * Example:
 * <debug>{{ expr }}</debug>
 */
.directive('debug', function(){
    if (!('DEBUG' in window))
        DEBUG = false;
    return {
        restrict: 'E',
        template: '',
        compile: function(elem,attrs) {
        	if (!DEBUG) elem.hide();
            elem.attr('title','Debug information. Will only be visible during developing.');
            var expr = elem.html();
            setTimeout(function(){
                if (DEBUG) {
                    console.warn("Debug information: ", expr + " >> '" + elem.html() + "'");
                }
                elem.html(expr + " >> '" + elem.html() + "'");
            },100);
        }
    };
});
