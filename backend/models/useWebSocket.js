const WebSocket = require('ws');
const { generateId, initializeGameState, broadcastTables, broadcastTable, startGameLogic, endGameLogic } = require('./gameLogic');

let tables = [];

const handleWebSocketConnection = (socket, io) => {
  console.log('WebSocket connected');

  // Send the initial tables state to the new connection
  socket.emit('tables_update', { tables });

  socket.on('join_table', (data) => {
    const table = tables.find(t => t.id === data.tableId);
    if (table && table.players.length < 4) {
      table.players.push(data.username);
      io.emit('tables_update', { tables });
      io.to(data.tableId).emit('table_update', { table });
    }
  });

  socket.on('leave_table', (data) => {
    const table = tables.find(t => t.id === data.tableId);
    if (table) {
      table.players = table.players.filter(player => player !== data.username);
      io.emit('tables_update', { tables });
      io.to(data.tableId).emit('table_update', { table });
    }
  });

  socket.on('disconnect', () => {
    console.log('WebSocket disconnected');
  });
};

module.exports = { handleWebSocketConnection };
