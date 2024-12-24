import React from 'react';

const PlayerInfo = ({ player = {}, isActive = false }) => {
    if (!player) return null;
    
    return (
        <div className={`player-info ${isActive ? 'active' : ''}`}>
            <div className="player-name">{player.username || 'Player'}</div>
            <div className="player-chips">
                <span className="chip-icon">💰</span>
                <span className="chip-count">{player.chips || 0}</span>
            </div>
            {isActive && <div className="turn-indicator">Current Turn</div>}
        </div>
    );
};
export default PlayerInfo;
