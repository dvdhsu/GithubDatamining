/** Anthony Guo (anthony.guo@some.ox.ac.uk)
 *
 * A test controller that utilizes the net service and outputs some silly charts
 *
 * The shell is only turned on if the "dev=true" flag is in the URL.
 *
 */
(function(){
    angular.module('githubviz.controllers').controller('TestController',
    ['$scope', 'EventStoreService',
    function($scope, EventStoreService) {

        $scope.data = 'data is coming... i promise';

        $scope.swearStats = {};

        $scope.input = {cmd: ''};
        $scope.in_dev_mode = InDevMode();
        console.log('Hi');
        console.log($scope.in_dev_mode);

        function InDevMode() {
            if (window.location.href.indexOf("?dev=true") > 0 ||
                window.location.href.indexOf("&dev=true") > 0) {
                return true;
            } else {
                return false;
            }
        }

        $scope.getData = function(){
            var req = EventStoreService.getProjectionState("QUERY_swear");
            req.success(function(data, status, headers, config){
                console.log('successfully got data');
                $scope.data = data;
                //Generate the pretty json
                $scope.prettyData = JSON.stringify(data, undefined, 4); //pretty print json

                //Generate the table data
                $scope.swearStats = [];
                for (var lang in data){
                    $scope.swearStats.push({
                        language : lang,
                        foulCommits : data[lang].count,
                        totalCommits : data[lang].total
                    });
                }
                $scope.swearStats = $scope.swearStats.filter(function(r){return r.language != 'undefined'});
                $scope.swearStats.sort(function(a,b){
                    return (b.foulCommits / b.totalCommits) - (a.foulCommits / a.totalCommits);
                });


                //Generate the chart data
                $scope.chartData = {
                    chart : { type: 'bar' },
                    title : { text: 'foul mouthed programmers at work' },
                    xAxis : { categories : $scope.swearStats.map(function(r){return r.language}) },
                    yAxis : {
                        min: 0,
                        title : { text: 'number of commits' }
                    },
                    legend : { reversed : false },
                    plotOptions : { series : { stacking : 'normal' } },
                    tooltip : { pointFormat: '<span style="color:{series.color}">\u25CF</span> {series.name}: <b>{point.y}</b><br/>' },
                    series: $scope.swearStats.reduce(function(p,c){
                        p[0].data.push(c.foulCommits);
                        p[1].data.push(c.totalCommits - c.foulCommits);
                        return p;
                    },[{name: 'foul commits', data: []}, {name :'nice commits', data: []}])
                }
            })
            .error(function(data, status, headers, config){
                console.log('encountered an error when trying to retrieve data');
                $scope.data = data;
            });
            $scope.data += '';
        }

        $scope.getData();
    }]);
})();
