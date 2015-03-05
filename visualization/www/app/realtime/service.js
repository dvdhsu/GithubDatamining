/** Anthony Guo (anthony.guo@some.ox.ac.uk)
 *
 * Service for real time graphs
 */
(function(){
    // Interprets input received from the socket.
    // Each input corresponds to an event. When an event
    // is triggered, all registered callbacks are invoked.
    angular.module('githubviz.services').factory('RealTimeService',
    ['SocketIOService', function(SocketIOService) {
        console.log('Realtime service executed');
        var WIDTH = 2;
        var DATA_LENGTH = WIDTH*60;
        var LABEL_INTERVAL = WIDTH;
        var c = 0;

        var _data = {
            events: [],
            chart: {
                data: [],
                series: [],
                labels: []
            }
        }

        var _callbacks = [];

        SocketIOService.AddHandler('realtime_data', function(events){
            _data.events = _data.events.concat(events);
             

            var chart = _data.chart;
            chart.data.map(function(d){
                d.push(0);
                d.shift();
            });
            while (chart.labels.length < DATA_LENGTH){
                chart.labels.push(' ');
            }
            if (c % LABEL_INTERVAL == 0){
                chart.labels.push(moment(events[0].created_at).format('hh:mm:ss'));
            } else {
                chart.labels.push(' ');
            }
            if (chart.labels.length > DATA_LENGTH){
                chart.labels.shift();
            }
            c += 1;
            for (var i = 0; i != events.length; ++i){
                var event = events[i];
                var index = chart.series.indexOf(event.type);
                if (index == -1){
                    //if (chart.data.length > 5){
                        //continue;
                    //}
                    chart.series.push(event.type)
                    var d = [];
                    for (var j = 0; j != DATA_LENGTH; ++j){
                        d.push(0);
                    }
                    chart.data.push(d);
                    index = chart.data.length - 1;
                }
                chart.data[index][chart.data[index].length-1] += 1;
            }


            for (var i = 0; i != _callbacks.length; ++i){
                _callbacks[i]();
            }
        });

        function AddDataHandler(callback){
            _callbacks.push(callback);
        }

        return {
            AddDataHandler: AddDataHandler,
            Data: _data
        }
    }]);
})();
