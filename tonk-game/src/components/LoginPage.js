import React, { useState } from 'react';
import Modal from 'react-modal';
import AuthService from './AuthService'; // Ensure the path is correct
import { useNavigate } from 'react-router-dom';

const LoginPage = ({ handleLogin, onClose }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [modalIsOpen, setModalIsOpen] = useState(true);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    try {
      let response;
      if (isRegistering) {
        response = await AuthService.register(username, email, password);
      } else {
        response = await AuthService.login(username, password);
      }
  
      if (response.success) {
        handleLogin(username, password);
        closeModal();
        navigate('/userprofile'); // Adjust the route as per your application
      } else {
        console.log(response.error);
        setErrorMessage(response.error);
      }
    } catch (error) {
      console.error('Authentication error:', error);
      setErrorMessage('Failed to authenticate. Please try again.');
    }
  };

  const closeModal = () => {
    setModalIsOpen(false);
    if (onClose) {
      onClose();
    }
  };

  return (
    <Modal isOpen={modalIsOpen} onRequestClose={closeModal} appElement={document.getElementById('root')}>
      <h2>{isRegistering ? 'Register' : 'Login'}</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
        {isRegistering && (
          <input
            type="email"
            placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        )}
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit">{isRegistering ? 'Register' : 'Login'}</button>
        <button type="button" onClick={() => setIsRegistering(!isRegistering)}>
          {isRegistering ? 'Switch to Login' : 'Switch to Register'}
        </button>
        {errorMessage && <p className="error-message">{errorMessage}</p>}
      </form>
    </Modal>
  );
};

export default LoginPage;
