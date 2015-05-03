/*jshint node: true*/
var express = require('express'),
    app = express();

app.set('port', (process.env.PORT || 5000));

var server = require('http').createServer(app),
    io = require('socket.io')(server),
    mongoose = require('mongoose'),
    bodyParser = require('body-parser');

app.set('view engine', 'jade');
app.set('views', './views');

mongoose.connect('mongodb://cdehart:arstarst@ds031892.mongolab.com:31892/the-resistance');
// mongoose.connect('localhost:27017/theResistance1');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

require('./routes')(app);
require('./sockets')(io);

app.use(express.static(__dirname + '/public'));

server.listen(app.get('port'));