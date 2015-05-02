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
    console.log(game);
    var socket = io();
    $('#click').click(function(){
        console.log('click');
        socket.emit('click');
    });
}
