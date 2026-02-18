import { useState } from 'react';
import './App.css';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import Sidebar from './components/Sidebar';
import BottomNav from './components/BottomNav';
import Home from './pages/Home';
import Calendar from './pages/Calendar';
import Seats from './pages/Seats';
import Events from './pages/Events';
import Admin from './pages/Admin';
import Login from './pages/Login';

function AppContent() {
  const [currentPage, setCurrentPage] = useState('home');
  const { isAuthenticated, loading, isAdmin } = useAuth();

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
        {currentPage === 'admin' && isAdmin && <Admin />}
        {currentPage === 'admin' && !isAdmin && (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
            <h2>🚫 Нямате достъп до тази страница</h2>
          </div>
        )}
      </main>
      <BottomNav currentPage={currentPage} setCurrentPage={setCurrentPage} />
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;


