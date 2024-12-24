import React, { useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Header from './Header';
import { UserContext } from './UserContext';
import { io } from 'socket.io-client';

const stakesOptions = [1, 5, 10, 20, 50, 100];

const Lobby = () => {
    const [tables, setTables] = useState([]);
    const [stake, setStake] = useState(null);
    const [gameStarted, setGameStarted] = useState(false);
    const [currentTableId, setCurrentTableId] = useState(null);
    const navigate = useNavigate();
    const [socket, setSocket] = useState(null);
    const { user, isLoading } = useContext(UserContext);

    useEffect(() => {
        const fetchTables = async () => {
            try {
                const response = await fetch('http://localhost:5000/tables');
                const data = await response.json();
                setTables(data.tables);
            } catch (error) {
                console.error('Error fetching tables:', error);
            }
        };

        fetchTables();

        const newSocket = io('http://localhost:5000'); // Ensure this matches your server URL
        setSocket(newSocket);

        newSocket.on('tables_update', (data) => {
            setTables(data.tables);
        });

        return () => {
            if (newSocket) {
                newSocket.close();
            }
        };
    }, []);

    if (isLoading) {
        return <div>Loading...</div>;
    }

    const handleStakeChange = (newStake) => {
        if (!gameStarted) {
            setStake(newStake);
        }
    };

    const handleJoinOrCreateTable = async () => {
        const table = tables.find(t => t.stake === stake && t.players.length < 4);

        if (table) {
            joinTable(table._id);
        } else {
            await createTable();
        }
    };

    const createTable = async () => {
        try {
            const tableName = `Table ${tables.length + 1}`; // Generate a name for the table
            const response = await axios.post('http://localhost:5000/tables', { name: tableName, stake, player: user });
            const newTable = response.data.table;
            joinTable(newTable._id);
        } catch (error) {
            console.error('Error creating table:', error);
        }
    };

    const joinTable = (tableId) => {
        if (socket) {
            socket.emit('join_table', { tableId, player: user });
            setCurrentTableId(tableId);
            setGameStarted(true);
            navigate(`/table/${tableId}`);
        }
    };

    const leaveTable = async () => {
        try {
            await axios.post('http://localhost:5000/tables/leave', { tableId: currentTableId, user });
            if (socket) {
                socket.emit('leave_table', { tableId: currentTableId, player: user });
            }
            setCurrentTableId(null);
            setGameStarted(false);
            navigate('/lobby');
        } catch (error) {
            console.error('Error leaving table:', error);
        }
    };

    const deleteTable = async (tableId) => {
        try {
            await axios.delete(`http://localhost:5000/tables/${tableId}`);
            setTables(tables.filter(table => table._id !== tableId));
        } catch (error) {
            console.error('Error deleting table:', error);
        }
    };

    return (
        <div>
            <h1>Lobby</h1>
            <h2>Tables:</h2>
            {!gameStarted && (
                <div className="start-game">
                    <label htmlFor="stake">Stake:</label>
                    <select id="stake" value={stake || ''} onChange={(e) => handleStakeChange(Number(e.target.value))}>
                        <option value="">Select Stake</option>
                        {stakesOptions.map((option) => (
                            <option key={option} value={option}>
                                {option}
                            </option>
                        ))}
                    </select>
                    <button onClick={handleJoinOrCreateTable}>Join or Create Table</button>
                </div>
            )}
            {gameStarted && (
                <button onClick={leaveTable}>Leave Table</button>
            )}
            <div>
                {(tables.length > 0) ? (
                    tables.map((table) => (
                        <div key={table._id}>
                            <span>{table.name} ({table.players?.length || 0}/4)</span>
                            <button onClick={() => joinTable(table._id)} disabled={table.players?.length >= 4}>
                                Join
                            </button>
                            {user.isAdmin && (
                                <button onClick={() => deleteTable(table._id)}>Delete</button>
                            )}
                        </div>
                    ))
                ) : (
                    <p>No tables available</p>
                )}
            </div>
        </div>
    );
};

export default Lobby;
