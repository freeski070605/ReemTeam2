import React from 'react';

const PlayerHand = ({ cards = [], isActive = false, onCardClick, isHidden = false }) => {
    if (!Array.isArray(cards)) return null;
    
    return (
        <div className={`player-hand ${isActive ? 'active' : ''}`}>
            <div className="cards-container">
                {cards.map((card, index) => (
                    <div 
                        key={`${card?.rank || 'card'}-${card?.suit || 'suit'}-${index}`}
                        className="card"
                        onClick={() => isActive && onCardClick && onCardClick(index)}
                    >
                        {isHidden ? (
                            <img 
                                src={`${process.env.PUBLIC_URL}/assets/cards/back.png`}
                                alt="Card Back"
                                className="card-image"
                            />
                        ) : (
                            <img 
                                src={`${process.env.PUBLIC_URL}/assets/cards/${card?.rank || 'ace'}_of_${card?.suit || 'spades'}.png`}
                                alt={`${card?.rank || 'card'} of ${card?.suit || 'suit'}`}
                                className="card-image"
                            />
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};
export default PlayerHand;
