/** Anthony Guo (anthony.guo@some.ox.ac.uk)
 *
 */
(function(){
    angular.module('githubviz.services').service('D3ForceLayout',
    ['$http', function($http) {

        // Returns a javascript promise object
        // To use this do GetProjectionState("SOME_PROJECTION").success(function...).error(function...)
        // See https://docs.angularjs.org/api/ng/service/$http for more details
        function GetProjectionState(projectionName){
            return $http.get('http://localhost:2113/projection/' + projectionName + '/state');
        }

        function FindOrCreateLayout(layout_name) {

        }

        return {
            // Gets a http object that will hold the state of the projection corresponding to the name passed in
            GetProjectionState: GetProjectionState,
        }
    }]);
})();
