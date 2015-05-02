/* jshint node:true*/
module.exports = function(app){
    var Game = require('./models/game'),
        _ = require('lodash');

    app.get('/', function(req, res){
        res.render('index');
    });

    app.post('/game', function(req, res){
        var game = createGame(req.body.num);
        game.save(function(err){
            if(!err){
                res.redirect('/game/'+ game._id);
            }
            else{
                console.log(err);
            }
        });
    });


    app.get('/game/:id', function(req, res){
        res.render('game');
    });

    app.get('/game/:id/play', function(req, res){
        //render the mobile screen for a game 
        res.render('play', { game: req.params.id});
    });

    function createGame(len){
        if (len<5||len>10){ return null; }
        var numOfMissions = [
            '2,3,2,3,3',
            '2,3,3,3,4',
            '2,3,3,4*,4',
            '3,4,4,5*,5',
            '3,4,4,5*,5',
            '3,4,4,5*,5'
        ];
        var missions = numOfMissions[len-5].split(',');
        var createMission = function(num){
            return {
                required: Number(num[0]),
                double: num.indexOf('*') !== -1,
                completed: false
            };
        };
        var spies = '2,2,3,3,3,4'.split(',');
        missions = missions.map(createMission);
        return new Game({
            spies: Number(spies[len-5]),
            count: len,
            players: [],
            missions: missions,
            leader: 0,
            started: false
        });
    }
};

