var mongoose = require('mongoose');
var Schema   = mongoose.Schema;

var GameSchema = new Schema({
  started: Boolean,
  leader: Number,
  count: Number,
  spies: Number,
  players: [],
  missions: [{}]
});


module.exports = mongoose.model('Game', GameSchema);