import React, { useEffect, useState, useContext, createContext, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import GameBoard from './Gameboard';
import AiPlayer from './AiPlayerHand';
import { UserContext } from './UserContext';
import ChipSystem from '../utils/ChipSystem';
import { GameErrorBoundary } from './GameErrorBoundary';
import { AIPlayerProvider } from './AiContext';
import './Table.css';
import { INITIAL_DECK, shuffleDeck, dealHands } from '../utils/gameUtils';
import { socket } from '../hooks/useGameSocket';

export const GameContext = createContext();

const TableComponent = () => {
  const { tableId } = useParams();
  const navigate = useNavigate();
  const { user, updateUserChips } = useContext(UserContext);
  const [gameState, setGameState] = useState({
    players: [],
    stake: 0,
    deck: [...INITIAL_DECK],
    discardPile: [],
    currentTurn: 0,
    playerHands: [],
    playerSpreads: [],
    hasDrawnCard: false,
    gameOver: false,
    isLoading: true,
    error: null
  });

  const handleGameRestart = useCallback(() => {
    console.log('Game restart triggered');
    const newDeck = shuffleDeck([...INITIAL_DECK]);
    const initialHands = dealHands(newDeck, gameState.players.length);
    
    const newState = {
      ...gameState,
      deck: newDeck.slice(initialHands.flat().length),
      playerHands: initialHands,
      playerSpreads: Array(gameState.players.length).fill().map(() => []),
      discardPile: [],
      currentTurn: 0,
      hasDrawnCard: false,
      gameOver: false,
      gameStarted: true,
      isInitialized: true
    };
    
    setGameState(newState);
    localStorage.setItem(`gameState_${tableId}`, JSON.stringify(newState));
  }, [gameState.players.length, tableId]);

  useEffect(() => {
    if (!user || !tableId) return;

    const fetchTableDetails = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:5000/tables/${tableId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) throw new Error('Failed to fetch table details');
        const data = await response.json();
        
        // Create user player object
        const userPlayer = {
          username: user.username,
          chips: user.chips,
          isHuman: true
        };

        // Ensure user is in players list
        let tablePlayers = data.table.players;
        if (!tablePlayers.some(p => p.username === user.username)) {
          tablePlayers = [userPlayer, ...tablePlayers];
        }

        // Add AI player if needed
        if (tablePlayers.length < 2) {
          tablePlayers.push(new AiPlayer('AI Player'));
        }

        // Emit join_table event
        socket.emit('join_table', { 
          tableId, 
          player: userPlayer
        });

        const newDeck = shuffleDeck([...INITIAL_DECK]);
        const initialHands = dealHands(newDeck, tablePlayers.length);

        setGameState(prevState => ({
          ...prevState,
          players: tablePlayers,
          stake: data.table.stake,
          deck: newDeck.slice(initialHands.flat().length),
          playerHands: initialHands,
          playerSpreads: Array(tablePlayers.length).fill().map(() => []),
          isLoading: false,
          gameStarted: true,
          isInitialized: true
        }));

      } catch (error) {
        console.error('Error fetching table details:', error);
        setGameState(prevState => ({
          ...prevState,
          error: error.message,
          isLoading: false
        }));
      }
    };

    fetchTableDetails();

    const handleGameUpdate = (newState) => {
      console.log('Received game update:', newState);
      setGameState(prevState => ({...prevState, ...newState}));
    };

    socket.on('game_update', handleGameUpdate);
    socket.on('game_restart', handleGameRestart);

    return () => {
      socket.off('game_update', handleGameUpdate);
      socket.off('game_restart', handleGameRestart);
    };
  }, [user, tableId, handleGameRestart]);

  const handleStateUpdate = useCallback((newState) => {
    setGameState(prev => ({
      ...prev,
      ...newState,
      timestamp: Date.now()
    }));
  }, []);

  const leaveTable = async () => {
    try {
      await fetch(`http://localhost:5000/tables/${tableId}/leave`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ tableId, username: user.username }),
      });
      navigate('/lobby');
    } catch (error) {
      console.error('Error leaving table:', error);
    }
  };

  if (gameState.isLoading) return <div>Loading game...</div>;
  if (gameState.error) return <div>Error: {gameState.error}</div>;

  return (
    <GameContext.Provider value={{ gameState, setGameState }}>
      <div className="table-container mt-4">
        <h2 className="table-header mb-4">{gameState.stake}$ Table</h2>
        <button className="leave-button" onClick={leaveTable}>Leave Table</button>

        {gameState.players && gameState.players.length > 0 && (
          <AIPlayerProvider>
            <GameErrorBoundary>
              <GameBoard
                tableId={tableId}
                gameState={gameState}
                setGameState={handleStateUpdate}
                socket={socket}
                user={user}
                onGameRestart={handleGameRestart}
              />
            </GameErrorBoundary>
          </AIPlayerProvider>
        )}
      </div>
    </GameContext.Provider>
  );
};

export default TableComponent;
