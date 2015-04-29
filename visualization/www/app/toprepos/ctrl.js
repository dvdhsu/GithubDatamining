(function(){
  angular.module('githubviz.controllers').controller('TopReposCtrl', ['$scope', 'SocketIOService', 'GngClusterService', ctrl]);
  var BOUNDS = 1000;
  var iteration = 0;
  function ctrl($scope, SocketIOService, GngClusterService) {
    SocketIOService.AddHandler('toprepos', function(repos){
      console.log(repos);

      $scope.repos = {};
      $scope.repo_array = [];
      contrib_ids = {};
      repos.map(function(repo){
        repo.links = [];
        $scope.repos[repo.full_name] = repo;
        $scope.repo_array.push(repo);
        repo.contributors.map(function(cid){
          if (!contrib_ids[cid]){
            contrib_ids[cid] = [];
          }
          contrib_ids[cid].push(repo);
        });
      });

      for (var cid in contrib_ids){
        var repos = contrib_ids[cid];
        for (var i = 0; i < repos.length; ++i){
          for (var j = i + 1; j < repos.length; ++j){
            repos[j].links.push({repo_1: repos[i].full_name, repo_2: repos[j].full_name, total_weight: 5 });
            repos[i].links.push({repo_1: repos[i].full_name, repo_2: repos[j].full_name, total_weight: 5 });
          }
        }
      }
      $scope.canvas = document.getElementById('bigAwesomePlot');
      $scope.context = $scope.canvas.getContext('2d');
      $scope.initializeGraph();
    });
    SocketIOService.Emit('toprepos');

    setTimeout(function(){
    }, 1000);

    $scope.repo_array = [];

    $scope.zoom = 1;
    $scope.center = [400,300];
    $scope.isDragging = false;
    $scope.previousMousePos = [];
    $scope.isSimulating = true;
    $scope.zoomOffset = [0,0];

    $scope.config = {
      antiGravityFactor: 2,
      springFactor: 1.005
    };
    $scope.decay = 2;
    $scope.selectedUser;

    $scope.startDrag = function(e){
      $scope.isDragging = true;
      $scope.previousMousePos = [e.pageX, e.pageY];
    }

    $scope.doDrag = function(e){
      if (!$scope.isDragging){
        return;
      }
      var x_diff = e.pageX - $scope.previousMousePos[0];
      var y_diff = e.pageY - $scope.previousMousePos[1];
      $scope.center[0] += x_diff;
      $scope.center[1] += y_diff;
      $scope.previousMousePos = [e.pageX, e.pageY];
    }

    $scope.stopDrag = function(e){
      $scope.previousMousePos = [e.pageX, e.pageY];
      $scope.isDragging = false;
      console.log(e);

      var x = (e.offsetX - $scope.center[0] - $scope.zoomOffset[0]) / $scope.zoom;
      var y = (e.offsetY - $scope.center[1] - $scope.zoomOffset[1]) / $scope.zoom;
      $scope.repo_array.map(function(user){
        if (!user.location){
          console.log(user);
          return;
        }
        var user_x = user.location[0];
        var user_y = user.location[1];
        if (user == $scope.selectedUser){
          console.log((user_x -x).toString() + ' ' + (user_y -y).toString());
        }
        if (Math.abs(user_x - x) < 5){
          if (Math.abs(user_y - y) < 5){
            $scope.selectedUser = user;
            console.log('OK');
          }
        }
      });
    }

    $scope.doScroll = function(e, delta, delta_x, delta_y){
      var newZoom = Math.abs( $scope.zoom - delta / 50.0);
      newZoom = newZoom < 0.1 ? 0.1 : newZoom;
      newZoom = newZoom > 10.0 ? 10.0 : newZoom;
      var x = e.originalEvent.layerX - $scope.center[0] - $scope.zoomOffset[0];
      var y = e.originalEvent.layerY - $scope.center[1] - $scope.zoomOffset[1];
      var x_diff = x/$scope.zoom - x/newZoom;
      var y_diff = y/$scope.zoom- y/newZoom;
      $scope.zoomOffset[0] += - x_diff * newZoom;
      $scope.zoomOffset[1] += - y_diff * newZoom;
      //user.real_location[0] = $scope.center[0] + (user.location[0]) * $scope.zoom + $scope.zoomOffset[0];
      $scope.zoom = newZoom;

    }

    $scope.stop = function(e){
      $scope.isSimulating = false;
    }

    $scope.resume = function(){
      $scope.isSimulating = true;
    }

    $scope.startClustering = function(){
      if ($scope.isClustering){
        return;
      }
      $scope.isSimulating = false;
      $scope.isClustering = true;
      $scope.data = []
      for (var repo in $scope.repos){
        var user = $scope.repos[repo];
        $scope.data.push(user.location);
      }
      $scope.gng = new GngClusterService.GrowingNeuralGas(2, $scope.data);
    }

    $scope.changeSelected = function(user){
      $scope.selectedUser = user;
    }

    $scope.reset = function(){
      for (var i = 0; i != $scope.repos.length; ++i){
        //$scope.users[i].location = [Math.random() * 800, Math.random() * 600]
        $scope.repos[i].location = [Math.random() * 50 - 25 + 400, Math.random() * 50 - 25 + 300]
      }
    }
    $scope.compareUser = function(a, b){
      return a.score - b.score;
    }

    $scope.updateRankings = function(){
      //Calculate distance from origin
      $scope.repo_array.map(function(user){
        //user.score = Math.pow((user.location[0] - $scope.rootuser.location[0]), 2)  + Math.pow((user.location[1] - $scope.rootuser.location[1]), 2);
      });
      //$scope.repo_array.sort($scope.compareUser);
      $scope.$apply();
    }


    $scope.initializeGraph = function(){
      //initialize the graph by randomly sticking the points on the graph
      $scope.repo_array.map(function(repo){
        repo.location = [Math.random() * 50 - 25, Math.random() * 50 - 25];
        repo.real_location = [0,0];
      });
      $scope.updateGraph();
    }

    $scope.getForce = function(loc_1, loc_2){
      var deltas = [];
      var total_distance = 0;
      var normalizing_factor = 0;
      for (var i = 0; i != loc_1.length; ++i){
        total_distance += Math.pow(loc_1[i] - loc_2[i], 2)
        normalizing_factor += Math.abs(loc_1[i] - loc_2[i])
      }
      if (total_distance == 0){
        return [0, 0]
      }
      normalizing_factor = 1.0 / normalizing_factor;
      total_distance = Math.sqrt(total_distance)

      for (var i = 0; i != loc_1.length; ++i){
        var distance = loc_1[i] - loc_2[i]
        var normalized = distance * normalizing_factor
        deltas.push((1.0 / total_distance) * normalized * $scope.config.antiGravityFactor)
      }
      return deltas;
      //Force exerted by loc_2 on loc_1
      //var x_diff = loc_1[0] - loc_2[0];
      //var y_diff = loc_1[1] - loc_2[1];

      //var x_force = Math.pow($scope.antiGravityFactor, Math.abs(x_diff));
      //x_force = x_diff > 0 ? x_force : -x_force;
      //var y_force = Math.pow($scope.antiGravityFactor, Math.abs(y_diff));
      //y_force = y_diff > 0 ? y_force : -y_force;
      //return [ ( $scope.antiGravityFactor * $scope.decay) / x_diff , ( $scope.antiGravityFactor * $scope.decay) / y_diff ];
      //console.log ( x_force * 4 + ' ' + 0.1/x_force )
      //return [ x_force*4 * $scope.decay, y_force*4 * $scope.decay ];
    }

    $scope.getAttraction = function(loc_1, loc_2, weight){
      //weight = weight * 0.1;
      var deltas = [];
      var total_distance = 0;
      var normalizing_factor = 0;
      for (var i = 0; i != loc_1.length; ++i){
        total_distance += Math.pow(loc_1[i] - loc_2[i], 2)
        normalizing_factor += Math.abs(loc_1[i] - loc_2[i])
      }
      if (total_distance == 0){
        return [0, 0]
      }
      normalizing_factor = 1.0 / normalizing_factor;
      total_distance = Math.sqrt(total_distance);
      var total_force = weight * Math.pow($scope.config.springFactor, total_distance);

      for (var i = 0; i != loc_1.length; ++i){
        var distance = loc_1[i] - loc_2[i]
        var normalized = distance * normalizing_factor
        deltas.push(-total_force * normalized * $scope.config.springFactor)
      }
      return deltas;
    }

    $scope.updateGraph = function(){
      //$scope.decay *= 0.999;
      iteration++;
      $scope.config.antiGravityFactor *= 0.999;
      console.log($scope.config.antiGravityFactor);
      for (var repo in $scope.repos){
        var user = $scope.repos[repo];
        if ($scope.isSimulating){
          var x_force = 0;//1*Math.random() - 0.5;
          var y_force = 0;//1*Math.random() - 0.5;
          for (var other_repo in $scope.repos){
            if (other_repo == repo){
              continue;
            }
            var other_user = $scope.repos[other_repo];
            var forces = $scope.getForce(user.location, other_user.location);
            x_force += forces[0];
            y_force += forces[1];
          }
          for (var j = 0; j != user.links.length; ++j){
            var link = user.links[j];
            var other_user;
            if (link.repo_1 == user.repo){
              other_user = $scope.repos[link.repo_2];
            } else {
              other_user = $scope.repos[link.repo_1];
            }
            var forces = $scope.getAttraction(user.location, other_user.location, link.total_weight);
            //Make neighbor of neighbors have a slight attraction!
            for (var k = 0 ; k != other_user.links.length; ++k){
              var neighbor_of_neighbor;
              if (link.repo_1 == other_user.repo){
                neighbor_of_neighbor = $scope.repos[link.repo_2];
              } else {
                neighbor_of_neighbor = $scope.repos[link.repo_1];
              }
              if (neighbor_of_neighbor == user){
                continue;
              }
              var forces = $scope.getAttraction(user.location, neighbor_of_neighbor.location, link.total_weight * 0.1);
            }
            x_force += forces[0];
            y_force += forces[1];
          }
          user.deltas= [x_force, y_force]
        }
      }

      if ($scope.isSimulating){
        for (var repo in $scope.repos){
          var user = $scope.repos[repo];
          var x_force = user.deltas[0]
          var y_force = user.deltas[1]
          x_force = Math.atan( 0.2 * x_force) * 3;
          y_force = Math.atan( 0.2 * y_force) * 3;
          user.location[0] += x_force;
          user.location[1] += y_force;
          for (var i =0 ; i!= user.location.length; ++i){
            user.location[i] = user.location[i] > BOUNDS ? BOUNDS : user.location[i];
            user.location[i] = user.location[i] < -BOUNDS ? -BOUNDS : user.location[i];
          }
          user.real_location[0] = $scope.center[0] + (user.location[0]) * $scope.zoom + $scope.zoomOffset[0];
          user.real_location[1] = $scope.center[1] + (user.location[1]) * $scope.zoom + $scope.zoomOffset[1];
        }
      }

      if ($scope.isClustering){
        $scope.gng.iterate();
      }

      $scope.redrawCanvas();
      $scope.timeout = setTimeout(function(){
        $scope.updateGraph();
        $scope.updateRankings();
      }, 30);
    }

    $scope.redrawCanvas = function(){
      $scope.context.clearRect(0,0,800,600);
      if ($scope.isClustering){
        $scope.context.clearRect(0,0,800,600);
        for (var i = 0; i != $scope.gng.nodes.length; ++i){
          var node = $scope.gng.nodes[i];
          node.real_location = [1,1];
          node.real_location[0] = $scope.center[0] + (node.vector[0]) * $scope.zoom + $scope.zoomOffset[0];
          node.real_location[1] = $scope.center[1] + (node.vector[1]) * $scope.zoom + $scope.zoomOffset[1];
          var context = $scope.canvas.getContext('2d');
          context.beginPath();
          context.strokeStyle = 'rgba(255,0,0,1)';
          context.arc(node.real_location[0], node.real_location[1], 2, 0, 2 * Math.PI );
          context.stroke();
          context.closePath();
        }
        for (var i =0 ; i != $scope.gng.edges.length; ++i){
          var edge = $scope.gng.edges[i];
          var context = $scope.canvas.getContext('2d');
          context.beginPath();
          context.strokeStyle = 'rgba(255,0,0,1)';
          context.moveTo(edge.node1.real_location[0], edge.node1.real_location[1]); 
          context.lineTo(edge.node2.real_location[0], edge.node2.real_location[1]); 
          context.stroke();
          context.closePath();
        }
        for (var i = 0; i != $scope.data.length; ++i){
          var real_location = [1,1];

          var vector = $scope.data[i];
          real_location[0] = $scope.center[0] + (vector[0]) * $scope.zoom + $scope.zoomOffset[0];
          real_location[1] = $scope.center[1] + (vector[1]) * $scope.zoom + $scope.zoomOffset[1];
          var context = $scope.canvas.getContext('2d');
          context.beginPath();
          context.strokeStyle = 'rgba(0,255,0,.2)';
          context.arc(real_location[0], real_location[1], 2, 0, 2 * Math.PI );
          context.stroke();
          context.closePath();
        }
      } 
      else {
        for (var repo in $scope.repos){
          var user = $scope.repos[repo];
          (function(){
            for (var j = 0; j != user.links.length; ++j){
              var link = user.links[j];
              var other_user;
              if (link.repo_1 == user.repo){
                other_user = $scope.repos[link.repo_2];
              } else {
                other_user = $scope.repos[link.repo_1];
              }
              var context = $scope.canvas.getContext('2d');
              context.strokeStyle = 'rgba(0,0,0,0.1)';
              context.beginPath();
              context.moveTo(user.real_location[0], user.real_location[1]);
              context.lineTo(other_user.real_location[0], other_user.real_location[1]);
              context.stroke();
              context.closePath();
            }
            for (var key in user.links_to_me){
            }
          })();
          var context = $scope.canvas.getContext('2d');
          context.beginPath();
          if (user == $scope.rootuser){
            user.bgColor = 'pink';
            context.strokeStyle = 'rgba(255,0,0,1)';
            context.arc(user.real_location[0], user.real_location[1], 5, 0, 2 * Math.PI );
          } else if (user == $scope.selectedUser){
            context.strokeStyle = 'rgba(0,255,0,1)';
            user.bgColor = 'lightgreen';
            context.arc(user.real_location[0], user.real_location[1], 5, 0, 2 * Math.PI );
          } else  {
            user.bgColor = '';
            context.strokeStyle = 'rgba(0,0,0,0.1)';
            context.arc(user.real_location[0], user.real_location[1], 2, 0, 2 * Math.PI );
          }
          context.stroke();
          context.closePath();
        }
      }
      //update canvas graph
    };

    $scope.testClusterer = function(){
      $scope.testData = GngClusterService.generateTestData();
      $scope.gng = new GngClusterService.GrowingNeuralGas(2, $scope.testData);
      $scope.iterateCluster();

    }

    $scope.iterateCluster = function(){
      $scope.gng.iterate();

      $scope.context.clearRect(0,0,800,600);
      for (var i = 0; i != $scope.gng.nodes.length; ++i){
        var node = $scope.gng.nodes[i];
        var context = $scope.canvas.getContext('2d');
        context.beginPath();
        context.strokeStyle = 'rgba(255,0,0,1)';
        context.arc(node.vector[0], node.vector[1], 2, 0, 2 * Math.PI );
        context.stroke();
        context.closePath();
      }
      for (var i =0 ; i != $scope.gng.edges.length; ++i){
        var edge = $scope.gng.edges[i];
        var context = $scope.canvas.getContext('2d');
        context.beginPath();
        context.strokeStyle = 'rgba(255,0,0,1)';
        context.moveTo(edge.node1.vector[0], edge.node1.vector[1]); 
        context.lineTo(edge.node2.vector[0], edge.node2.vector[1]); 
        context.stroke();
        context.closePath();
      }
      for (var i = 0; i != $scope.testData.length; ++i){
        var context = $scope.canvas.getContext('2d');
        context.beginPath();
        context.strokeStyle = 'rgba(0,255,0,.05)';
        context.arc($scope.testData[i][0], $scope.testData[i][1], 2, 0, 2 * Math.PI );
        context.stroke();
        context.closePath();
      }
      setTimeout($scope.iterateCluster, 30);
    }
  }
})();
