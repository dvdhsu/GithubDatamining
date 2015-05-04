/**Anthony Guo
 * Controller to handle real time events
 */

(function(){
    angular.module('githubviz.controllers').controller('RealTimeController',
        ['$scope', 'RealTimeService',
        function($scope, RealTimeService) {

            $scope.data = RealTimeService.Data;

            $scope.options = {
                datasetStroke: false,
                animation: false,
                pointDot: false,
                showTooltips: false,
                scaleShowVerticalLines: false,
                scaleLabel: function (valuePayload) {
                    return Number(valuePayload.value) + ' events'
                }
            };

            $scope.get_json_events = function(){
                return JSON.stringify($scope.data.events, undefined, 2);
            }

            var update = 0;
            RealTimeService.AddDataHandler(function(){
                update += 1;
            })
            function UpdateLoop(){
                if (update > 0){
                    $scope.$apply();
                }
                update = 0;
                setTimeout(UpdateLoop, 30);
            }
            UpdateLoop();

            function SyntaxHighlight(json) {
                if (typeof json != 'string') {
                }
                json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
                return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
                    var cls = 'number';
                    if (/^"/.test(match)) {
                    if (/:$/.test(match)) {
                        cls = 'key';
                    } else {
                        cls = 'string';
                    }
                    } else if (/true|false/.test(match)) {
                        cls = 'boolean';
                    } else if (/null/.test(match)) {
                        cls = 'null';
                    }
                    return '<span class="' + cls + '">' + match + '</span>';
                    });
            }

        }]);
})();
