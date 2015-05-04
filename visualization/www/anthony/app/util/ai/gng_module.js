
(function(){
    var NODE_CHANGE_RATE                = 0.1;
    var NODE_NEIGHBOR_CHANGE_RATE       = 0.01;
    var LOCAL_DECREASE_RATE             = 0.5;
    var GLOBAL_DECREASE_RATE            = 0.99;
    var AGE_MAX                         = 400;
    var TIME_BETWEEN_ADDING_NODES       = 50;
    angular.module('githubviz.services').service('GngClusterService',
    ['$http', function($http) {
      var gngModule = {};
      gngModule.Network = function(){
          this.edges = [];
          this.nodes = [];
      }

      gngModule.Node = function(featureVector){
          this.vector = featureVector;
          this.edges = [];
          this.error = 0;
      }

      gngModule.Node.prototype.connectTo = function(otherNode){
          var newEdge = new gngModule.Edge(this, otherNode);
          this.edges.push(newEdge);
          otherNode.edges.push(newEdge);
          return newEdge;
      }

      //Dont do square root to optimize 
      gngModule.Node.prototype.getEuclidianDistance = function(featureVector){
          var distance = 0;
          for (var i = 0; i != this.vector.length; ++i){
              var a = this.vector[i];
              var b = featureVector[i];
              distance += (a-b)*(a-b);
          }
          return distance;
      }

      gngModule.Node.prototype.updateError = function(weightChange){
          this.error += weightChange;
      }

      gngModule.Node.prototype.shiftTowardVector = function(targetVector, changeAmount){
          for (var i = 0; i != targetVector.length; ++i)
          {
              var k = (targetVector[i] - this.vector[i]) * changeAmount;
              this.vector[i] += k;
          }
      }

      gngModule.Edge = function(node1, node2){
          this.node1 = node1;
          this.node2 = node2;
          this.age = 0;
      }

      gngModule.Edge.prototype.getOtherNode = function(node){
          if (node == this.node1){
              return this.node2;
          } 
          else if (node == this.node2){
              return this.node1;
          } 
          else {
              return null;
          }
      }

      gngModule.Edge.prototype.deleteMe = function(){
          var i = this.node1.edges.indexOf(this);
          this.node1.edges.splice(i,1);
          i = this.node2.edges.indexOf(this);
          this.node2.edges.splice(i,1);
          return this;
      }

      gngModule.GrowingNeuralGas = function(featureSpaceDimension, dataSource){
          this.featureSpaceDimension = featureSpaceDimension // :: an integer of the number of dimensions to cluster
          this.dataSource = dataSource; // :: a list of data points to draw from
          this.nodes = [];
          this.edges = [];
          this.iterationNumber = 1;

          //Pick two random points from the data source
          var newNode1 = new gngModule.Node(this.getRandomFeatureVector());
          var newNode2 = new gngModule.Node(this.getRandomFeatureVector());
          this.edges.push(newNode1.connectTo(newNode2));
          this.nodes.push(newNode1);
          this.nodes.push(newNode2);
      }

      gngModule.GrowingNeuralGas.prototype.findNodeWithLargestError = function(featureVector){
          var largestErrorNode = null;
          for (var i = 0 ; i != this.nodes.length; ++i){
              if (!largestErrorNode){
                  largestErrorNode = this.nodes[i];
              }
              else if (this.nodes[i].error > largestErrorNode.error){
                  largestErrorNode = this.nodes[i];
              }
          }
          return largestErrorNode;
      }

      gngModule.GrowingNeuralGas.prototype.findTwoClosestNodes = function(featureVector){
          obj = {
              closestNode : null,
              secondClosestNode : null
          }
          var min1 = 1000000;
          var min2 = 1000000;
          for (var i = 0; i != this.nodes.length; ++i)
          {
              var dist = this.nodes[i].getEuclidianDistance(featureVector);
              if (dist < min1)
              {
                  min2 = min1;
                  obj.secondClosestNode = obj.closestNode;
                  min1 = dist;
                  obj.closestNode = this.nodes[i];
              }
              else if (dist < min2)
              {
                  min2 = dist;
                  obj.secondClosestNode = this.nodes[i];
              }
          }
          return obj;
      }


      gngModule.GrowingNeuralGas.prototype.getRandomFeatureVector = function(){
          var datapoint = this.dataSource[Math.floor(Math.random()*this.dataSource.length)];

          //Give it a +- 0.5% margin of error
          var error = datapoint[0] * 0.01;
          return datapoint.map(function(i){
              return i + (Math.random() - 0.5) * error;
          });
      }

      gngModule.GrowingNeuralGas.prototype.iterate = function(){
          var randomFeatureVector = this.getRandomFeatureVector();
          var t = this.findTwoClosestNodes(randomFeatureVector);
          var closestNode = t.closestNode;
          var secondClosestNode = t.secondClosestNode;

          //Update the local error to equal its distance from the datapoint
          closestNode.updateError(closestNode.getEuclidianDistance(randomFeatureVector));

          //Move the closest node closer
          closestNode.shiftTowardVector(randomFeatureVector, NODE_CHANGE_RATE);

          //Move all the neighbors of the closest node closer
          var ageWasReset = false;
          for (var i = 0 ; i != closestNode.edges.length; ++i){
              var otherNode = closestNode.edges[i].getOtherNode(closestNode);
              otherNode.shiftTowardVector(randomFeatureVector, NODE_NEIGHBOR_CHANGE_RATE);
              if (otherNode == secondClosestNode){
                  closestNode.edges[i].age = 0;
                  ageWasReset = true;
              }
          }
          //If the age was not reset, create a new edge between the two nodes
          if (!ageWasReset){
              this.edges.push(closestNode.connectTo(secondClosestNode));
          }

          //Delete all the old eges and also Increment ages of all edges
          for (var i = 0; i != this.edges.length; ++i){
              var edge = this.edges[i];
              edge.age += 1;
              if (edge.age > AGE_MAX){
                  var edge = edge.deleteMe();

                  //Delete the nodes if they have no links
                  if (edge.node1.edges.length == 0){
                      var t = this.nodes.indexOf(edge.node1);
                      this.nodes.splice(t,1);
                  }
                  if (edge.node2.edges.length == 0){
                      var t = this.nodes.indexOf(edge.node2);
                      this.nodes.splice(t,1);
                  }
                  this.edges.splice(i, 1);
                  i--;
              }
          }

          //Add a node to the graph if neccessary
          if ((this.iterationNumber % TIME_BETWEEN_ADDING_NODES) == 0){
              this.addNode();
          }
          
          //Decrease all errors globally
          this.nodes = this.nodes.map(function(node){
              node.error *= GLOBAL_DECREASE_RATE;
              return node;
          })

          //Increment current iteration
          this.iterationNumber += 1;
      }

      gngModule.GrowingNeuralGas.prototype.addNode = function(){
          var largestErrorNode = this.findNodeWithLargestError();
          
          var largestErrorNeighbor = null;
          var edge = null;
          for (var i = 0 ; i!= largestErrorNode.edges.length; ++i){
              var otherNode = largestErrorNode.edges[i].getOtherNode(largestErrorNode);
              if (!largestErrorNeighbor){
                  largestErrorNeighbor = otherNode;
                  edge = largestErrorNode.edges[i];
              }
              else if (largestErrorNeighbor.error < otherNode.error){
                  largestErrorNeighbor = otherNode;
                  edge = largestErrorNode.edges[i];
              }
          }

          //Delete the edge
          edge.deleteMe();
          this.edges.splice(this.edges.indexOf(edge),1);

          //Create the new node
          var newVector = [];
          for (var i = 0; i != largestErrorNode.vector.length; ++i){
              newVector.push((largestErrorNode.vector[i] + largestErrorNeighbor.vector[i])/2);
          }
          var newNode = new gngModule.Node(newVector);
          this.nodes.push(newNode);
          //TODO: figure out if we need to set the error of the new vector at all

          //Create the new edges
          var newEdge;
          newEdge = newNode.connectTo(largestErrorNode);
          this.edges.push(newEdge);
          newEdge = newNode.connectTo(largestErrorNeighbor);
          this.edges.push(newEdge);

          //Decrease the original nodes' errors
          largestErrorNode.error *= LOCAL_DECREASE_RATE;
          largestErrorNeighbor.error *= LOCAL_DECREASE_RATE;
      }

      gngModule.GrowingNeuralGas.prototype.getNetwork = function(){
          return this.nodes;
      }

      gngModule.setSize = function(width, height){

      }

      gngModule.generateTestData = function(){
          var data = [];
          for (var i = 0; i != 1000; ++i){
              var e = Math.random();
              if (e < 0.5){
                  data.push([800 * Math.random()*.1, 800 *  Math.random()*.1])
              } else {
                  data.push([ 800 * (.5 + Math.random()*.1), 800 * (.5 + Math.random()*.1)])
              }
          }
          return data;
      }

      return gngModule;
    }]);
})();
