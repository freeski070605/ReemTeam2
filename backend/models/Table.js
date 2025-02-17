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

// First, define the preset tables configuration
const PRESET_TABLES = [
  { name: "Table 1", stake: 1 },
  { name: "Table 2", stake: 1 },
  { name: "Table 3", stake: 5 },
  { name: "Table 4", stake: 5 },
  { name: "Table 5", stake: 10 },
  { name: "Table 6", stake: 10 },
  { name: "Table 7", stake: 20 },
  { name: "Table 8", stake: 20 },
  { name: "Table 9", stake: 50 },
  { name: "Table 10", stake: 50 },
  { name: "Table 11", stake: 100 },
  { name: "Table 12", stake: 100 }
];


const Table = mongoose.model('Table', tableSchema);

module.exports = { Table, PRESET_TABLES };

