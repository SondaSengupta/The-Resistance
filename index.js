var express = require('express'),
    app = express(),
    mongoose = require('mongoose'),
    bodyParser = require('body-parser'),
    server = require('http').createServer(app),
    io = require('socket.io')(server);

app.set('port', (process.env.PORT || 5000));
app.set('view engine', 'jade');
app.set('views', './views');

mongoose.connect('localhost:27017/theResistance1');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

require('./routes')(app);
require('./sockets')(io);

app.use(express.static(__dirname + '/public'));

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});