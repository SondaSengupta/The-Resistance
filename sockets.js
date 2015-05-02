/* jshint node:true*/
module.exports = function(io){
    io.on('connection', function(socket) {
        console.log('connected');
        socket.on('join', function(game){
            socket.join(game);
            io.to(game).emit('message', 'Hi there');
        });
    });
};