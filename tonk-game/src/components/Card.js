// Card.js
import React from 'react';
import PropTypes from 'prop-types';
import './Card.css'; // Import the CSS file

const Card = ({ card }) => {
    const { rank, suit } = card;
    const cardImage = `${process.env.PUBLIC_URL}/assets/cards/${rank}_of_${suit}.png`; // Adjust the path as necessary

    return (
        <img src={cardImage} alt={`${rank} of ${suit}`} className="card-image" />
    );
};

Card.propTypes = {
    card: PropTypes.shape({
        rank: PropTypes.string.isRequired,
        suit: PropTypes.string.isRequired
    }).isRequired
};

export default Card;
