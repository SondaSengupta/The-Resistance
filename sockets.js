/* jshint node:true*/
module.exports = function(io){
    var Game = require('./models/game'),
        _ = require('lodash'),
        mongoose = require('mongoose');

    io.on('connection', function(socket) {
        var game, name, room;
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
                game = saved;
                name = data.name;
                room = data.game;
                socket.join(data.game);
                io.to(room).emit('message', data.name + ' has joined' );
                //If all players have joined start the game
                if(game.count === game.players.length){
                    startGame();
                }
            });
        });

        function startGame(){
            Game.findById(room)
            .then(function(found){
                found.started = true;
                rand = _.shuffle(_.range(found.count));
                for (var i = 0; i < found.spies; i++) {
                    found.players[rand[i]].spy = true;
                }
                return found.save();
            })
            .then(function(data){
                console.log(data)
            });
        }

        socket.on('disconnect', function(){
            console.log('disconnect', name, room);
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