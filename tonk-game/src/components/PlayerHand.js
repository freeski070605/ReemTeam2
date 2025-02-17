import React from 'react';
import './PlayerHand.css';
const PlayerHand = ({ cards, isActive, onCardClick, onCardSelect, hitMode, selectedCard, isHidden }) => {
    if (!Array.isArray(cards)) return null;

    const suitOrder = ['clubs', 'diamonds', 'hearts', 'spades'];
    const rankOrder = ['ace', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
    
    // Attach originalIndex and sort cards
    const sortedCards = cards
        .map((card, originalIndex) => ({ ...card, originalIndex }))
        .sort((a, b) => {
            const suitDiff = suitOrder.indexOf(a.suit) - suitOrder.indexOf(b.suit);
            if (suitDiff !== 0) return suitDiff;
            return rankOrder.indexOf(a.rank) - rankOrder.indexOf(b.rank);
        });

    const handleCardInteraction = (originalIndex) => {
        if (!isActive) return;
        
        console.log('Card interaction:', {
            card: cards[originalIndex],
            originalIndex,
            mode: hitMode ? 'hit' : 'discard'
        });

        if (hitMode) {
            onCardSelect(originalIndex);
        } else {
            onCardClick(originalIndex);
        }
    };

    return (
        <div className={`player-hand-container ${isActive ? 'active' : ''}`}>
            <div className="cards-scroll-container">
                <div className="cards-wrapper">
                {sortedCards.map((card) => (
                    <div 
                        key={`${card.rank}-${card.suit}-${card.originalIndex}`}
                        className={`
                            card 
                            ${isActive ? 'clickable' : ''} 
                            ${selectedCard === card.originalIndex ? 'selected' : ''}
                            ${hitMode ? 'hit-mode' : 'discard-mode'}
                        `}
                        onClick={() => handleCardInteraction(card.originalIndex)}
                    >
                       {isHidden ? (
                            <img 
                                src={`${process.env.PUBLIC_URL}/assets/cards/back.png`}
                                alt="Card Back"
                                className="card card-image"
                            />
                        ) : (
                            <img 
                                src={`${process.env.PUBLIC_URL}/assets/cards/${card.rank}_of_${card.suit}.png`}
                                alt={`${card.rank} of ${card.suit}`}
                                className="card card-image"
                            />
                        )}
                    </div>
                ))}
            </div>
        </div>
        </div>
    );
};

export default PlayerHand;
