function Sidebar({ currentPage, setCurrentPage }) {
    return (
        <div className="sidebar">
            <div className="sidebar-header">
                <div className="user-profile">
                    <div className="user-avatar">🪰</div>
                    <div className="user-info">
                        <h3>Welcome</h3>
                        <p>Market Data UK</p>
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
            </nav>

            <div className="sidebar-footer">
                <button className="contact-btn">Contact Admin</button>
            </div>
        </div>
    );
}

export default Sidebar;


