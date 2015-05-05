/* Anthony Guo (anthony.guo@some.ox.ac.uk)
 * Script to push data into mongodb
 * Works by getting the top users
 * as well if it isn't already in our database
 */
var GithubService = require('./github/service.js');
var MongoService = require('./mongodb/service.js');

//Add a listener to push all events into our mongodb database
//GithubService.AddListener(MongoService.ProcessEvent);
//GithubService.StartPolling();
GithubService.GetTopUsers(function (users) {
    console.log('Okay. Now processing ' + users.length);
    users.map(function (user) {
        MongoService.InsertUser(user);
    });
});
