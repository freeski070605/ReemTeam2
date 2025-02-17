import React, { useCallback } from 'react';
import PropTypes from 'prop-types';
import Deck from './Deck';
import DiscardPile from './DiscardPile';
import GameInfo from './GameInfo';
import "./CenterGameArea.css";

const CenterGameArea = ({
    deck,
    discardPile,
    currentTurn,
    hasDrawnCard,
    handlePlayerAction,
    isLoading,
    players,
    pot
}) => {
    const handleDeckDraw = useCallback(() => {
        console.log('Attempting deck draw:', { deckSize: deck.length, hasDrawnCard });
        if (deck.length > 0 && !hasDrawnCard) {
            handlePlayerAction('DRAW_CARD');
        }
    }, [deck.length, hasDrawnCard, handlePlayerAction]);

    const handleDiscardDraw = useCallback(() => {
        console.log('Attempting discard draw:', { pileSize: discardPile.length, hasDrawnCard });
        if (discardPile.length > 0 && !hasDrawnCard) {
            handlePlayerAction('DRAW_DISCARD');
        }
    }, [discardPile.length, hasDrawnCard, handlePlayerAction]);

    console.log('CenterGameArea received deck:', deck?.length);console.log('CenterGameArea deck details:', {
        receivedDeck: deck,
        deckLength: deck?.length,
        deckContents: JSON.stringify(deck)
    });
    


    return (
        <div className="center-area">
                <Deck 
                    cards={deck || []}
                    drawCard={handleDeckDraw}
                    isActive={currentTurn === 0 && !hasDrawnCard}
                    className="deck"
                    />
                
                <GameInfo 
                    pot={pot}
                    currentTurn={currentTurn}
                    players={players}
                    className="game-info pot-display"
                />
                
                <DiscardPile 
                    cards={discardPile || []}
                    onClick={handleDiscardDraw}
                    isActive={!hasDrawnCard && (discardPile?.length > 0)}
                    className="discard-pile"
                />
            
            {isLoading && (
                <div className="loading-overlay">
                    <div className="spinner"></div>
                </div>
            )}
        </div>
    );
};

CenterGameArea.propTypes = {
    deck: PropTypes.array.isRequired,
    discardPile: PropTypes.array.isRequired,
    currentTurn: PropTypes.number.isRequired,
    hasDrawnCard: PropTypes.bool.isRequired,
    handlePlayerAction: PropTypes.func.isRequired,
    isLoading: PropTypes.bool,
    players: PropTypes.array.isRequired,
    pot: PropTypes.number.isRequired
};

export default React.memo(CenterGameArea);
