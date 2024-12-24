// Deck.js
import React from 'react';
import PropTypes from 'prop-types';
import './Gameboard'; // Import the CSS file

const Deck = ({ cards, drawCard, isActive }) => {
    return (
        <div 
            className={`deck ${isActive ? 'active' : ''} deck-and-discard` }
            onClick={drawCard}
            style={{ cursor: isActive ? 'pointer' : 'default' }}
        >
            {cards.length > 0 ? (
                <>
                    <img 
                        src={`${process.env.PUBLIC_URL}/assets/cards/back.png`}
                        alt="Deck"
                        className="deck-image"
                    />
                    <div className="card-count">{cards.length}</div>
                </>
            ) : (
                <div className="empty-deck">Empty</div>
            )}
        </div>
    );
};

Deck.propTypes = {
    cards: PropTypes.array.isRequired,
    drawCard: PropTypes.func.isRequired,
    isActive: PropTypes.bool
};

Deck.defaultProps = {
    isActive: false
};

const initialDeck = [
    { rank: '2', suit: 'Hearts' }, { rank: '2', suit: 'Diamonds' },
    { rank: '2', suit: 'Clubs' }, { rank: '2', suit: 'Spades' },
    { rank: '3', suit: 'Hearts' }, { rank: '3', suit: 'Diamonds' },
    { rank: '3', suit: 'Clubs' }, { rank: '3', suit: 'Spades' },
    { rank: '4', suit: 'Hearts' }, { rank: '4', suit: 'Diamonds' },
    { rank: '4', suit: 'Clubs' }, { rank: '4', suit: 'Spades' },
    { rank: '5', suit: 'Hearts' }, { rank: '5', suit: 'Diamonds' },
    { rank: '5', suit: 'Clubs' }, { rank: '5', suit: 'Spades' },
    { rank: '6', suit: 'Hearts' }, { rank: '6', suit: 'Diamonds' },
    { rank: '6', suit: 'Clubs' }, { rank: '6', suit: 'Spades' },
    { rank: '7', suit: 'Hearts' }, { rank: '7', suit: 'Diamonds' },
    { rank: '7', suit: 'Clubs' }, { rank: '7', suit: 'Spades' },
    { rank: 'J', suit: 'Hearts' }, { rank: 'J', suit: 'Diamonds' },
    { rank: 'J', suit: 'Clubs' }, { rank: 'J', suit: 'Spades' },
    { rank: 'Q', suit: 'Hearts' }, { rank: 'Q', suit: 'Diamonds' },
    { rank: 'Q', suit: 'Clubs' }, { rank: 'Q', suit: 'Spades' },
    { rank: 'K', suit: 'Hearts' }, { rank: 'K', suit: 'Diamonds' },
    { rank: 'K', suit: 'Clubs' }, { rank: 'K', suit: 'Spades' },
    { rank: 'ace', suit: 'Hearts' }, { rank: 'ace', suit: 'Diamonds' },
    { rank: 'ace', suit: 'Clubs' }, { rank: 'ace', suit: 'Spades' }
];



export default Deck;
