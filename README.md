Github Datamining
=================


General structure
-----------------

We have two database systems. One is MongoDb, and the other is EventStore.  We push all our data into MongoDb first, and then when we want to perform analytics, we can run an application that reads data from MongoDB and pushes it into EventStore. By using eventstore projections, it is easy to do temporal queries.



Note, you will need to download EventStore which can be found here: https://geteventstore.com/downloads/

Once you download the executables, copy the folder into ./EventStore. This means the directory structure will look roughly like

```
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
```

Once you've got this set up, depending on whether you're using a mac or a pc, you can run the following command to start the database

```
./startme.sh
```


Then, if you want to get the data into the database, you will need to install nodejs, and then in this directory run the command 

```
node grabdata.js
```


Finally, you will notice that in grabdata.js, there are lines like this

```
"Authorization" : "token " + process.env.OAUTHTOKEN
```

This is because we need to authenticate our data poller! If we don't we are restricted to 60 requests per hour, and if we are authenticated then we can spam up to 5,000 requests per hour.


You will need set the OAUTHTOKEN environment variable on your computer to a predefined string.  I can't commit it to this repository because GitHub cleverly scans commits for Oauth tokens and revokes any token it finds. I guess I'll put the token somewhere on the google workspace we have.

Alternatively, you can create your own Oauth access token


ALSO: https://github.com/robashton/githubfall is a good example on how to grab data from github

