/* jshint node:true*/
module.exports = function(io){
    io.on('connection', function(socket) {
        console.log('connected');
        socket.on('click', function(){
            console.log('click');
        });
    });
};