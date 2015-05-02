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
                console.log('on turn', game.players);
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