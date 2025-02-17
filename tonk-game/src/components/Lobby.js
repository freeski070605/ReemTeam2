import React, { useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Header from './Header';
import { UserContext } from './UserContext';
import { io } from 'socket.io-client';
import './Lobby.css';
import CreateTableModal from './createTableModal';
import { socket } from '../hooks/useGameSocket';
const stakesOptions = [1, 5, 10, 20, 50, 100];

const Lobby = () => {
    const [tables, setTables] = useState([]);
    const [stake, setStake] = useState(null);
    const [gameStarted, setGameStarted] = useState(false);
    const [currentTableId, setCurrentTableId] = useState(null);
    const navigate = useNavigate();
    const { user, isLoading } = useContext(UserContext);
    const filteredTables = tables.filter(table => !stake || table.stake === stake);

    const [showCreateModal, setShowCreateModal] = useState(false);

    const createTable = async (tableData) => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.post('http://localhost:5000/tables', 
                {
                    ...tableData,
                    player: user // Add the player data
                },
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
            const newTable = response.data.table;
            setTables([...tables, newTable]);
            setShowCreateModal(false);
        } catch (error) {
            console.error('Error creating table:', error);
        }
    };
    


    useEffect(() => {
        const fetchTables = async () => {
            try {
                const response = await fetch('http://localhost:5000/tables');
                const data = await response.json();
                setTables(data.tables || []); // Add fallback empty array
            } catch (error) {
                console.error('Error fetching tables:', error);
                setTables([]); // Set empty array on error
            }
        };
        

        fetchTables();

        

        socket.on('tables_update', (data) => {
            setTables(data.tables);
        });

        return () => {
            if (socket) {
                socket.close();
            }
        };
    }, []);

    useEffect(() => {
        socket.on('table_joined', (data) => {
            console.log('Table joined successfully:', data);
            navigate(`/table/${data.tableId}`);
        });
    
        return () => socket.off('table_joined');
    }, [navigate]);
    

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

    

    const joinTable = (tableId) => {
        if (!user) return;
        
        socket.emit('join_table', { 
            tableId, 
            player: {
                username: user.username,
                chips: user.chips,
                isHuman: true
            }
        });
        
        setCurrentTableId(tableId);
        setGameStarted(true);
        navigate(`/table/${tableId}`);
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
        <div className="lobby-container">
            <div className="lobby-header">
                <h1>Lobby</h1>
            </div>
            
            <div className="stakes-selector">
                <button 
                    className={`stake-button ${!stake ? 'selected' : ''}`}
                    onClick={() => handleStakeChange(null)}
                >
                    All Stakes
                </button>
                {stakesOptions.map((option) => (
                    <button 
                        key={option}
                        className={`stake-button ${stake === option ? 'selected' : ''}`}
                        onClick={() => handleStakeChange(option)}
                    >
                        ${option}
                    </button>
                ))}
            </div>

            {user?.isAdmin && (
                <div className="admin-controls">
                    <button 
                        className="btn btn-primary"
                        onClick={() => setShowCreateModal(true)}
                        >
                        Create New Table
                    </button>
                </div>
            )}
            {showCreateModal && (
    <CreateTableModal
        onClose={() => setShowCreateModal(false)}
        onSubmit={createTable}
    />
)}
    
            <div className="tables-grid">
                
                {filteredTables.map((table) => (
                    <div key={table._id} className="table-card">
                        <div className="table-preview">
                            {table.players.map((player, index) => (
                                <div key={index} className={`mini-player ${['top', 'right', 'bottom', 'left'][index]}`}>
                                    {player.username?.[0] || '?'}
                                </div>
                            ))}
                        </div>
                        <div className="table-info">
                            <span className="stake-amount">${table.stake}</span>
                            <span className="player-count">{table.players?.length || 0}/4 Players</span>
                        </div>
                        <div key={table._id}>
                            
                            <span>{table.name} ({table.players?.length || 0}/4)</span>
                            <button className="join-button" onClick={() => joinTable(table._id)} disabled={table.players?.length >= 4}>
                                Join
                            </button>
                            {user && user.isAdmin && (
                                <button onClick={() => deleteTable(table._id)}>Delete</button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Lobby;
