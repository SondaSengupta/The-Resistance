var express = require('express'),
    app = express(),
    mongoose = require('mongoose'),
    bodyParser = require('body-parser'),
    server = require('http').createServer(app),
    io = require('socket.io')(server);

app.set('view engine', 'jade');
app.set('views', './views');

mongoose.connect('localhost:27017/theResistance1');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

require('./routes')(app, io);

app.use(express.static(__dirname + '/public'));

server.listen(8000, function(){
  console.log('RESISTANCE ON PORT 8000');
});