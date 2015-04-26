/** Anthony Guo (anthony.guo@some.ox.ac.uk)
 *
 * Service for getting data from the socket.io sockets
 */
(function(){
    // Interprets input received from the socket.
    // Each input corresponds to an event. When an event
    // is triggered, all registered callbacks are invoked.
    angular.module('githubviz.services').factory('SocketIOService',
    [function() {
        var _socket = io(':2000/');
        console.log(_socket);
        function AddHandler(event_name, callback){
            _socket.on(event_name, callback);
        }

        return {
            // Gets a http object that will hold the state of the projection corresponding to the name passed in
            AddHandler: AddHandler,
        }
    }]);
})();
