const WebSocket = require('ws');
const { generateId, initializeGameState, broadcastTables, broadcastTable, startGameLogic, endGameLogic } = require('./gameLogic');

let tables = [];

const handleWebSocketConnection = (socket, io) => {
  console.log('WebSocket connected with ID:', socket.id);

  socket.on('connect_error', (error) => {
    console.log('Connection error:', error);
  });

  socket.on('connect', () => {
    console.log('Client connected successfully');
    socket.emit('tables_update', { tables });
  });

  socket.on('join_table', (data) => {
    console.log('Join table request:', data);
    const table = tables.find(t => t.id === data.tableId);
    if (table) {
        // Check if player already exists
        const playerExists = table.players.some(p => p.username === data.player.username);
        if (!playerExists && table.players.length < 4) {
            // Add the new player with their complete data
            table.players.push({
                username: data.player.username,
                chips: data.player.chips,
                isHuman: true
            });
            
            socket.join(data.tableId);
            io.to(data.tableId).emit('table_update', { table });
            io.emit('tables_update', { tables });
        }
    }
});



   // Add the new player_ready handler here
   socket.on('player_ready', ({ tableId, username, requestRestart }) => {
    const table = tables.find(t => t.id === tableId); // Use find instead of get
    if (!table) return;

    if (!table.readyPlayers) {
        table.readyPlayers = new Set();
    }
    table.readyPlayers.add(username);
    
    // Broadcast that a player is ready
    io.to(tableId).emit('player_ready_update', {
        readyPlayers: Array.from(table.readyPlayers)
    });
    
    if (table.readyPlayers.size === table.players.length) {
        table.readyPlayers.clear();
        const newGameState = {
            players: table.players,
            deck: shuffleDeck([...INITIAL_DECK]),
            playerHands: dealHands(shuffleDeck([...INITIAL_DECK]), table.players.length),
            currentTurn: 0,
            hasDrawnCard: false,
            gameStarted: true,
            gameOver: false
        };
        
        io.to(tableId).emit('game_restart', {
            newGameState
        });
    }
  });
};

module.exports = { handleWebSocketConnection };
