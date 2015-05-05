var fs = require("fs");
var zlib = require("zlib");
//var JSONStream = require("JSONStream");
var lineReader = require("line-reader");
var github = require('octonode');
var mongodb = require('mongodb');
var monk = require('monk');
var db = monk('localhost:27017/github_db')

var client = github.client(process.env.OAUTHTOKEN);


client.limit(function (err, left, max) {
  console.log(left); // 4999
  console.log(max);  // 5000
})

var arr = [];
var myData = [];
var state = 'notDone';

function getStars(username){
	console.log(username);

	var stars = 0;
	var repoCount = 0;
	var repos = [];
	var user  = {};


	user['login'] = username;
	user['repos'] = [];

	client.get('/users/' + username + '/repos', {}, function (err, status, body, headers) {

		for(i = 0; i < body.length; i++){

			var repoData = {}

			repoData['name'] = body[i].name;
			repoData['star_count'] = body[i].stargazers_count;
			repoData['watcher_count'] = body[i].watchers_count;
			repoData['fork_count'] = body[i].forks_count;

			user['repos'].push(repoData);
			stars += body[i].stargazers_count;
			repoCount += 1;

		}
		user['total_stars'] = stars;
		user['total_repos'] = repoCount;
		console.log(user);
		//console.log(myData);
	});
	setTimeout(printJSON, 2000);
}

function printJSON(){
	console.log(myData);
	var jsonstr = JSON.stringify(myData);
	console.log(jsonstr);
}

function contains(obj, array) {
    var i;
    for (i = 0; i < array.length; i++) {
        if (array[i].login === obj.login) {
            return true;
        }
    }

    return false;
}


function readLines(){
	lineReader.eachLine('small.json', function(line){

	if(line != ''){

	//console.log(line);

		var data = JSON.parse(line);

		data = data.actor;


		if(!contains(data, arr)){

			arr.push(data);
			getStars(data.login);
		}
	}
}).then(function(){return false; });
}

readLines();
