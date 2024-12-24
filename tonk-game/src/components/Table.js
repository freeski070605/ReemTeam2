import React, { useEffect, useState, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import GameBoard from './Gameboard';
import Header from './Header';
import AuthService from './AuthService';
import AiPlayer from './AiPlayerHand';
import { UserContext } from './UserContext';  // Import the UserContext


const TableComponent = () => {
  const { tableId } = useParams();
  const [players, setPlayers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [username, setUsername] = useState('');
  const [playerChips, setPlayerChips] = useState(0);
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();
  const [stake, setStake] = useState(0);
  const { user } = useContext(UserContext);  // Use the UserContext

  useEffect(() => {
    const fetchTableDetails = async () => {
      try {
        const response = await fetch(`http://localhost:5000/tables/${tableId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch table details');
        }
        const data = await response.json();
        
        // Check for saved game state first
        const savedState = localStorage.getItem(`gameState-${tableId}`);
        if (savedState) {
          const parsedState = JSON.parse(savedState);
          setPlayers(parsedState.players);
          setStake(parsedState.stake);
        } else {
          // Only set up new game if no saved state exists
          let tablePlayers = data.table.players;
          if (tablePlayers.length < 2) {
            tablePlayers.push(new AiPlayer('AI Player'));
          }
          setPlayers(tablePlayers);
          setStake(data.table.stake);
        }
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching table details:', error);
        setError(error.message);
        setIsLoading(false);
      }
    };

    if (tableId) {
      fetchTableDetails();
    }
  }, [tableId]);

  const deleteTable = async (tableId) => {
    try {
      await fetch(`http://localhost:5000/tables/${tableId}`, {
        method: 'DELETE',
      });
      navigate('/lobby');
    } catch (error) {
      console.error('Error deleting table:', error);
    }
  };
  

  const leaveTable = async () => {
    try {
      const response = await fetch('http://localhost:5000/tables/leave', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ tableId, username }),
      });
  
      const result = await response.json();
      if (result.success) {
        setPlayers(players.filter(player => player.username !== username));
        if (players.length === 1) {
          deleteTable(tableId);
        }
        navigate('/lobby');
      }
    } catch (error) {
      console.error('Error leaving table:', error);
    }
  };
  

  if (isLoading) {
    return <p>Loading...</p>;
  }

  if (error) {
    return <p>Error: {error}</p>;
  }

  return (
    <div>
      <h2>{stake}$ Table</h2>
      <h3>Players:</h3>
      <ul>
        {players && players.length > 0 ? (
          players.map((player, index) => (
            <li key={index}>{player.username || player}</li>
          ))
        ) : (
          <p>No players at this table</p>
        )}
      </ul>
      {players && players.length > 0 && (
        <GameBoard
          tableId={tableId}
          players={players}
          setPlayers={setPlayers}
          stake={stake}
          setStake={setStake}
          playerChips={user.chips}
          setPlayerChips={setPlayerChips}
        />
      )}
      <button onClick={leaveTable}>Leave Table</button>
    </div>
  );
};

export default TableComponent;
