fromCategory('github-authors')
  .foreachStream()
  .when({
    $init: function(state, ev){
      return { commits: 0 }
    },
    CommitEvent: function(state, ev){
      state.commits += 1;
    }
  });
