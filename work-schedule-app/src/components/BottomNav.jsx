function BottomNav({ currentPage, setCurrentPage }) {
    return (
        <div className="bottom-nav">
            <div className="bottom-nav-items">
                <div 
                    className={`bottom-nav-item ${currentPage === 'home' ? 'active' : ''}`} 
                    onClick={() => setCurrentPage('home')}
                >
                    <i className="fas fa-home"></i>
                    <span>Home</span>
                </div>
                <div 
                    className={`bottom-nav-item ${currentPage === 'calendar' ? 'active' : ''}`} 
                    onClick={() => setCurrentPage('calendar')}
                >
                    <i className="fas fa-calendar"></i>
                    <span>Calendar</span>
                </div>
                <div 
                    className={`bottom-nav-item ${currentPage === 'seats' ? 'active' : ''}`} 
                    onClick={() => setCurrentPage('seats')}
                >
                    <i className="fas fa-chair"></i>
                    <span>Seats</span>
                </div>
            </div>
        </div>
    );
}

export default BottomNav;


