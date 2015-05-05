var GithubService = require('./github/service.js');
var MongoService = require('./mongodb/service.js');

//Add a listener to push all events into our mongodb database
//GithubService.AddListener(MongoService.ProcessEvent);
//GithubService.StartPolling();
GithubService.GetRandomUsers(function (user) {
    console.log('Okay. Now processing ');
    console.log(user);
    MongoService.InsertRandomUser(user);

});