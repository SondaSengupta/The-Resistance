var mongoose = require('mongoose');
var Schema   = mongoose.Schema;

var GameSchema = new Schema({
  length: Number,
  players: [],
  missions: [{}]
});


module.exports = mongoose.model('Game', GameSchema);