fromStream('github-stream')
  .when({
  $init: function(state, ev){
    return { count : 0 };
  },
  PushEvent: function(state, ev){
    state.count += 1;
    var commits = ev.body.payload.commits;
    for (var i = 0; i < commits.length; i++){
      var commit = commits[i];
      var repo = ev.body.repo;
      emit('github-commits', 'CommitEvent', {
        commit: commit,
        repo: repo
      });
    }
  }
});



