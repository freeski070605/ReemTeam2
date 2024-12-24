const mongoose = require('mongoose');

const tableSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  players: {
    type: [{
      username: String,
      chips: Number
    }],
    validate: {
      validator: function(v) {
        return v.length <= 4; // Maximum of 4 players
      },
      message: props => `${props.value.length} exceeds the limit of 4 players!`
    },
    default: []
  },
  stake: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['waiting', 'in_progress', 'completed'],
    default: 'waiting'
  },
  date: {
    type: Date,
    default: Date.now
  }
});

const Table = mongoose.model('Table', tableSchema);

module.exports = Table;