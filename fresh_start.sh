rm -rf ./db
./EventStore/EventStore.ClusterNode.exe --db ./db --log ./logs --run-projections=all
