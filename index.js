var express = require('express'),
    app = express(),
    server = require('http').createServer(app),
    io = require('socket.io')(server);

app.set('view engine', 'jade');
app.set('views', './views');

app.use(require('./routes'));

app.use(express.static(__dirname + '/public'));

server.listen(8000, function(){
  console.log('RESISTANCE ON PORT 8000');
});

io.on('connection', function(socket){
    console.log('Connected');
});
