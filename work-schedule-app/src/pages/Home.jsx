import { useState, useEffect } from 'react';
import { getDayStatus, getStatusDescription, formatDate, getNextOfficeDays } from '../utils/schedule';
import { OFFICE_SEATS } from '../data/constants';
import { supabase } from '../config/supabase';
import { useAuth } from '../contexts/AuthContext';

function Home({ setCurrentPage }) {
    const { isAdmin } = useAuth();
    const today = new Date();
    const status = getDayStatus(today);
    const nextOfficeDays = getNextOfficeDays(today, 2);
    const [upcomingEvents, setUpcomingEvents] = useState([]);
    const [loadingEvents, setLoadingEvents] = useState(true);
    const [nextBirthday, setNextBirthday] = useState(null);
    const [loadingBirthday, setLoadingBirthday] = useState(true);
    const [isDesktop, setIsDesktop] = useState(window.innerWidth > 768);

    useEffect(() => {
        const handleResize = () => {
            setIsDesktop(window.innerWidth > 768);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Зареждане на предстоящи събития
    useEffect(() => {
        const loadUpcomingEvents = async () => {
            try {
                const todayDate = new Date().toISOString().split('T')[0];
                
                const { data, error } = await supabase
                    .from('events')
                    .select('*')
                    .eq('is_active', true)
                    .gte('event_date', todayDate)
                    .order('event_date', { ascending: true })
                    .limit(3);

                if (error) throw error;

                setUpcomingEvents(data || []);
                setLoadingEvents(false);
            } catch (error) {
                console.error('Грешка при зареждане на събития:', error);
                setLoadingEvents(false);
            }
        };

        loadUpcomingEvents();
    }, []);

    // Зареждане на служители и намиране на следващия рожден ден
    useEffect(() => {
        const findNextBirthday = async () => {
            try {
                const { data, error } = await supabase
                    .from('employees')
                    .select('name, birthday')
                    .eq('is_active', true)
                    .not('birthday', 'is', null);

                if (error) throw error;

                if (!data || data.length === 0) {
                    setNextBirthday(null);
                    setLoadingBirthday(false);
                    return;
                }

                const today = new Date();
                const currentYear = today.getFullYear();
                const currentMonth = today.getMonth();
                const currentDay = today.getDate();

                // Намиране на следващия рожден ден
                let nextBirthdayData = null;
                let minDaysUntil = Infinity;

                data.forEach(employee => {
                    if (!employee.birthday) return;

                    const birthdayDate = new Date(employee.birthday);
                    const birthdayMonth = birthdayDate.getMonth();
                    const birthdayDay = birthdayDate.getDate();

                    // Създаваме дата за тази година
                    let birthdayThisYear = new Date(currentYear, birthdayMonth, birthdayDay);
                    
                    // Ако рожден денът вече е минал тази година, вземаме следващата година
                    if (birthdayThisYear < today) {
                        birthdayThisYear = new Date(currentYear + 1, birthdayMonth, birthdayDay);
                    }

                    const daysUntil = Math.ceil((birthdayThisYear - today) / (1000 * 60 * 60 * 24));

                    if (daysUntil < minDaysUntil) {
                        minDaysUntil = daysUntil;
                        nextBirthdayData = {
                            name: employee.name,
                            date: birthdayThisYear,
                            daysUntil: daysUntil
                        };
                    }
                });

                setNextBirthday(nextBirthdayData);
                setLoadingBirthday(false);
            } catch (error) {
                console.error('Грешка при зареждане на рождени дни:', error);
                setLoadingBirthday(false);
            }
        };

        findNextBirthday();
    }, []);

    return (
        <div className="fade-in">
            <div className="content-header">
                <h1>🪰 Dashboard</h1>
            </div>

            <div className="status-info" style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '1rem'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                    <h3>Днес: {formatDate(today)}</h3>
                    <div className={`status-badge ${status}`}>
                        {status === 'office' && '🏢'} {getStatusDescription(status)}
                    </div>
                </div>
                {isAdmin && isDesktop && (
                    <button
                        onClick={() => setCurrentPage('admin')}
                        style={{
                            background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                            color: 'white',
                            padding: '0.75rem 1.5rem',
                            borderRadius: '8px',
                            border: 'none',
                            cursor: 'pointer',
                            fontWeight: '600',
                            fontSize: '0.95rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)',
                            transition: 'all 0.3s ease',
                            whiteSpace: 'nowrap'
                        }}
                        onMouseEnter={(e) => {
                            e.target.style.transform = 'translateY(-2px)';
                            e.target.style.boxShadow = '0 6px 20px rgba(245, 158, 11, 0.4)';
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.transform = 'translateY(0)';
                            e.target.style.boxShadow = '0 4px 12px rgba(245, 158, 11, 0.3)';
                        }}
                    >
                        <i className="fas fa-crown"></i>
                        Администрация
                    </button>
                )}
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

                <div className="card">
                    <div className="card-header">
                        <h2 className="card-title">🎉 Евенти</h2>
                        <a href="#" className="card-link" onClick={(e) => { e.preventDefault(); setCurrentPage('events'); }}>
                            Виж всички →
                        </a>
                    </div>
                    <div style={{ padding: '1.5rem' }}>
                        {loadingEvents ? (
                            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                                ⏳ Зареждане...
                            </div>
                        ) : upcomingEvents.length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                {upcomingEvents.map((event, index) => {
                                    const eventDate = new Date(event.event_date);
                                    const day = eventDate.getDate();
                                    const month = eventDate.toLocaleDateString('bg-BG', { month: 'long' });
                                    
                                    return (
                                        <div 
                                            key={index} 
                                            style={{ 
                                                background: 'var(--secondary-bg)',
                                                padding: '1rem',
                                                borderRadius: '8px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '1rem',
                                                borderLeft: '3px solid var(--secondary)',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s ease'
                                            }}
                                            onClick={() => setCurrentPage('events')}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.background = 'var(--border)';
                                                e.currentTarget.style.transform = 'translateX(5px)';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.background = 'var(--secondary-bg)';
                                                e.currentTarget.style.transform = 'translateX(0)';
                                            }}
                                        >
                                            <div style={{ 
                                                fontSize: '2rem',
                                                fontWeight: '700',
                                                color: 'var(--secondary)',
                                                minWidth: '50px',
                                                textAlign: 'center'
                                            }}>
                                                {day}
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontWeight: '600', fontSize: '1rem' }}>
                                                    {event.title}
                                                </div>
                                                <div style={{ 
                                                    fontSize: '0.85rem', 
                                                    color: 'var(--text-secondary)' 
                                                }}>
                                                    {month}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div style={{ textAlign: 'center', padding: '2rem' }}>
                                <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>📅</div>
                                <p style={{ color: 'var(--text-secondary)' }}>
                                    Няма предстоящи събития
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="card">
                    <div className="card-header">
                        <h2 className="card-title">🎂 Рожден ден</h2>
                    </div>
                    <div style={{ padding: '1.5rem' }}>
                        {loadingBirthday ? (
                            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                                ⏳ Зареждане...
                            </div>
                        ) : nextBirthday ? (
                            <div style={{ 
                                background: 'var(--secondary-bg)',
                                padding: '1rem',
                                borderRadius: '8px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '1rem',
                                borderLeft: '3px solid #f59e0b'
                            }}>
                                <div style={{ 
                                    fontSize: '2rem',
                                    fontWeight: '700',
                                    color: '#f59e0b',
                                    minWidth: '50px',
                                    textAlign: 'center'
                                }}>
                                    {nextBirthday.date.getDate()}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: '600', fontSize: '1rem' }}>
                                        {nextBirthday.name}
                                    </div>
                                    <div style={{ 
                                        fontSize: '0.85rem', 
                                        color: 'var(--text-secondary)' 
                                    }}>
                                        {nextBirthday.date.toLocaleDateString('bg-BG', { month: 'long' })}
                                        {nextBirthday.daysUntil === 0 && ' (днес!)'}
                                        {nextBirthday.daysUntil === 1 && ' (утре)'}
                                        {nextBirthday.daysUntil > 1 && ` (след ${nextBirthday.daysUntil} дни)`}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div style={{ textAlign: 'center', padding: '2rem' }}>
                                <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🎂</div>
                                <p style={{ color: 'var(--text-secondary)' }}>
                                    Няма предстоящи рождени дни
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Home;

