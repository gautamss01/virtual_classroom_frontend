import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { SocketProvider } from './contexts/SocketContext';
import Home from './pages/Home';
import ClassroomPage from './pages/ClassroomPage';
import ReportsPage from './pages/ReportsPage';
import './App.css';

function App() {
  return (
    <Router>
      <SocketProvider>
        <div className="App">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/classroom/:roomId" element={<ClassroomPage />} />
            <Route path="/reports/:roomId" element={<ReportsPage />} />
          </Routes>
        </div>
      </SocketProvider>
    </Router>
  );
}

export default App;
