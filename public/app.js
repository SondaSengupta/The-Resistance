$(function(){
    var qr = document.getElementById("qrcode")
    if(qr){
        new QRCode(qr, location.href + '/play');
    }
    var game = $('#game').data('game');
    if (game) {
        run(game);
    }
});

function run(game){
    var socket = io();
    socket.emit('join', game);
    socket.on('message', function(){
        console.log(arguments);
    });
}
