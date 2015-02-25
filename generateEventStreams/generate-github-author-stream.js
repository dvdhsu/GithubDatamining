fromStream('github-commits')
.when({
    "$init": function(state, ev) {
        return { }
    },
    "CommitEvent": function(state, ev) {
        var author = ev.body.commit.author;
        linkTo('github-authors-' + author.email, ev);
    }
});
