import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Header from './Header';
import './Header.css';
import './UserProfilePage.css';
import { UserContext } from './UserContext';  // Import the UserContext
import AuthService from './AuthService';

const UserProfilePage = () => {
    const { user, updateUserChips } = useContext(UserContext);  // Use the UserContext
    const navigate = useNavigate();
    console.log('user:', user);

    const handleBuyChips = async () => {
        const token = localStorage.getItem('token');
        const additionalChips = 100; // Example: Add 100 chips
        const updatedChips = user.chips + additionalChips;
        updateUserChips(updatedChips); // Update state before API call

        try {
            const endpoint = `http://localhost:5000/users/${user.username}/updateChips`;
            await axios.put(endpoint, {
                chips: additionalChips, // Send only the additional chips to be added
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            console.log('Chips updated successfully');
        } catch (error) {
            console.error('Error updating chips:', error);
        }
    };

    const handleLogout = () => {
        AuthService.logout();
        navigate('/');
    };

    if (!user) {
        return <div>Loading...</div>;
    }

    return (
        <div className="profile-container">
            <main className="content">
                <div className="container">
                    <section className="user-info">
                        <h2>What's up {user.username}!</h2>
                        <div className="chips-info">
                            <p>Chips: {user.chips}</p>
                            <button onClick={handleBuyChips}>Buy Chips</button>
                        </div>
                        <button onClick={() => navigate('/lobby')}>Play Game</button>
                    </section>
                </div>
            </main>
        </div>
    );
};

export default UserProfilePage;
