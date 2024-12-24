import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import LoginPage from './LoginPage';
import AuthService from './AuthService';
import './Header.css';

const HomePage = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [username, setUsername] = useState('');
  const [chips, setChips] = useState();
  const navigate = useNavigate();

  // useEffect(() => {
  //   fetchUserData();
  // }, []);

  const fetchUserData = async () => {
    try {
      const response = await AuthService.getCurrentUser();
      console.log('User data:', response);

      if (response && response.user) {
        const user = response.user;
        setIsLoggedIn(true);
        setUsername(user.username);
        setChips(user.chips);
      } else {
        navigate('/');
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      navigate('/');
    }
  };

  useEffect(() => {
    fetchUserData();
  }, [navigate]);

  const handleLogin = async (username, password) => {
    const result = await AuthService.login(username, password);
    if (result.success) {
      setIsLoggedIn(true);
      setShowLoginModal(false);
      navigate('/userprofile');
    } else {
      alert(result.error);
    }
  };

  const handleLogout = () => {
    AuthService.logout();
    setIsLoggedIn(false);
    navigate('/');
  };

  return (
    <div className="home-container">
      <main className="content">
        <div className="container">
          <section className="hero">
            <h2>Welcome to Tonk Game!</h2>
            {!isLoggedIn && (
              <div>
                <p>Log in or register to start playing.</p>
                <button className="login-button" onClick={() => setShowLoginModal(true)}>Log In</button>
              </div>
            )}
          </section>

          {showLoginModal && (
            <LoginPage handleLogin={handleLogin} onClose={() => setShowLoginModal(false)} />
          )}
        </div>
      </main>
    </div>
  );
};

export default HomePage;
