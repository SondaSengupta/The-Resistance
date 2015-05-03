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
    var roleTemp, voteTemp, teamTemp;
    var $game = $('#game');
    var socket = io();
    var name;
    $.get('/vote.html')
    .then(function(data){
        voteTemp = _.template(data);
        return $.get('/team.html');
    })
    .then(function(data){
        teamTemp = _.template(data);
        return $.get('/roles.html');
    })
    .then(function(data){
        roleTemp = _.template(data);
        //Join the game
        $('#join').click(function(){
            name = $('#name').val();
            socket.emit('join', {
                name: name,
                game: game
            });
            $game.html($('<p>').text('waiting for players to join...'));
        });
    });


    socket.on('start_game', turn);

    function turn(){
        socket.emit('turn', {name: name, game:game});
        $game.html('');
    }

    socket.on('roles', function(data){
        if(data.player.spy){
            var spies = data.spies.reduce(function(sum, el){return sum + ' and ' +  el.name;}, '');
            $('#spy').text(
                'You are a spy. You will need to destroy the resistance.' + 
                'The spy(s) are' + spies
            );
        }
        $game.html(roleTemp(data));
        $('#selectTeam').click(function(){
            var $checked = $('.teamNames:checked');
            if($checked.length !== data.mission.required){
                toastr.warning('You must select ' +
                    data.mission.required + 
                    ' candidates for this mission.');
                return false;
            }
            var team = [];
            $checked.each(function(){
                team.push($(this).val());
            });
            socket.emit('propose_team', {team:team, id: game});
        });
    });

    socket.on('team_vote_request', function(data){
        $game.html(voteTemp(data));
        $('.teamvote').click(function(){
            $('.teamvote').off();
            choice = $(this).data('value') === 'yay'
            socket.emit('team_vote', {
                choice: choice,
                id: game,
                team: data
            });
            $game.html('');
        });
    });

    socket.on('teamSuccess', function(data){
        console.log(data);
        if(data.team.indexOf(name) !== -1)
            data.chosen = true;
        else
            data.chosen = false;
        $game.html(teamTemp(data));
        $('.vote').click(function(){
            $('.vote').off();
            choice = $(this).data('value') === 'success';
            socket.emit('mission_vote', {
                choice: choice,
                id: game,
                mission: data.mission
            });
            $game.html('');
        });
    });

    socket.on('next_turn', function(data){
        toastr.info('The mission was a ' + data.result);
        turn();
    });

    socket.on('next_turn_team', function(data){
        toastr.info('The mission was voted down. ' + 
                    data.success + ' yays to ' +
                    data.failure + ' nays.');
        turn();
    });

    socket.on('game_over', function(data){
        var msg;
        if(data.successes > data.failures){
            msg = 'YOU WON! YOU KILLED THE GOVERNMENT'
        }
        else{
            msg = 'YOU LOST. THE GOVERNMENT KILLED YOU!'
        }
        $game.html($('<h1>').text(msg));
    });

    socket.on('message', function(msg){
        toastr.info(msg);
    });
}
