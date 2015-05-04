/** Anthony Guo (anthony.guo@some.ox.ac.uk)
 *
 * Service for getting data from the eventstore database
 */
(function(){
    // Interprets input received from the IcsAdapter.
    // Each input corresponds to an event. When an event
    // is triggered, all registered callbacks are invoked.
    angular.module('githubviz.services').service('EventStoreService',
    ['$http', function($http) {

        // Returns a javascript promise object
        // To use this do GetProjectionState("SOME_PROJECTION").success(function...).error(function...)
        // See https://docs.angularjs.org/api/ng/service/$http for more details
        function GetProjectionState(projectionName){
            return $http.get('http://localhost:2113/projection/' + projectionName + '/state');
        }

        return {
            // Gets a http object that will hold the state of the projection corresponding to the name passed in
            GetProjectionState: GetProjectionState,
        }
    }]);
})();
