var GithubService = require('./github/service.js');
var MongoService = require('./mongodb/service.js')

var promise = MongoService.GetAllUsers();
promise.success(function (docs){
    var users = docs;
    users.map(function (user){
        GithubService.GetStarredRepo(user, function (starred_repos){
            console.log(starred_repos);
            console.log('processing ' + user.login);
            user.starred_repos = starred_repos;
            var promise = MongoService.UpdateUser(user);
        })
    })
})
