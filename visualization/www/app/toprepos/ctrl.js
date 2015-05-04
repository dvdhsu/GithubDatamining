(function () {
    angular.module('githubviz.controllers').controller('TopReposCtrl', ['$scope', 'SocketIOService', 'GngClusterService', ctrl]);
    var BOUNDS = 40000;
    var iteration = 0;
    function ctrl($scope, SocketIOService, GngClusterService) {
        $scope.repos = {};
        $scope.repo_array = [];
        $scope.links = [];
        function GetNeighbors(repo) {
            var other_repos = [];
            for (var i = 0; i != repo.links.length; ++i) {
                var link = repo.links[i];
                if (link.repo_1 == repo) {
                    other_repos.push($scope.repos[link.repo_2]);
                } else {
                    other_repos.push($scope.repos[link.repo_1]);
                }
            }
            return other_repos;
        }
        SocketIOService.AddHandler('toprepos', function (repos) {
            console.log('got top repos');
            console.log(repos);

            contrib_ids = {};
            $scope.repo_array = repos;
            $scope.repo_array.map(function (repo) {
                repo.links = [];
                $scope.repos[repo.full_name] = repo;
                $scope.repo_array.push(repo);
                repo.contributors.map(function (cid) {
                    if (!contrib_ids[cid]) {
                        contrib_ids[cid] = [];
                    }
                    contrib_ids[cid].push(repo);
                });
            });

            for (var cid in contrib_ids) {
                var repos = contrib_ids[cid];
                for (var i = 0; i < repos.length; ++i) {
                    for (var j = i + 1; j < repos.length; ++j) {
                        repos[j].links.push({ repo_1: repos[i].full_name, repo_2: repos[j].full_name, total_weight: 5 });
                        //repos[i].links.push({ repo_1: repos[i].full_name, repo_2: repos[j].full_name, total_weight: 5 });
                    }
                }
            }
            SetUpNetwork();
            //$scope.canvas = document.getElementById('bigAwesomePlot');
            //$scope.context = $scope.canvas.getContext('2d');
            //$scope.initializeGraph();
        });
        SocketIOService.Emit('toprepos');
        function SetUpNetwork() {
            var margin = { top: -5, right: -5, bottom: -5, left: -5 },
                width = 1400 - margin.left - margin.right,
                height = 700 - margin.top - margin.bottom;

            var fill = d3.scale.category20();

            var drag = d3.behavior.drag()
                .origin(function (d) { return d; })

            var force = d3.layout.force()
                .size([width, height])
                .nodes([{}]) // initialize with a single node
                .linkDistance(30)
                .charge(-50)
                .linkStrength(0.01)
                .gravity(0.01)
                .on("tick", tick);

            var svg = d3.select("#svg_container").append("svg")
                .attr("width", width)
                .attr("height", height)
                .call(d3.behavior.zoom().on("zoom", redraw))
                .attr("transform", "translate(" + margin.left + "," + margin.right + ")")
            .append('svg:g')
                .append('svg:g')

            var rect = svg.append("rect")
                .attr("width", width)
                .attr("height", height)
                .style("fill", "none")
                .style("pointer-events", "all");
            var container = svg.append('g');

            var nodes = force.nodes(),
                links = force.links(),
                node = svg.selectAll(".node"),
                link = svg.selectAll(".link");
            //var node = svg.selectAll(".node")
            //      .data(force.nodes())
            //      .enter().append("g")



            function redraw() {
                console.log('ZOOM')
                svg.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
            }

            function dragstarted(d) {
                console.log('DRAG STARTING');
                d3.event.sourceEvent.stopPropagation();
                d3.select(this).classed("dragging", true);
            }

            function dragged(d) {
                console.log('DRAGGED ');
                d3.select(this).attr("cx", d.x = d3.event.x).attr("cy", d.y = d3.event.y);
            }

            function dragended(d) {
                console.log('DRAG STARTING');
                d3.select(this).classed("dragging", false);
            }
            $scope.repo_array.map(function (repo) {
                repo.node = { x: Math.random() * 300, y: Math.random() * 300, name: repo.name, r : repo.watchers * 0.0005 };
                nodes.push(repo.node);
            });
            $scope.repo_array.map(function (repo) {
                var neighbors = GetNeighbors(repo);

                neighbors.map(function (neighbor) {
                    links.push({ source: repo.node, target: neighbor.node })
                })
            });
            restart();

            function tick() {
                link.attr("x1", function (d) { return d.source.x; })
                    .attr("y1", function (d) { return d.source.y; })
                    .attr("x2", function (d) { return d.target.x; })
                    .attr("y2", function (d) { return d.target.y; });

                node.attr("cx", function (d) { return d.x; })
                    .attr("cy", function (d) { return d.y; });
                node.attr("transform", function (d) { return "translate(" + d.x + "," + d.y + ")"; });
            }

            function restart() {
                link = link.data(links);

                link.enter().insert("line", ".node")
                    .attr("class", "link");

                node = node.data(nodes);
                var n = node.enter().append('g');
                n.insert("circle", ".cursor")
                    .attr("class", "node")
                    .attr("r", function (d) {
                        console.log(d);
                        return d.r;
                    })
                    .call(force.drag)
                    .append("text")
                    .attr("dx", 12)
                    .attr("dy", ".35em")
                    .text(function (d) {
                        return d.name;
                    });

                n.append("text")
                    .attr("dx", function (d) { return d.r + 5 })
                    .attr("dy", ".35em")
                    .text(function (d) {
                        return d.name;
                    });
                force.start();
            }

        }

    }
})();
