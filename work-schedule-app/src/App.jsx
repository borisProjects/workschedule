import { useState } from 'react';
import './App.css';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Sidebar from './components/Sidebar';
import BottomNav from './components/BottomNav';
import Home from './pages/Home';
import Calendar from './pages/Calendar';
import Seats from './pages/Seats';
import Events from './pages/Events';
import Login from './pages/Login';

function AppContent() {
  const [currentPage, setCurrentPage] = useState('home');
  const { isAuthenticated, loading } = useAuth();

  // Показваме loading screen докато проверяваме дали потребителят е логнат
  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        flexDirection: 'column',
        gap: '1rem'
      }}>
        <div style={{ fontSize: '3rem' }}>⏳</div>
        <div style={{ fontSize: '1.2rem', color: 'var(--text-secondary)' }}>
          Зареждане...
        </div>
      </div>
    );
  }

  // Ако потребителят не е логнат, показваме Login страницата
  if (!isAuthenticated) {
    return <Login />;
  }

  // Ако потребителят е логнат, показваме главното приложение
  return (
    <div className="app-container">
      <Sidebar currentPage={currentPage} setCurrentPage={setCurrentPage} />
      <main className="main-content">
        {currentPage === 'home' && <Home setCurrentPage={setCurrentPage} />}
        {currentPage === 'calendar' && <Calendar />}
        {currentPage === 'seats' && <Seats />}
        {currentPage === 'events' && <Events />}
      </main>
      <BottomNav currentPage={currentPage} setCurrentPage={setCurrentPage} />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;


