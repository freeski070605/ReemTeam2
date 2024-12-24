import React from 'react';

const PlayerSpreads = ({ spreads = [], onSpreadClick }) => {
    if (!Array.isArray(spreads)) return null;
    
    return (
        <div className="player-spreads">
            {spreads.map((spread, spreadIndex) => (
                <div 
                    key={`spread-${spreadIndex}`} 
                    className="spread"
                    onClick={() => onSpreadClick && onSpreadClick(spreadIndex)}
                >
                    {Array.isArray(spread) && spread.map((card, cardIndex) => (
                        <div 
                            key={`${card?.rank || 'card'}-${card?.suit || 'suit'}-${cardIndex}`}
                            className="spread-card"
                        >
                            <img 
                                src={`${process.env.PUBLIC_URL}/assets/cards/${card?.rank || 'ace'}_of_${card?.suit || 'spades'}.png`}
                                alt={`${card?.rank || 'card'} of ${card?.suit || 'suit'}`}
                                className="card-image"
                            />
                        </div>
                    ))}
                </div>
            ))}
        </div>
    );
};
export default PlayerSpreads;
