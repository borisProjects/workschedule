import { getDayStatus, getStatusDescription, formatDate, getNextOfficeDays } from '../utils/schedule';
import { OFFICE_SEATS } from '../data/constants';

function Home({ setCurrentPage }) {
    const today = new Date();
    const status = getDayStatus(today);
    const nextOfficeDays = getNextOfficeDays(today, 2);

    return (
        <div className="fade-in">
            <div className="content-header">
                <h1>🪰 Dashboard</h1>
                <div className="search-bar">
                    <input type="text" className="search-input" placeholder="Search..." />
                    <button className="icon-btn"><i className="fas fa-bell"></i></button>
                </div>
            </div>

            <div className="status-info">
                <h3>Днес: {formatDate(today)}</h3>
                <div className={`status-badge ${status}`}>
                    {status === 'office' && '🏢'} {getStatusDescription(status)}
                </div>
            </div>

            <div className="dashboard-grid">
                <div className="card">
                    <div className="card-header">
                        <h2 className="card-title">📅 Офис календар</h2>
                        <a href="#" className="card-link" onClick={(e) => { e.preventDefault(); setCurrentPage('calendar'); }}>
                            Виж пълен →
                        </a>
                    </div>
                    <div style={{ padding: '1.5rem' }}>
                        <h3 style={{ fontSize: '1rem', marginBottom: '1rem', color: 'var(--text-secondary)' }}>
                            Следващи офис дни:
                        </h3>
                        {nextOfficeDays.length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                {nextOfficeDays.map((day, index) => (
                                    <div 
                                        key={index} 
                                        style={{ 
                                            background: 'var(--secondary-bg)',
                                            padding: '1rem',
                                            borderRadius: '8px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '1rem',
                                            borderLeft: '3px solid var(--primary)'
                                        }}
                                    >
                                        <div style={{ 
                                            fontSize: '2rem',
                                            fontWeight: '700',
                                            color: 'var(--primary)',
                                            minWidth: '50px',
                                            textAlign: 'center'
                                        }}>
                                            {day.dayNumber}
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: '600', fontSize: '1rem' }}>
                                                {day.dayName}
                                            </div>
                                            <div style={{ 
                                                fontSize: '0.85rem', 
                                                color: 'var(--text-secondary)' 
                                            }}>
                                                {day.month}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem' }}>
                                Няма предстоящи офис дни
                            </p>
                        )}
                    </div>
                </div>

                <div className="card">
                    <div className="card-header">
                        <h2 className="card-title">🪑 Офис места</h2>
                        <a href="#" className="card-link" onClick={(e) => { e.preventDefault(); setCurrentPage('seats'); }}>
                            Виж всички →
                        </a>
                    </div>
                    <div style={{ textAlign: 'center', padding: '2rem' }}>
                        <div style={{ 
                            fontSize: '4rem', 
                            fontWeight: '800',
                            background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent'
                        }}>
                            {OFFICE_SEATS.length}
                        </div>
                        <div style={{ color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                            Места
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Home;

