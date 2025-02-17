import React, { memo, useMemo, useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import PlayerInfo from './PlayerInfo';
import PlayerHand from './PlayerHand';
import PlayerSpreads from './PlayerSpreads';
import PlayerActions from './PlayerActions';
import { isValidSpread, calculatePoints, findBestSpread, isValidHit } from '../utils/gameUtils';
import './PlayerSection.css';

const MemoizedPlayerInfo = memo(PlayerInfo);
const MemoizedPlayerHand = memo(PlayerHand);
const MemoizedPlayerSpreads = memo(PlayerSpreads);
const MemoizedPlayerActions = memo(PlayerActions);

const PlayerSection = ({ 
    position, 
    player,
    hand, 
    spreads,
    isCurrentTurn,
    isHidden,
    hasDrawnCard,
    onDrop,
    hitMode, 
    selectedCard, 
    onCardSelect, 
    onHit,
    onToggleHitMode,
    onSpread,
    canHit,
    canDrop,
    isProcessing,
    isActive,
    onCardClick,
    gameState,
    setGameState,
    onActionComplete,
    className
}) => {
    const [selectedCards, setSelectedCards] = useState([]);
    const [selectedSpread, setSelectedSpread] = useState(null);

    const canDropBasedOnPoints = useMemo(() => {
        const points = calculatePoints(hand);
        return points <= 30 && !hasDrawnCard && isCurrentTurn;
    }, [hand, hasDrawnCard, isCurrentTurn]);

    const handleSpread = (cards) => {
        if (isValidSpread(cards)) {
            onSpread(cards);
        }
    };

    const handleHit = (cardIndex, targetIndex, spreadIndex) => {
        if (isCurrentTurn && hasDrawnCard) {
            onHit(cardIndex, targetIndex, spreadIndex);
        }
    };
    
    

    const handleDropAction = () => {
        if (canDropBasedOnPoints) {
            onDrop();
            onActionComplete?.('DROP');
        }
    };

    const handleCardClick = (cardIndex) => {
        if (isCurrentTurn && hasDrawnCard) {
            onCardClick(cardIndex);
        }
    };

    useEffect(() => {
        console.log('PlayerSection hand updated:', hand);
    }, [hand]);
    
    useEffect(() => {
        console.log('PlayerSection spreads updated:', spreads);
    }, [spreads]);
    

    return (
        <div className={`player-section ${position} ${isCurrentTurn ? 'active' : ''} ${className || ''} 
        ${gameState.penalties[position] > 0 ? 'penalized' : ''}`}>
            <MemoizedPlayerInfo 
                player={player}
                isActive={isCurrentTurn}
                className="mobile-info player-info"
            />
            <MemoizedPlayerHand 
                key={`hand-${hand.length}-${isCurrentTurn}-${gameState.updateId}`}
                cards={hand}
                isActive={isCurrentTurn}
                onCardClick={handleCardClick}
                isHidden={isHidden}
                hitMode={hitMode}
                onToggleHitMode={onToggleHitMode}
                selectedCard={selectedCard}
                onCardSelect={onCardSelect}
                className="mobile-hand player-hand"
            />
            <MemoizedPlayerSpreads 
        key={`spreads-${position}-${gameState.updateId}`}
        spreads={spreads}
                onSpreadClick={onHit}
                isActive={isActive}
                selectedCard={selectedCard}
                position={position}
                className="mobile-spreads player-spreads"
            />

            {isCurrentTurn && !isHidden && (
                <MemoizedPlayerActions 
                    isActive={isCurrentTurn}
                    canSpread={isValidSpread}
                    canHit={canHit}
                    hasDrawnCard={hasDrawnCard}
                    onSpread={handleSpread}
                    onHit={handleHit}
                    onToggleHitMode={onToggleHitMode}
                    isHitModeActive={hitMode}
                    onDrop={handleDropAction}
                    canDrop={canDropBasedOnPoints}
                    gameState={gameState}
                    setGameState={setGameState}
                    onActionComplete={onActionComplete}
                    className="mobile-actions player-actions"
                />
            )}
            {gameState.penalties[position] > 0 && (
                <div className="penalty-indicator">
                    Penalized: {gameState.penalties[position]} turns
                </div>
            )}
        </div>
    );
};

export default memo(PlayerSection);
