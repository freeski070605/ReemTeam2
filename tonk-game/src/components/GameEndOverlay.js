  import React, { useState, useEffect } from 'react';
  import { useNavigate } from 'react-router-dom';

  const GameEndOverlay = ({ message, onNewGame, players, onLeaveTable }) => {
    const [countdown, setCountdown] = useState(15);
    const [readyPlayers, setReadyPlayers] = useState(new Set());
    const navigate = useNavigate();

    useEffect(() => {
      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            onNewGame();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }, []);

    const handlePlayerReady = (playerId) => {
      setReadyPlayers(prev => {
        const updated = new Set(prev);
        updated.add(playerId);
        if (updated.size === players.length) {
          onNewGame();
        }
        return updated;
      });
    };

    const handleLeaveTable = (username) => {
      onLeaveTable(username);
      navigate('/lobby'); // Navigate back to lobby
    };

    return (
      <div className="game-end-overlay">
        <div className="game-end-content">
          <h2>{message}</h2>
          <div className="player-actions">
            {players.map(player => (
              <div key={player.username} className="player-action-row">
                <span className="player-name">{player.username}</span>
                <div className="action-buttons">
                  <button 
                    className={`ready-btn ${readyPlayers.has(player.username) ? 'ready' : ''}`}
                    onClick={() => handlePlayerReady(player.username)}
                  >
                    {readyPlayers.has(player.username) ? 'Ready ✓' : 'Ready'}
                  </button>
                  <button 
                    className="leave-btn"
                    onClick={() => handleLeaveTable(player.username)}
                  >
                    Leave Table
                  </button>
                </div>
              </div>
            ))}
          </div>
          <p className="countdown">Next hand in: {countdown} seconds</p>
          <p className="ready-prompt">Click ready to start sooner!</p>
        </div>
      </div>
    );
  };

  export default GameEndOverlay;