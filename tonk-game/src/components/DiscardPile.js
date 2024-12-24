import React from 'react';

const DiscardPile = ({ cards, onClick, isActive }) => {
    const topCard = cards[cards.length - 1];

    return (
        <div 
            className={`discard-pile ${isActive ? 'active' : ''}`}
            onClick={() => isActive && onClick && onClick()}
        >
            {cards.length === 0 ? (
                <div className="empty-pile">
                    <div className="empty-pile-text">Discard Pile</div>
                </div>
            ) : (
                <div className="pile-container">
                    {/* Show number of cards in pile */}
                    <div className="card-count">{cards.length}</div>
                    
                    {/* Display top card */}
                    <div className="top-card">
                        <img 
                            src={`${process.env.PUBLIC_URL}/assets/cards/${topCard.rank}_of_${topCard.suit}.png`}
                            alt={`${topCard.rank} of ${topCard.suit}`}
                            className="card-image"
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default DiscardPile;
