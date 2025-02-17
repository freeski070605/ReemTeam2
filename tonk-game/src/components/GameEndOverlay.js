import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { shuffleDeck, dealHands, INITIAL_DECK } from '../utils/gameUtils';
import './GameEndOverlay.css';

const ScoreDisplay = ({ player, index, score, isWinner }) => (
    <div className={`player-score ${isWinner ? 'winner' : ''}`}>
        <span className="player-name">
            {player.username} {isWinner && '🏆'}
        </span>
        <span className="points">Points: {score}</span>
        {isWinner && <span className="winner-label">Winner!</span>}
    </div>
);

const GameEndOverlay = ({ 
    winners = [], 
    players = [], 
    playerHands = [],
    winType,
    caught,
    stake,
    gameState,
    setGameState,
    tableId,
    onGameRestart,
    socket
}) => {
    const [countdown, setCountdown] = useState(15);
    const [readyPlayers, setReadyPlayers] = useState(new Set());
    const navigate = useNavigate();
   
    const handlePlayAgain = useCallback(() => {
        const newDeck = shuffleDeck([...INITIAL_DECK]);
        const initialHands = dealHands(newDeck, players.length);
        
        const freshState = {
            players: gameState.players,
            deck: newDeck,
            playerHands: initialHands,
            playerSpreads: Array(players.length).fill().map(() => []),
            discardPile: [],
            currentTurn: 0,
            hasDrawnCard: false,
            gameOver: false,
            gameStarted: true,
            winners: [],
            winType: null,
            timestamp: Date.now(),
            isInitialized: true
        };

        localStorage.removeItem(`gameState_${tableId}`);
        setGameState(freshState);
        
        if (socket) {
            socket.emit('game_restart', { 
                tableId, 
                newGameState: freshState 
            });
        }

        setGameState(prev => ({
            ...freshState,
            gameOver: false,
            isInitialized: true
        }));
        window.location.reload();
    }, [gameState.players, players.length, setGameState, socket, tableId]);

    useEffect(() => {
        const timer = setInterval(() => {
            setCountdown(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    handlePlayAgain();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [handlePlayAgain]);

    const getWinMessage = () => {
        const winnerNames = winners
            .map(index => players[index]?.username || 'AI Player')
            .join(', ');

        const baseStake = Number(stake);
        const potSize = baseStake * players.length;

        switch(winType) {
            case 'DROP_CAUGHT':
                return `Drop Caught! ${winnerNames} wins ${baseStake * 2} chips from the dropper!`;
            case 'DROP_WIN':
                return `Successful Drop by ${winnerNames}! Wins ${potSize} chips`;
            case 'REEM':
                return `REEM! ${winnerNames} wins ${potSize * 2} chips with two spreads!`;
            case 'STOCK_EMPTY':
                const isMultipleWinners = winners.length > 1;
                return `Deck Empty - ${winnerNames} ${isMultipleWinners ? 'tie' : 'wins'} with lowest points! ${isMultipleWinners ? `Split pot: ${potSize / winners.length} chips each` : `Wins ${potSize} chips`}`;
            case 'REGULAR_WIN':
                return `${winnerNames} wins ${potSize} chips by going out first!`;
            default:
                return `${winnerNames} wins ${potSize} chips!`;
        }
    };

    const getPlayerScore = (index) => {
        return gameState?.roundScores?.[index] ?? 0;
    };

    const handleLeaveTable = async () => {
        try {
            await fetch(`http://localhost:5000/tables/${tableId}/leave`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    tableId, 
                    username: players[0]?.username 
                }),
            });
            navigate('/lobby');
        } catch (error) {
            console.error('Error leaving table:', error);
        }
    };

    return (
        <div className="game-end-overlay">
            <div className="game-end-content">
                <h2 className="win-message">{getWinMessage()}</h2>
                
                <div className="final-scores">
                    <h3>Final Scores</h3>
                    {players.map((player, index) => (
                        <ScoreDisplay
                            key={player.username}
                            player={player}
                            index={index}
                            score={getPlayerScore(index)}
                            isWinner={winners.includes(index)}
                        />
                    ))}
                </div>

                <div className="stake-info">
                    <h3>Pot Details</h3>
                    <p>Table Stake: {stake} chips</p>
                    <p>Total Pot: {stake * players.length} chips</p>
                    {winType === 'REEM' && <p>REEM Bonus: Double pot!</p>}
                    {winType === 'DROP_CAUGHT' && <p>Drop Penalty: Double stake from dropper</p>}
                </div>

                <div className="action-buttons">
                    <button 
                        className="new-game-btn"
                        onClick={handlePlayAgain}
                        disabled={readyPlayers.has(players[0]?.username)}
                    >
                        Play Again ({countdown}s)
                    </button>
                    <button 
                        className="leave-table"
                        onClick={handleLeaveTable}
                    >
                        Leave Table
                    </button>
                </div>

                {readyPlayers.size > 0 && (
                    <div className="ready-players">
                        <p>Ready Players: {Array.from(readyPlayers).join(', ')}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default GameEndOverlay;
