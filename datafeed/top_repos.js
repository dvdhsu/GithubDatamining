/* Anthony Guo (anthony.guo@some.ox.ac.uk)
 * Script to push data into mongodb
 * Works by polling GitHub, and then getting info about the repo 
 * as well if it isn't already in our database
 */
var GithubService = require('./github/service.js');
var MongoService = require('./mongodb/service.js')

//Add a listener to push all events into our mongodb database
//GithubService.AddListener(MongoService.ProcessEvent);
//GithubService.StartPolling();
GithubService.GetTopRepos(function(repos){
  console.log('processing ' + repos.length);
  repos.map(function(repo){
    repo.contributors = repo.contributors.map(function(contributor){
      return contributor.id;
    });
    MongoService.InsertRepo(repo);
  });
});
