var swearwords = "anal anus arse ass ballsack balls bastard bitch biatch bloody blowjob blow job bollock bollok boner boob bugger bum butt buttplug clitoris cock coon crap cunt damn dick dildo dyke fag feck fellate fellatio felching fuck fudgepacker fudge packer flange Goddamn God damn hell homo jerk jizz knobend knob labia lmao lmfao muff nigger nigga omg penis piss poop prick pube pussy queer scrotum sex shit sh1t slut smegma spunk tit tosser turd twat vagina wank whore wtf".split(' ');
fromStream('github-commits')
.when({
    "$init": function(state, ev) {
        return { }
    },
    "CommitEvent": function(state, ev) {
        var language = ev.body.repo.language

        if (!state[language])
            state[language] = { count: 0, total: 0 }

        var languageState = state[language];
        languageState.total += 1;

        for (var i = 0 ; i < swearwords.length; i++) {
            var curse = swearwords[i];
            if(ev.body.commit.message.indexOf(curse) >= 0){
                languageState.count += 1;
                break;
            }
        }
        return state;
    }
});
