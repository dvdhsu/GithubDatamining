Note, you will need to download EventStore which can be found here: https://geteventstore.com/downloads/

Once you download the executables, copy the folder into ./EventStore. This means the directory structure will look roughly like
.. (up a dir)
/GithubDatamining/

|+db/

|~EventStore/

| |+clusternode-web/

| |+db/

| |+logs/

| |+Prelude/

| |+projections/

| |+web-resources/

| |-EventStore.ClientAPI.dll

| |-EventStore.ClientAPI.Embedded.dll

| |-EventStore.ClientAPI.Embedded.pdb

| |-EventStore.ClientAPI.Embedded.xml

| |-EventStore.ClientAPI.pdb

| |-EventStore.ClientAPI.xml

| |-EventStore.ClusterNode.exe*

| |-EventStore.ClusterNode.pdb

| |-EventStore.PAdmin.exe*

| |-EventStore.PAdmin.pdb

| |-EventStore.Query.exe*

| |-EventStore.Query.pdb

| |-EventStore.TestClient.exe*

| |-EventStore.TestClient.pdb

| |-js1.dll

| |-js1.pdb

| `-NLog.config

|+logs/

|-grabdata.js

|-package.json

|-README.md

`-startme.sh


Once you've got this set up, depending on whether you're using a mac or a pc, you can run startme.sh to startup the database


Then, if you want to get the data into the database, you will need to install nodejs, and then in this directory run the command 

```
node grabdata.js
```


ALSO: https://github.com/robashton/githubfall is a good example on how to grab data from github



