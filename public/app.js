$(function(){
    var qr = document.getElementById("qrcode");
    if(qr){
        new QRCode(qr, location.href + '/play');
    }
    var game = $('#game').data('game');
    if (game) {
        run(game);
    }
});

function run(game){
    var $game = $('#game');
    var socket = io();
    var name;
    //Join the game
    $('#join').click(function(){
        name = $('#name').val();
        socket.emit('join', {
            name: name,
            game: game
        });
        $game.html($('<p>').text('waiting for players to join...'));
    });

    socket.on('start_game', turn);

    function turn(){
        socket.emit('turn', {name: name, game:game});
        $game.html('');
    }

    socket.on('message', function(msg){
        console.log(msg);
    });
}
