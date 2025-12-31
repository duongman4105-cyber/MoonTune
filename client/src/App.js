import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
// QUAN TRỌNG: Phải dùng { } để import vì bên kia là export const (Named Export)
import { PlayerProvider } from './context/PlayerContext';
import { AuthProvider } from './context/AuthContext'; 

import Navbar from './components/Navbar';
import Home from './pages/Home';
import Player from './components/Player';
import Upload from './pages/Upload';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import SongDetail from './pages/SongDetail';

function App() {
  return (
    <AuthProvider>
      <PlayerProvider>
        <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <div className="App font-sans text-gray-900 bg-[#FAF7F2] min-h-screen">
            <Navbar />
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/upload" element={<Upload />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/song/:id" element={<SongDetail />} />
            </Routes>
            <Player />
          </div>
        </Router>
      </PlayerProvider>
    </AuthProvider>
  );
}

export default App;
