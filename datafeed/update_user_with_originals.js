var GithubService = require('./github/service.js');
var MongoService = require('./mongodb/service.js')

var promise = MongoService.GetAllUsers();
promise.success(function (docs){
    var users = docs;
    users.map(function (user){
        GithubService.GetUserObject(user, function (new_user){
            for (var key in new_user) {
                user[key] = new_user[key];
            }
            console.log(new_user)
            var promise = MongoService.UpdateUser(user);
            promise.success(function (e) {
                console.log('processing ' + user.login);
            });
            promise.error(function (e) {
                console.log('OOPS');
            });
        })
    })
})
