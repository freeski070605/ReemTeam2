import React, { useEffect, useCallback, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import { useAiConfig } from '../hooks/useAiConfig';
import useAiLogic from '../hooks/useAiLogic';
import {useGameLogic} from '../hooks/useGameLogic';
import { useGameSocket } from '../hooks/useGameSocket';
import useGameState from '../hooks/useGameState';
import { PLAYER_POSITIONS, CARD_VALUES } from './gameConstants';
import { 
    handleSpread as handleSpreadUtil,
    handleHit as handleHitUtil,
    findValidHitForAi,
    isBeneficialCard,
    findLeastValuableCard,
    shouldAiDrop,
    isValidSpread,
    INITIAL_DECK,
    shuffleDeck,
    dealHands,
    handleDrawCard as handleDrawCardUtil,
    handleDrawDiscard as handleDrawDiscardUtil,
    handleNewGame as handleNewGameUtil,
    findValidHitTarget,
    updateRoundScores,
    isValidHit
} from '../utils/gameUtils';

import PlayerSection from './PlayerSection';
import CenterGameArea from './CenterGameArea';
import GameEndOverlay from './GameEndOverlay';
import { LoadingState } from './LoadingState';
import { GameErrorBoundary } from './GameErrorBoundary';
import ChipSystem from '../utils/ChipSystem';

const defaultGameState = {
    players: [],
    playerHands: [],
    playerSpreads: [],
    deck: [...INITIAL_DECK],
    discardPile: [],
    currentTurn: 0,
    hasDrawnCard: false,
    gameStarted: false,
    stake: 0,
    roundScores: [],
    gameOver: false,
    gameEndMessage: '',
    turnTimeLeft: 30,
    isInitialized: false
};

const GameBoard = ({ tableId, gameState: initialGameState, setGameState, socket, user, onGameRestart }) => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [isInitialized, setIsInitialized] = useState(false);
    const [gameError, setGameError] = useState(null);
    const [loadingStates, setLoadingStates] = useState({
        initialization: false,
        cardDraw: false,
        spreadAction: false
    });

    const [gameState, setLocalGameState, handleGameEnd, handleRestart] = useGameState(initialGameState, tableId);
    const { handlePlayerAction } = useGameLogic(gameState, setLocalGameState);
    const { handleGameStart } = useGameLogic(initialGameState, setGameState);
    const [selectedCard, setSelectedCard] = useState(null);
    const [hitMode, setHitMode] = useState(false);
    const [hitModeMessage, setHitModeMessage] = useState('');
    const [hitStage, setHitStage] = useState(0); // 0: not in hit mode, 1: select card, 2: select spread, 3: select discard



    useGameSocket(socket, tableId, user, setGameState);

    const handleSpread = useCallback((cards) => {
        if (isValidSpread(cards)) {
            handlePlayerAction('SPREAD', { cards });
            
            // Check for REEM (two spreads)
            const currentPlayerSpreads = gameState.playerSpreads[gameState.currentTurn] || [];
            if (currentPlayerSpreads.length === 2) {
                handleGameEnd(gameState, [gameState.currentTurn], 'REEM');
            }
        }
    }, [handlePlayerAction, gameState, handleGameEnd]);
    
    const handleHit = useCallback((cardIndex, position, spreadIndex) => {
        handlePlayerAction('HIT', { 
            cardIndex, 
            targetIndex: typeof position === 'number' ? position : PLAYER_POSITIONS.indexOf(position), 
            spreadIndex 
        });
        
        // Check if player has no cards left after hit
        const currentPlayerHand = gameState.playerHands[gameState.currentTurn];
        if (currentPlayerHand.length === 1) { // Will be 0 after the hit
            handleGameEnd(gameState, [gameState.currentTurn], 'Stock Empty');
        }
        
        setHitMode(false);
        setSelectedCard(null);
    }, [handlePlayerAction, gameState, handleGameEnd]);
    
    
    
    
    
    
    
    
    

    
    
    
    
    
    
    
      
    

    const handleDrop = useCallback(() => {
        if (!gameState.hasDrawnCard && gameState.currentTurn >= 0) {
            handlePlayerAction('DROP');
            
            const points = gameState.playerHands.map(hand => 
                hand.reduce((total, card) => total + CARD_VALUES[card.rank], 0)
            );
            
            const minPoints = Math.min(...points);
            const dropperPoints = points[gameState.currentTurn];
            const winners = points
                .map((points, index) => ({points, index}))
                .filter(({points}) => points === minPoints)
                .map(({index}) => index);
            
            const isCaught = dropperPoints > minPoints;
            
            // Pass the correct win type to handleGameEnd
            handleGameEnd(gameState, winners, isCaught ? 'DROP_CAUGHT' : 'DROP_WIN');
        }
    }, [gameState, handlePlayerAction, handleGameEnd]);
    

    const handleCardClick = useCallback((cardIndex) => {
        if (gameState.hasDrawnCard && gameState.currentTurn === 0) {
            handlePlayerAction('DISCARD', { cardIndex });
        }
    }, [gameState.hasDrawnCard, gameState.currentTurn, handlePlayerAction]);

    const handleCardSelect = (cardIndex) => {
        if (hitMode && hitStage === 1) {
            setSelectedCard(cardIndex);
            setHitModeMessage('Now select a target spread to hit');
            setHitStage(2);
        } else if (hitStage === 3) {
            handleDiscard(cardIndex);
            setHitMode(false);
            setHitStage(0);
            setHitModeMessage('');
        }
    };
    
    const handleSpreadSelect = (targetIndex, spreadIndex) => {
        console.log('Spread select:', { hitMode, selectedCard, hitStage });
        if (hitMode && selectedCard !== null && hitStage === 2) {
            handleHit(selectedCard, targetIndex, spreadIndex);
            console.log('Setting stage 3 message');
            setHitModeMessage('Select a card to discard');
            setHitStage(3);
        }
    };
    

    
    // Add toggle for hit mode
    const toggleHitMode = () => {
        console.log('Toggling hit mode');
        setHitMode(prev => {
            if (!prev) {
                setHitModeMessage('Select a card from your hand to hit with');
                setHitStage(1);
            } else {
                setHitModeMessage('');
                setHitStage(0);
            }
            return !prev;
        });
        setSelectedCard(null);
    };

    


    const handleDrawCard = useCallback(() => {
        if (!gameState.hasDrawnCard && gameState.deck?.length > 0) {
            handlePlayerAction('DRAW_CARD');
        } else if (gameState.deck?.length === 0 && !gameState.gameOver) {
            setGameState(prev => ({
                ...prev,
                gameOver: true,
                winType: 'STOCK_EMPTY'
            }));
        }
    }, [gameState.hasDrawnCard, gameState.deck?.length, gameState.gameOver, handlePlayerAction, setGameState]);
    
    const handleDrawDiscard = useCallback(() => {
        if (!gameState.hasDrawnCard && gameState.discardPile?.length > 0) {
            handlePlayerAction('DRAW_DISCARD');
        }
    }, [gameState.hasDrawnCard, gameState.discardPile?.length, handlePlayerAction]);

    const handleDiscard = useCallback((cardIndex) => {
        if (gameState.hasDrawnCard && gameState.currentTurn >= 0) {
            const updatedHands = [...gameState.playerHands];
            const discardedCard = updatedHands[gameState.currentTurn][cardIndex];
            
            // Remove card from hand
            updatedHands[gameState.currentTurn] = updatedHands[gameState.currentTurn].filter((_, i) => i !== cardIndex);
            
            setGameState(prev => ({
                ...prev,
                playerHands: updatedHands,
                discardPile: [...prev.discardPile, discardedCard],
                hasDrawnCard: false,
                currentTurn: (prev.currentTurn + 1) % prev.players.length
            }));
    
            // Emit the discard action to other players
            socket.emit('game_action', {
                type: 'DISCARD',
                tableId,
                cardIndex,
                card: discardedCard
            });
        }
    }, [gameState.hasDrawnCard, gameState.currentTurn, gameState.playerHands, setGameState, socket, tableId]);
    

    const handleAdvanceTurn = useCallback(() => {
        setGameState(prev => {
            let nextTurn = (prev.currentTurn + 1) % prev.players.length;
            
            while (prev.penalties?.[nextTurn] > 0) {
                prev.penalties[nextTurn] -= 1;
                nextTurn = (nextTurn + 1) % prev.players.length;
            }
            
            return {
                ...prev,
                currentTurn: nextTurn,
                hasDrawnCard: false,
            };
        });
    }, [setGameState]);

    const { aiProcessing } = useAiLogic({
        gameState,
        setGameState: setLocalGameState,
        players: gameState?.players || [],
        currentTurn: gameState?.currentTurn || 0,
        playerHands: gameState?.playerHands || [],
        playerSpreads: gameState?.playerSpreads || [],
        discardPile: gameState?.discardPile || [],
        gameStarted: gameState?.gameStarted || false,
        stake: gameState?.stake || 0,
        setStake: (newStake) => setGameState(prev => ({
            ...prev,
            stake: typeof newStake === 'function' ? newStake(prev.stake) : newStake
        }))
    });

    const playerScores = useMemo(() => 
        gameState?.playerHands?.map(hand => 
            (hand || []).reduce((total, card) => {
                if (!card || !card.rank) return total;
                return total + (CARD_VALUES[card.rank] || 0);
            }, 0)
        ) || [],
        [gameState?.playerHands]
    );

    useEffect(() => {
        if (!isInitialized && gameState?.players?.length > 0) {
            try {
                setLoadingStates(prev => ({ ...prev, initialization: true }));
                const newDeck = shuffleDeck([...INITIAL_DECK]);
                const initialHands = dealHands(newDeck, gameState.players.length);
            
            // Calculate the correct remaining deck
            const cardsDealt = gameState.players.length * 5;
            const remainingDeck = newDeck.slice(cardsDealt);

                setGameState(prev => ({
                    ...prev,
                    deck:  remainingDeck, // Explicitly account for 5 cards per player
                    playerHands: initialHands,
                    playerSpreads: Array(gameState.players.length).fill().map(() => []),
                    gameStarted: true,
                    isInitialized: true,
                    currentTurn: 0,
                    hasDrawnCard: false
                }));
                setIsInitialized(true);
                console.log('Deck count after deal:', newDeck);
                console.log('Verification:', {
                    initialDeckSize: INITIAL_DECK.length,
                    dealtCards: initialHands.flat().length,
                    remainingCards: newDeck.length
                });
                 
                ChipSystem.handleGameStart(gameState);
                setLoading(false);
            } catch (error) {
                console.error('Initialization error:', error);
                setGameError('Failed to initialize game');
            } finally {
                setLoadingStates(prev => ({ ...prev, initialization: false }));
            }
        }
    }, [gameState?.players, isInitialized, setGameState, handleGameStart]);

    const handleRestartGame = useCallback(() => {
        const newState = handleRestart();
        socket.emit('game_restart', { tableId, newGameState: newState });
    }, [handleRestart, socket, tableId]);
    

    useEffect(() => {
        if (gameState?.deck?.length === 0 && gameState?.gameStarted && !gameState?.gameOver) {
            const finalScores = gameState.playerHands.map(hand => 
                hand.reduce((total, card) => total + CARD_VALUES[card.rank], 0)
            );
            
            const minScore = Math.min(...finalScores);
            const winners = finalScores
                .map((score, index) => ({score, index}))
                .filter(({score}) => score === minScore)
                .map(({index}) => index);

            handlePlayerAction('STOCK_EMPTY', { winners, scores: finalScores });
        }
    }, [gameState?.deck?.length, gameState?.gameStarted, gameState?.gameOver, handlePlayerAction]);

    const getPlayerPosition = (playerIndex, totalPlayers) => {
        if (totalPlayers === 1) return 'bottom';
        if (totalPlayers === 2) return ['bottom', 'top'][playerIndex];
        if (totalPlayers === 3) return ['bottom', 'left', 'right'][playerIndex];
        return ['bottom', 'left', 'top', 'right'][playerIndex];
    };
    

    if (loading) {
        return <LoadingState />;
    }

    if (gameError) {
        return <div className="error-message">{gameError}</div>;
    }
    
    

    return (
        <GameErrorBoundary>
            <div className="game-container">
                {hitMode && hitModeMessage && (
                    <div className="hit-mode-message mobile-message">
                        <div className="hit-stage-indicator">
                            Step {hitStage}/3: {hitModeMessage}
                        </div>
                    </div>
                )}
                <div className=" game-board">
                        <PlayerSection
                            key={gameState?.players[1]?.username || 1}
                            position={PLAYER_POSITIONS[1]}
                            className={`player player-top  ${gameState.currentTurn === 2 ? 'active' : ''}`}
                            player={gameState?.players[1]}
                            hand={gameState.playerHands[1] || []}
                            spreads={gameState.playerSpreads[1] || []}
                            isCurrentTurn={gameState.currentTurn === 1}
                            hasDrawnCard={gameState.hasDrawnCard}
                            isHidden={!gameState.gameOver}
                            onDrop={handleDrop}
                            hitMode={hitMode}
                            selectedCard={selectedCard}
                            onCardSelect={handleCardSelect}
                            onHit={handleHit}
                            onToggleHitMode={toggleHitMode}
                            onSpread={handleSpread}
                            canHit={true}
                            canDrop={!gameState.hasDrawnCard && gameState.currentTurn === 1}
                            isProcessing={gameState.currentTurn === 1 && aiProcessing}
                            isLoading={loadingStates.spreadAction}
                            gameState={gameState}
                            isActive={hitMode && selectedCard !== null}
                            setGameState={setGameState}
                            onActionComplete={(action) => {
                                console.log(`Action ${action} completed`);
                                if (action === 'DROP') {
                                    handleDrop();
                                }
                            }}
                            onCardClick={handleCardClick}
                            hitStage={hitStage}
                        />
                            <PlayerSection
                                key={gameState?.players[2]?.username || 1}
                                position={PLAYER_POSITIONS[2]}
                                className={`player player-left  ${gameState.currentTurn === 2 ? 'active' : ''}`}
                                player={gameState?.players[2]}
                                hand={gameState.playerHands[2] || []}
                                spreads={gameState.playerSpreads[2] || []}
                                isCurrentTurn={gameState.currentTurn === 2}
                                hasDrawnCard={gameState.hasDrawnCard}
                                isHidden={!gameState.gameOver}
                                onDrop={handleDrop}
                                hitMode={hitMode}
                                selectedCard={selectedCard}
                                onCardSelect={handleCardSelect}
                                onHit={handleHit}
                                onToggleHitMode={toggleHitMode}
                                onSpread={handleSpread}
                                canHit={true}
                                canDrop={!gameState.hasDrawnCard && gameState.currentTurn === 2}
                                isProcessing={gameState.currentTurn === 2 && aiProcessing}
                                isLoading={loadingStates.spreadAction}
                                gameState={gameState}
                                isActive={hitMode && selectedCard !== null}
                                setGameState={setGameState}
                                onActionComplete={(action) => {
                                    console.log(`Action ${action} completed`);
                                    if (action === 'DROP') {
                                        handleDrop();
                                    }
                                }}
                                onCardClick={handleCardClick}
                                hitStage={hitStage}
                            />

                        <CenterGameArea
                            className="center-area"
                            deck={gameState?.deck || []}
                            discardPile={gameState?.discardPile || []}
                            currentTurn={gameState?.currentTurn || 0}
                            hasDrawnCard={gameState?.hasDrawnCard || false}
                            handlePlayerAction={handlePlayerAction}
                            onDrawCard={handleDrawCard}
                            onDrawDiscard={handleDrawDiscard}
                            isLoading={loadingStates.cardDraw}
                            players={gameState?.players || []}
                            pot={gameState?.stake || 0}
                        />


                            <PlayerSection
                                // Same props as above but for player[3]
                                // All props identical but with index 3
                                key={gameState?.players[3]?.username || 3}
                                position={PLAYER_POSITIONS[3]}
                                className={`player player-right  ${gameState.currentTurn === 3 ? 'active' : ''}`}
                                player={gameState?.players[3]}
                                hand={gameState.playerHands[3] || []}
                                spreads={gameState.playerSpreads[3] || []}
                                isCurrentTurn={gameState.currentTurn === 3}
                                hasDrawnCard={gameState.hasDrawnCard}
                                isHidden={!gameState.gameOver}
                                onDrop={handleDrop}
                                hitMode={hitMode}
                                selectedCard={selectedCard}
                                onCardSelect={handleCardSelect}
                                onHit={handleHit}
                                onToggleHitMode={toggleHitMode}
                                onSpread={handleSpread}
                                canHit={true}
                                canDrop={!gameState.hasDrawnCard && gameState.currentTurn === 3}
                                isProcessing={gameState.currentTurn === 3 && aiProcessing}
                                isLoading={loadingStates.spreadAction}
                                gameState={gameState}
                                isActive={hitMode && selectedCard !== null}
                                setGameState={setGameState}
                                onActionComplete={(action) => {
                                    console.log(`Action ${action} completed`);
                                    if (action === 'DROP') {
                                        handleDrop();
                                    }
                                }}
                                onCardClick={handleCardClick}
                                hitStage={hitStage}
                            />
                        <PlayerSection
                            // Same props as above but for player[0]
                            // All props identical but with index 0
                            key={gameState?.players[0]?.username || 0}
                                position={PLAYER_POSITIONS[0]}
                                className={`player player-bottom  ${gameState.currentTurn === 0 ? 'active' : ''}`}
                                player={gameState?.players[0]}
                                hand={gameState.playerHands[0] || []}
                                spreads={gameState.playerSpreads[0] || []}
                                isCurrentTurn={gameState.currentTurn === 0}
                                hasDrawnCard={gameState.hasDrawnCard}
                                onDrop={handleDrop}
                                hitMode={hitMode}
                                selectedCard={selectedCard}
                                onCardSelect={handleCardSelect}
                                onHit={handleHit}
                                onToggleHitMode={toggleHitMode}
                                onSpread={handleSpread}
                                canHit={true}
                                canDrop={!gameState.hasDrawnCard && gameState.currentTurn === 0}
                                isProcessing={gameState.currentTurn === 0 && aiProcessing}
                                isLoading={loadingStates.spreadAction}
                                gameState={gameState}
                                isActive={hitMode && selectedCard !== null}
                                setGameState={setGameState}
                                onActionComplete={(action) => {
                                    console.log(`Action ${action} completed`);
                                    if (action === 'DROP') {
                                        handleDrop();
                                    }
                                }}
                                onCardClick={handleCardClick}
                                hitStage={hitStage}
                        />
                </div>
    
                {gameState?.gameOver && (
                    <GameEndOverlay
                        winners={gameState.winners}
                        players={gameState.players}
                        scores={playerScores}
                        winType={gameState.winType}
                        stake={Number(gameState.stake)}
                        caught={gameState.caught}
                        onLeaveTable={() => navigate('/lobby')}
                        gameEndMessage={gameState.gameEndMessage}
                        gameState={gameState}
                        setGameState={setGameState}
                        tableId={tableId}
                        onGameRestart={handleRestartGame}
                        chipBalances={gameState.chipBalances}
                        socket={socket}
                    />
                )}
            </div>
        </GameErrorBoundary>
    );
    
};

GameBoard.propTypes = {
    tableId: PropTypes.string.isRequired,
    gameState: PropTypes.shape({
        players: PropTypes.array,
        playerHands: PropTypes.array,
        playerSpreads: PropTypes.array,
        deck: PropTypes.array,
        discardPile: PropTypes.array,
        currentTurn: PropTypes.number,
        hasDrawnCard: PropTypes.bool,
        gameStarted: PropTypes.bool,
        winners: PropTypes.array,
        caught: PropTypes.bool,
        winType: PropTypes.string,
        gameEndMessage: PropTypes.string
    }),
    setGameState: PropTypes.func.isRequired,
    socket: PropTypes.object.isRequired,
    user: PropTypes.object.isRequired
};

export default React.memo(GameBoard);
