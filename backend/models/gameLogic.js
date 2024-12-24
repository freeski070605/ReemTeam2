const { v4: uuidv4 } = require('uuid');

const generateId = () => uuidv4();

const initializeGameState = (table) => {
  const shuffledDeck = shuffleDeck([...initialDeck]);
  const dealtHands = dealHands(shuffledDeck, table.players.length);

  table.gameState = {
    deck: shuffledDeck,
    playerHands: dealtHands,
    discardPile: [],
    currentTurn: 0,
    hasDrawnCard: false,
    gameOver: false,
    winner: null,
    playerSpreads: table.players.map(() => []),
    hasValidSpread: false,
    successfulSpreads: table.players.map(() => 0),
    hasValidHit: false,
    gameStarted: true,
    pot: 0
  };
};

const broadcastTables = (wsServer, tables) => {
  wsServer.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({ type: 'tables_update', tables }));
    }
  });
};

const broadcastTable = (wsServer, table) => {
  wsServer.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({ type: 'table_update', table }));
    }
  });
};

const startGameLogic = (wsServer, table) => {
  initializeGameState(table);
  broadcastTable(wsServer, table);
};

const endGameLogic = (wsServer, table) => {
  table.gameState = null;
  broadcastTable(wsServer, table);
};

const shuffleDeck = (deck) => {
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
};

const dealHands = (shuffledDeck, playerCount) => {
  const hands = Array.from({ length: playerCount }, () => []);
  for (let i = 0; i < 5; i++) {
    for (let j = 0; j < playerCount; j++) {
      if (shuffledDeck.length > 0) {
        hands[j].push(shuffledDeck.pop());
      }
    }
  }
  return hands;
};

const gameValidations = {
  canStartGame: (table) => {
      return table.players.length >= 2 && 
             table.players.every(player => player.chips >= table.stake);
  },
  
  canDrop: (player, hitCounter, currentTurn) => {
      return hitCounter[currentTurn] === 0 && !player.hasDrawnCard;
  },
  
  canSpread: (hand) => {
      // Existing spread validation logic
      return isValidSpread(hand);
  }
};


const initialDeck = [
  { rank: '2', suit: 'Hearts' }, { rank: '2', suit: 'Diamonds' },
  { rank: '2', suit: 'Clubs' }, { rank: '2', suit: 'Spades' },
  { rank: '3', suit: 'Hearts' }, { rank: '3', suit: 'Diamonds' },
  { rank: '3', suit: 'Clubs' }, { rank: '3', suit: 'Spades' },
  { rank: '4', suit: 'Hearts' }, { rank: '4', suit: 'Diamonds' },
  { rank: '4', suit: 'Clubs' }, { rank: '4', suit: 'Spades' },
  { rank: '5', suit: 'Hearts' }, { rank: '5', suit: 'Diamonds' },
  { rank: '5', suit: 'Clubs' }, { rank: '5', suit: 'Spades' },
  { rank: '6', suit: 'Hearts' }, { rank: '6', suit: 'Diamonds' },
  { rank: '6', suit: 'Clubs' }, { rank: '6', suit: 'Spades' },
  { rank: '7', suit: 'Hearts' }, { rank: '7', suit: 'Diamonds' },
  { rank: '7', suit: 'Clubs' }, { rank: '7', suit: 'Spades' },
  { rank: 'J', suit: 'Hearts' }, { rank: 'J', suit: 'Diamonds' },
  { rank: 'J', suit: 'Clubs' }, { rank: 'J', suit: 'Spades' },
  { rank: 'Q', suit: 'Hearts' }, { rank: 'Q', suit: 'Diamonds' },
  { rank: 'Q', suit: 'Clubs' }, { rank: 'Q', suit: 'Spades' },
  { rank: 'K', suit: 'Hearts' }, { rank: 'K', suit: 'Diamonds' },
  { rank: 'K', suit: 'Clubs' }, { rank: 'K', suit: 'Spades' },
  { rank: 'ace', suit: 'Hearts' }, { rank: 'ace', suit: 'Diamonds' },
  { rank: 'ace', suit: 'Clubs' }, { rank: 'ace', suit: 'Spades' }
];

module.exports = {
  generateId,
  initializeGameState,
  broadcastTables,
  broadcastTable,
  startGameLogic,
  endGameLogic
};
