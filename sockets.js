/* jshint node:true*/
module.exports = function(io){
    var Game = require('./models/game'),
        Q = require('Q');

    io.on('connection', function(socket) {
        var game, name, room;
        socket.on('join', function(data){
            Game.findById(data.game)
            .then(function(found){
                found.players.push({name: data.name, spy:false});
                return found.save();
            })
            .then(function(saved){
                game = saved;
                name = data.name;
                room = data.game;
                socket.join(data.game);
                io.to(room).emit('message', data.name + ' has joined' );
            });
        });

        socket.on('disconnect', function(){
            if(game){
                game.players = game.players.filter(function(el){return el.name !== name});
                game.save()
                .then(function(data){
                    console.log('disconnected', game);
                    io.to(room).emit('message', name + ' has disconnected');
                });
            }
        });
    //End 'on connection'
    });
};