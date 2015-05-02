var mongoose = require('mongoose');
var Schema   = mongoose.Schema;

var GameSchema = new Schema({
  leader: Number,
  length: Number,
  spies: Number,
  players: [],
  missions: [{}]
});


module.exports = mongoose.model('Game', GameSchema);