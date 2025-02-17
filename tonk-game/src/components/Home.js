import React, { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import LoginPage from './LoginPage';
import { UserContext } from './UserContext';
import AuthService from './AuthService';
import './HomePage.css';

const HomePage = () => {
  const { user, setUser } = useContext(UserContext);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (username, password) => {
    try {
      const result = await AuthService.login(username, password);
      if (result.success) {
        setShowLoginModal(false);
        navigate('/userprofile');
      } else {
        alert(result.error || 'Login failed. Please check your credentials.');
      }
    } catch (error) {
      console.error('Login error:', error);
      alert('An error occurred during login. Please try again.');
    }
  };

  const handleLogout = async () => {
    try {
      await AuthService.logout();
      setUser(null); // Clear user data on logout
      navigate('/');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <div className="home-container">
      <main className="content">
        <div className="hero-section">
          <h2>Welcome to Reem Team!</h2>
          <p>Join in on the fun and become part of the Reem Team. Explore exciting challenges and compete with players worldwide!</p>
          {!user ? (
            <div className="cta-buttons">
              <button className="login-button" onClick={() => setShowLoginModal(true)}>Log In/Register</button>
            </div>
          ) : (
            <div className="welcome-message">
              <p>Welcome back, {user.username}! You have {user.chips} chips.</p>
              <button className="logout-button" onClick={handleLogout}>Log Out</button>
            </div>
          )}
        </div>

        {showLoginModal && (
          <LoginPage handleLogin={handleLogin} onClose={() => setShowLoginModal(false)} />
        )}
      </main>
      <footer className="footer">
        <p>© 2023 Reem Team. All rights reserved.</p>
        <div className="social-links">
          <a href="https://facebook.com/reemteam" target="_blank" rel="noopener noreferrer">Facebook</a>
          <a href="https://twitter.com/reemteam" target="_blank" rel="noopener noreferrer">Twitter</a>
          <a href="https://instagram.com/reemteam" target="_blank" rel="noopener noreferrer">Instagram</a>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;