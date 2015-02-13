/** Anthony Guo (anthony.guo@some.ox.ac.uk)
 *
 * Describes the angular controllers/services and their dependencies
 */

angular.module('githubviz', [
    'githubviz.controllers',
    'githubviz.services',
    'chartsExample.directives'
]);


angular.module('githubviz.controllers', [ 
    //add dependencies for the controllers here
]);

angular.module('githubviz.services', [
    //add dependencies for the services here
]);

/**
 * Controls the entire app. Named "GithubViz".
 */
(function(){
    angular.module('githubviz.controllers').controller('GithubViz',
        ['$scope', controller]);
    function controller ($scope, $modal) {
        $scope.datum = "Hello world!";
    }
})();
