import { useAuth } from '../contexts/AuthContext';

function Sidebar({ currentPage, setCurrentPage }) {
    const { user, logout } = useAuth();

    return (
        <div className="sidebar">
            <div className="sidebar-header">
                <div className="user-profile">
                    <div className="user-avatar">👤</div>
                    <div className="user-info">
                        <h3>{user?.name || 'Welcome'}</h3>
                        <p>{user?.seat_number ? `Място ${user.seat_number}` : 'Market Data UK'}</p>
                    </div>
                </div>
            </div>

            <nav className="nav-menu">
                <div 
                    className={`nav-item ${currentPage === 'home' ? 'active' : ''}`} 
                    onClick={() => setCurrentPage('home')}
                >
                    <i className="fas fa-home"></i>
                    <span>Home</span>
                </div>
                <div 
                    className={`nav-item ${currentPage === 'calendar' ? 'active' : ''}`} 
                    onClick={() => setCurrentPage('calendar')}
                >
                    <i className="fas fa-calendar"></i>
                    <span>Office Calendar</span>
                </div>
                <div 
                    className={`nav-item ${currentPage === 'seats' ? 'active' : ''}`} 
                    onClick={() => setCurrentPage('seats')}
                >
                    <i className="fas fa-chair"></i>
                    <span>Seats</span>
                </div>
                <div 
                    className={`nav-item ${currentPage === 'events' ? 'active' : ''}`} 
                    onClick={() => setCurrentPage('events')}
                >
                    <i className="fas fa-calendar-check"></i>
                    <span>Events</span>
                </div>
            </nav>

            <div className="sidebar-footer">
                <button 
                    className="contact-btn" 
                    onClick={logout}
                    style={{
                        background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem'
                    }}
                >
                    <i className="fas fa-sign-out-alt"></i>
                    Изход
                </button>
            </div>
        </div>
    );
}

export default Sidebar;


