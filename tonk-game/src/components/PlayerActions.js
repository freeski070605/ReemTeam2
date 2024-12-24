import React from 'react';

const PlayerActions = ({ 
    isActive,
    canSpread,
    canHit,
    onSpread,
    onHit,
    onDrop,
    hasDrawnCard,
    canDrop
}) => {
    return (
        <div className="player-actions">
            <button 
                className="action-button drop"
                disabled={!isActive || !canDrop}
                onClick={onDrop}
            >
                Drop
            </button>
            <button 
                className="action-button spread"
                disabled={!isActive || !canSpread || !hasDrawnCard}
                onClick={onSpread}
            >
                Spread
            </button>
            <button 
                className="action-button hit"
                disabled={!isActive || !canHit || !hasDrawnCard}
                onClick={onHit}
            >
                Hit
            </button>
        </div>
    );
};
export default PlayerActions;
