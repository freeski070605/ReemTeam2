import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthService from './AuthService';
import './Header.css';
import LoginPage from './LoginPage';
import axios from 'axios';
import { UserContext } from './UserContext';

const Header = () => {
  const { user, setUser } = useContext(UserContext);  // Ensure setUser is provided by UserContext
  const [isLoggedIn, setIsLoggedIn] = useState(!!user);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      setIsLoggedIn(true);
      //fetchUserData();
      console.log('User data:', user);
    }
  }, [user]);

  const fetchUserData = async () => {
    try {
      if (!user || !user.user.username) {
        console.warn('User is not defined or does not have a username.');
        return;
      }

      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:3000/users/${user.username}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data) {
        setUser(response.data);
        setIsLoggedIn(true);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const goToUserProfile = () => {
    navigate('/userprofile');
  };

  const handleLogin = async (username, password) => {
    const result = await AuthService.login(username, password);
    if (result.success) {
      setIsLoggedIn(true);
      setShowLoginModal(false);
      //fetchUserData(); // Fetch updated user data after login
      navigate('/userprofile');
    } else {
      alert(result.error);
    }
  };

  const handleLogout = async () => {
    try {
      await AuthService.logout();
      setIsLoggedIn(false);
      navigate('/');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <div className="navbar">
      <div className="container">
        <div className="logo" onClick={() => navigate('/')}>Reem Team</div>
        <nav>
          {isLoggedIn && <button onClick={goToUserProfile}>Profile</button>}
          {user && user.isAdmin && <button onClick={() => navigate('/admin')}>Admin</button>}
          {!isLoggedIn ? (
            <div>
              <button onClick={() => setShowLoginModal(true)}>Login</button>
              <button onClick={() => setShowLoginModal(true)}>Register</button>
            </div>
          ) : (
            <button onClick={handleLogout}>Logout</button>
          )}
        </nav>
        {showLoginModal && (
          <LoginPage handleLogin={handleLogin} onClose={() => setShowLoginModal(false)} />
        )}
        {isLoggedIn && user &&
        <div className="user-info">
          <p>{user.username} | Chips: {user.chips}</p>
        </div>
        }
      </div>
    </div>
  );
};

export default Header;
