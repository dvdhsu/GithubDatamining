/** Anthony Guo (anthony.guo@some.ox.ac.uk)
 *
 * Describes the angular controllers/services and their dependencies
 */

var app =angular.module('githubviz', [
    'ngRoute',
    'githubviz.controllers',
    'githubviz.services',
    'chartsExample.directives',
    'uiSlider',
    'monospaced.mousewheel',
]);


angular.module('githubviz.controllers', [ 
    'chart.js',
    'githubviz.services'
    //add dependencies for the controllers here
]);

angular.module('githubviz.services', [
    //add dependencies for the services here
]);

app.config(['$routeProvider', function ($routeProvider) {
    $routeProvider

    //Home page
    .when('/', {
        templateUrl: 'app/home/main.html',
    })

    //top repos
    .when('/toprepos', {
        templateUrl: 'app/toprepos/main.html',
        controller: 'TopReposCtrl'
    })

    //top repos
    .when('/topusers', {
            templateUrl: 'app/topusers/main.html',
        controller: 'TopUsersCtrl'
    })

}]);
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
