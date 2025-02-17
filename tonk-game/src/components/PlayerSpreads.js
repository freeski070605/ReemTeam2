import { React, useMemo, useState } from 'react';
import { isValidSpread } from '../utils/gameUtils';
import { PLAYER_POSITIONS } from './gameConstants';
import './PlayerSpreads.css';
const PlayerSpreads = ({ spreads, onSpreadClick, isActive, selectedCard, position, className }) => {
    // Always render spreads, only handle hit interactions when active
    const handleSpreadClick = (spreadIndex) => {
        if (!isActive || selectedCard === null) return;
        
        // Convert position to numeric index
        const targetIndex = PLAYER_POSITIONS.indexOf(position);
        console.log('Spread clicked:', { spreadIndex, selectedCard, targetIndex });
        onSpreadClick(selectedCard, targetIndex, spreadIndex);
    };

    return (
        <div className={`spreads-container ${className}`}>
            <div className="spreads-scroll">
                {spreads.map((spread, spreadIndex) => (
                    <div 
                        key={`spread-${spreadIndex}`}
                        className="spread-group"
                        onClick={() => onSpreadClick(spreadIndex)}
                    >
                        {spread.map((card, cardIndex) => (
                            <div 
                                key={`${card.rank}-${card.suit}-${cardIndex}`}
                                className="spread-card-wrapper"
                            >
                                <img 
                                    src={`/assets/cards/${card.rank}_of_${card.suit}.png`}
                                    alt={`${card.rank} of ${card.suit}`}
                                    className="spread-card-image"
                                />
                            </div>
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
};




export default PlayerSpreads;
