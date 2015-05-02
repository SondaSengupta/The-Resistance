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

    var templ = _.template($('#roles').html());
    socket.on('roles', function(data){
        if(data.player.spy){
            toastr.warning('YOU ARE A SPY');
        }
        $game.html(templ(data));
    });

    //Team leader should submit by emitting a 'propose_team'

    function leaderDisplay(data){
    }

    function regularDisplay(data){
    }

    socket.on('message', function(msg){
        toastr.info(msg);
    });
}
