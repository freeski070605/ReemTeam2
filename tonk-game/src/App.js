import React from 'react';
import { UserProvider } from './components/UserContext';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './components/Home';
import GameBoard from './components/Gameboard';
import AiGameboard from './components/AiGameboard';
import UserProfilePage from './components/UserProfilePage';
import Lobby from './components/Lobby';
import TableComponent from './components/Table';
import Header from './components/Header';

const App = () => {
  return (
    <UserProvider>
      <Router>
        <Header />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/gameboard" element={<GameBoard />} />
          <Route path="/aigameboard" element={<AiGameboard />} />
          <Route path="/userprofile" element={<UserProfilePage />} />
          <Route path="/lobby" element={<Lobby />} />
          <Route path="/table/:tableId" element={<TableComponent />} />
        </Routes>
      </Router>
    </UserProvider>
  );
};

export default App;
