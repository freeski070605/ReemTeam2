import { useEffect } from 'react';
import { io } from 'socket.io-client';

// Create socket instance
export const socket = io('http://localhost:5000', {
  transports: ['websocket', 'polling'],
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  timeout: 20000
});

export const useGameSocket = (socket, tableId, user, setGameState) => {
    useEffect(() => {
      if (!socket || !user) return;
  
      const handleConnect = () => {
        socket.emit('join_table', { tableId, username: user.username });
      };
  
      const handleGameUpdate = (newState) => {
        setGameState(prev => ({ ...prev, ...newState }));
      };

      const handleGameRestart = (data) => {
        console.log('Received game restart with data:', data);
        if (data.newGameState) {
            // Reset game state with new hands
            const newState = {
                ...data.newGameState,
                gameOver: false,
                hasDrawnCard: false,
                currentTurn: 0,
                winners: [],
                winType: null
            };
            setGameState(newState);
        }
    };
    

    
  
      socket.on('connect', handleConnect);
      socket.on('game_update', handleGameUpdate);
      socket.on('game_restart', (data) => {
        console.log('Received game restart data:', data);
        if (data.newGameState) {
            setGameState(data.newGameState);
        }
    });
          socket.on('player_ready', (data) => {
        if (data.requestRestart) {
            handleGameRestart(data);
        }
    });
      socket.on('error', console.error);
  
      return () => {
        socket.off('connect', handleConnect);
        socket.off('game_update', handleGameUpdate);
        socket.off('game_restart', handleGameRestart);
        socket.off('player_ready');
        socket.off('error');
      };
    }, [socket, tableId, user, setGameState]);
  };
  

export default useGameSocket;
