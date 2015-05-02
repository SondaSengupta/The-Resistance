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
                found.started = true;
                rand = _.shuffle(_.range(found.count));
                for (var i = 0; i < found.spies; i++) {
                    found.players[rand[i]].spy = true;
                }
                for (var i = found.spies; i < found.count; i++) {
                    found.players[rand[i]].spy = false;
                };
                found.markModified('players');
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
                var mission = _.first(game.missions, {completed: false});
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
            io.in(data.id).emit('team_vote_request', data.team);
        });

        /*
        choice: true or false
        id: id of the game
        team: array of team names
        */
        socket.on('team_vote', function(vote){
            Game.findById(id)
            .then(function(data){
                data.vote.push(vote.choice);
                data.markModified(vote);
                return data.save();
            })
            .then(function(data){
                if(data.vote.length === data.count)
                    tallyVotes(data, 'team', vote.team);
            });
        });

        /*
        data: list of team members or ...
        game: id of game
        type: string 'team' or 'mission'
        */
        function tallyVotes (game, type, data) {
            if(type==='team'){
                Game.findById(game)
                .then(function(g){
                    var mission = _.first(g.missions, {completed: false});
                    var yays = data.reduce(function(sum, val){return sum + Number(val);});
                    if (yays > data.length/2 ){
                        io.in(game).emit('teamSuccess',{
                            team: data,
                            mission: mission
                        });
                    }
                    else
                        failTeam(game);
                });
            }
        }


        socket.on('disconnect', function(){
            if(name){
                Game.findById(room)
                .then(function(data){
                    game = data;
                    game.started = false;
                    game.players = game.players.filter(function(el){return el.name !== name});
                    return game.save();
                })
                .then(function(data){
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