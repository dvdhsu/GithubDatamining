var MongoService = require('./mongodb/service.js')
var GithubService = require('./github/service.js');

MongoService.GetEventStream()
    .each(function(doc){
        if (!doc.repo){
            return;
        }
        var id = parseInt(doc.repo.id);
        var promise = MongoService.GetRepo(id);
        promise.success(function(doc){
            console.log('Already have repo, Ok.');
            // no need to update!
        });

        promise.error(function(err){
            // repo not in database! Make a query for it and stick it in
            console.log(err);
            GithubService.GetRepo(doc.repo.name, function(repo){
                repo._id = id;
                MongoService.InsertRepo(repo);
            });
        }):
    })
    .error(function(err){
        console.log(err);
    });
