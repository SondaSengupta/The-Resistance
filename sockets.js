/* jshint node:true*/
module.exports = function(io){
    var Game = require('./models/game'),
        _ = require('lodash'),
        mongoose = require('mongoose');

    io.on('connection', function(socket) {
        var name, room;
        socket.on('join', function(data){
            Game.findById(data.game)
            .then(function(found){
                if(!found){
                    socket.emit('message', 'No game exists');
                    return mongoose.Promise();
                }
                if(found.started){
                    socket.emit('message', 'game already started');
                    return mongoose.Promise();
                }
                found.players.push({name: data.name, spy:false});
                return found.save();
            })
            .then(function(saved){
                if(!saved){
                    socket.emit(
                        'message', 
                        'something went wrong. Either the room does' +
                        ' not exist or the game has already started'
                    );
                    return;
                }
                socket.join(data.game);
                name = data.name;
                room = data.game;
                io.to(data.game).emit('message', data.name + ' has joined' );
                //If all players have joined start the game
                if(saved.count === saved.players.length){
                    startGame(data.game);
                }
            });
        });

        function startGame(id){
            Game.findById(id)
            .then(function(found){
                var game = createGame(found.count);
                found.missions = game.missions;
                found.vote = game.vote;
                return found.save();
            })
            .then(function(found){
                found.started = true;
                rand = _.shuffle(_.range(found.count));
                for (var i = 0; i < found.spies; i++) {
                    found.players[rand[i]].spy = true;
                }
                for (var i = found.spies; i < found.count; i++) {
                    found.players[rand[i]].spy = false;
                };
                found.markModified('players');
                found.vote = [];
                found.markModified('vote');
                found.save(function(err, data){
                    io.in(id).emit('start_game');
                });
            });
        }

        socket.on('turn', function(data){
            Game.findById(data.game)
            .then(function(game){
                var i = _.findIndex(game.players, {name: data.name});
                var player = game.players[i];
                var names = _.pluck(game.players, 'name');
                var leader = i === game.leader;
                var mission = getFirstMission(game.missions);
                socket.emit('roles', {
                    names: names,
                    player: player,
                    leader: leader,
                    mission: mission
                });
            });
        });

        /*
        team: array of team member names,
        id: id of game
        */
        socket.on('propose_team', function(data){
            io.in(data.id).emit('message', 'what about this team? ' + data.team);
            io.in(data.id).emit('team_vote_request', {vote: data.team});
        });

        /*
        choice: true or false
        id: id of the game
        team: array of team names
        */
        socket.on('team_vote', function(vote){
            Game.findById(vote.id)
            .then(function(data){
                data.vote.push(vote.choice);
                data.markModified(vote);
                return data.save();
            })
            .then(function(data){
                if(data.vote.length === data.count)
                    tallyVotes(vote.id, 'team', vote.team);
            });
        });

        socket.on('mission_vote', function(data){
            Game.findById(data.id)
            .then(function(g){
                g.vote.push(data.choice);
                g.markModified(data);
                return g.save();
            })
            .then(function(g){
                console.log('voting', g.vote.length, data.mission);
                if(g.vote.length === data.mission.required)
                    tallyVotes(data.id, 'mission', data.mission);
            });
        });

        /*
        game: id of game
        type: string 'team' or 'mission'
        data: list of team members or mission object.
        */
        function tallyVotes (game, type, data) {
            if(type==='mission'){
                var result;
                Game.findById(game)
                .then(function(g){
                    var mission = getFirstMission(g.missions);
                    var nays = g.vote.reduce(function(sum, val){
                        var x = val === true ? 0 : 1;
                        return sum + x;
                    }, 0);
                    if(nays === 0 || (mission.double && nays < 2)){
                        result = 'success';
                        g.vote = [];
                        g.markModified('vote');
                        mission.completed = 'success';
                        g.markModified('missions');
                    }
                    else{
                        result = 'failure';
                        g.vote = [];
                        g.markModified('vote');
                        mission.completed = 'failure';
                        g.markModified('missions');
                    }
                    return g.save();
                })
                .then(function(g){
                    var successes, failures;
                    successes = failures = 0;
                    g.missions.forEach(function(val){
                        if(val.completed === 'success')
                            successes++;
                        if(val.completed === 'failure')
                            failures++;
                    });
                    console.log('fail', failures, 'success', successes);
                    if(failures > 2 || successes > 2){
                        io.in(game).emit('game_over', {successes: successes, failures: failures});
                    }
                    else{
                        g.leader = (g.leader+1)%g.count;
                        g.save()
                        .then(function(g){
                            io.in(game).emit('next_turn', {result: result});
                        });
                    }
                });
            }
            if(type==='team'){
                Game.findById(game)
                .then(function(g){
                    var mission = getFirstMission(g.missions);
                    console.log('first mission (team)', mission);
                    var yays = g.vote.reduce(function(sum, val){return sum + Number(val);});
                    if (yays > g.count/2 ){
                        g.vote = [];
                        g.markModified('vote');
                        g.save()
                        .then(function(){
                            io.in(game).emit('teamSuccess',{
                                team: data.vote,
                                mission: mission,
                                yays: yays,
                                nays: data.length - yays
                            });
                        });
                    }
                    else
                        failTeam(game, yays);
                });

                function failTeam(id, yays){
                    Game.findById(id)
                    .then(function(g){
                        g.vote = [];
                        g.markModified('vote');
                        g.leader = (g.leader+1)%g.count;
                        return g.save();
                    })
                    .then(function(g){
                        io.in(id).emit('next_turn_team', {success: yays, failure: g.count - yays});
                    });
                }
            }
        }



        socket.on('disconnect', function(){
            if(name){
                Game.findById(room)
                .then(function(data){
                    var game = data;
                    game.started = false;
                    game.players = game.players.filter(function(el){return el.name !== name});
                    return game.save();
                })
                .then(function(game){
                    io.to(room).emit('message', name + ' has disconnected');
                    // if(!game.players.length || game.started){
                    //     endGame(room);
                    // }
                });
            }
        });

        function endGame(game){
            var msg = 'Game has ended.';
            Game.findByIdAndRemove(game)
            .then(function(){
                io.to(game).emit('message', msg);
            });
        }
    //End 'on connection'
    });
};

function createGame(len){
    var Game = require('./models/game');
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
        started: false,
        vote: [],
    });
}

function getFirstMission(missions){
    for (var i = 0; i < missions.length; i++) {
        if (missions[i].completed === false)
            return missions[i];
    }
}