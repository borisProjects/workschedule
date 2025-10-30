const { useState, useEffect } = React;

// Work Schedule Configuration
const WORK_SCHEDULE = {
    startDate: new Date(2025, 10, 3),
    pattern: [
        { days: [1, 2], weeks: 1 },
        { days: [3, 4], weeks: 1 },
        { days: [5], weeks: 1 }
    ]
};

const DAY_NAMES = {
    0: 'Неделя', 1: 'Понеделник', 2: 'Вторник', 3: 'Сряда',
    4: 'Четвъртък', 5: 'Петък', 6: 'Събота'
};

const MONTH_NAMES = [
    'януари', 'февруари', 'март', 'април', 'май', 'юни',
    'юли', 'август', 'септември', 'октомври', 'ноември', 'декември'
];

// Office Seats Data
const OFFICE_SEATS = [
    { number: '348', name: 'София Григорова' },
    { number: '347', name: 'Дарина Атанасова' },
    { number: '346', name: 'Емилия Чакърова' },
    { number: '345', name: 'Александър Тодоров' },
    { number: '352', name: 'Христина Нинова' },
    { number: '351', name: 'Мирослава Алексова' },
    { number: '350', name: 'Свободно' },
    { number: '349', name: 'Румен Алексов' },
    { number: '356', name: 'Гюлджан Ибрям' },
    { number: '355', name: 'Румен Иванов' },
    { number: '354', name: 'Пламен Пенков' },
    { number: '353', name: 'Борис Иванов' },
    { number: '360', name: 'Станислава Руйкова' },
    { number: '359', name: 'Виктория Йорданова' },
    { number: '358', name: 'Христина Хайдарлиева' },
    { number: '357', name: 'Татяна Демирева' },
    { number: '364', name: 'Свободно' },
    { number: '363', name: 'Свободно' },
    { number: '362', name: 'Свободно' },
    { number: '361', name: 'Свободно' },
    { number: '368', name: 'Боян Гечев' },
    { number: '367', name: 'Лъчезар Хумбаджиев' },
    { number: '366', name: 'Виолета Масларска' },
    { number: '365', name: 'Радослав Николов' }
];

// Utility Functions
function getMondayOfWeek(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
}

function isWorkDay(date) {
    const day = date.getDay();
    return day >= 1 && day <= 5;
}

function isOfficeDay(date) {
    if (!isWorkDay(date)) return false;
    
    const startMonday = getMondayOfWeek(WORK_SCHEDULE.startDate);
    const currentMonday = getMondayOfWeek(date);
    const weeksDiff = Math.round((currentMonday - startMonday) / (7 * 24 * 60 * 60 * 1000));
    
    const totalWeeksInCycle = WORK_SCHEDULE.pattern.reduce((sum, pattern) => sum + pattern.weeks, 0);
    const cyclePosition = ((weeksDiff % totalWeeksInCycle) + totalWeeksInCycle) % totalWeeksInCycle;
    const dayOfWeek = date.getDay();
    
    let weekCount = 0;
    for (const pattern of WORK_SCHEDULE.pattern) {
        if (cyclePosition >= weekCount && cyclePosition < weekCount + pattern.weeks) {
            return pattern.days.includes(dayOfWeek);
        }
        weekCount += pattern.weeks;
    }
    return false;
}

function getDayStatus(date) {
    if (!isWorkDay(date)) return 'weekend';
    return isOfficeDay(date) ? 'office' : 'remote';
}

function getStatusDescription(status) {
    switch(status) {
        case 'office': return 'В офиса';
        case 'remote': return 'От вкъщи';
        case 'weekend': return 'Почивка';
        default: return '';
    }
}

function formatDate(date) {
    const day = date.getDate();
    const month = MONTH_NAMES[date.getMonth()];
    const year = date.getFullYear();
    const dayName = DAY_NAMES[date.getDay()];
    return `${day} ${month} ${year} (${dayName})`;
}

function getNextOfficeDays(fromDate = new Date(), count = 2) {
    const officeDays = [];
    const searchDate = new Date(fromDate);
    searchDate.setDate(searchDate.getDate() + 1);
    
    for (let i = 0; i < 60 && officeDays.length < count; i++) {
        if (isOfficeDay(searchDate)) {
            officeDays.push({
                date: new Date(searchDate),
                dayName: DAY_NAMES[searchDate.getDay()],
                dayNumber: searchDate.getDate(),
                month: MONTH_NAMES[searchDate.getMonth()],
                shortDate: `${searchDate.getDate()}.${(searchDate.getMonth() + 1).toString().padStart(2, '0')}`
            });
        }
        searchDate.setDate(searchDate.getDate() + 1);
    }
    
    return officeDays;
}

// Sidebar Component
function Sidebar({ currentPage, setCurrentPage }) {
    const menuItems = [
        { id: 'home', icon: 'fa-home', label: 'Home' },
        { id: 'calendar', icon: 'fa-calendar', label: 'Office Calendar' },
        { id: 'seats', icon: 'fa-chair', label: 'Seats' }
    ];

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
                {menuItems.map(item => (
                    <div
                        key={item.id}
                        className={`nav-item ${currentPage === item.id ? 'active' : ''}`}
                        onClick={() => setCurrentPage(item.id)}
                    >
                        <i className={`fas ${item.icon}`}></i>
                        <span>{item.label}</span>
                    </div>
                ))}
            </nav>

            <div className="sidebar-footer">
                <button className="contact-admin-btn">
                    <i className="fas fa-envelope"></i> Contact Admin
                </button>
            </div>
        </div>
    );
}

// Home Component
function Home() {
    const today = new Date();
    const status = getDayStatus(today);
    const statusText = getStatusDescription(status);
    const nextOfficeDays = getNextOfficeDays(today, 2);

    return (
        <div className="fade-in">
            <div className="content-header">
                <h1>🪰 Dashboard</h1>
                <div className="search-bar">
                    <input type="text" className="search-input" placeholder="Search..." />
                    <button className="icon-btn">
                        <i className="fas fa-bell"></i>
                    </button>
                </div>
            </div>

            <div className="status-info">
                <h3>Днес: {formatDate(today)}</h3>
                <div className={`status-badge ${status}`}>
                    {status === 'office' && '🏢'} {statusText}
                </div>
            </div>

            <div className="dashboard-grid">
                <div className="card">
                    <div className="card-header">
                        <h2 className="card-title">📅 Офис календар</h2>
                        <a href="#" className="card-link">Виж пълен →</a>
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
                                            borderLeft: '3px solid var(--accent-cyan)'
                                        }}
                                    >
                                        <div style={{ 
                                            fontSize: '2rem',
                                            fontWeight: '700',
                                            color: 'var(--accent-cyan)',
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
                        <a href="#" className="card-link">Виж всички →</a>
                    </div>
                    <div style={{ textAlign: 'center', padding: '2rem' }}>
                        <div style={{ 
                            fontSize: '4rem', 
                            fontWeight: '800',
                            background: 'linear-gradient(135deg, #00d4ff, #00c9a7)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            marginBottom: '0.5rem'
                        }}>
                            {OFFICE_SEATS.length}
                        </div>
                        <div style={{ color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                            Места
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Calendar Component
function Calendar() {
    const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
    const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

    const generateCalendar = (month, year) => {
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const startDate = new Date(firstDay);
        
        const dayOfWeek = firstDay.getDay();
        const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        startDate.setDate(firstDay.getDate() - daysToMonday);
        
        const calendar = [];
        const today = new Date();
        
        for (let week = 0; week < 6; week++) {
            const weekDays = [];
            for (let day = 0; day < 7; day++) {
                const currentDate = new Date(startDate);
                currentDate.setDate(startDate.getDate() + (week * 7) + day);
                
                const isCurrentMonth = currentDate.getMonth() === month;
                const isToday = currentDate.toDateString() === today.toDateString();
                const status = getDayStatus(currentDate);
                
                weekDays.push({
                    date: new Date(currentDate),
                    dayNumber: currentDate.getDate(),
                    isCurrentMonth,
                    isToday,
                    status
                });
            }
            calendar.push(weekDays);
        }
        
        return calendar;
    };

    const calendar = generateCalendar(currentMonth, currentYear);
    const today = new Date();
    const status = getDayStatus(today);

    const goToPrevMonth = () => {
        if (currentMonth === 0) {
            setCurrentMonth(11);
            setCurrentYear(currentYear - 1);
        } else {
            setCurrentMonth(currentMonth - 1);
        }
    };

    const goToNextMonth = () => {
        if (currentMonth === 11) {
            setCurrentMonth(0);
            setCurrentYear(currentYear + 1);
        } else {
            setCurrentMonth(currentMonth + 1);
        }
    };

    const goToToday = () => {
        setCurrentMonth(new Date().getMonth());
        setCurrentYear(new Date().getFullYear());
    };

    return (
        <div className="fade-in">
            <div className="content-header">
                <h1>📅 Офис календар</h1>
            </div>

            <div className="status-info">
                <h3>Днес: {formatDate(today)}</h3>
                <div className={`status-badge ${status}`}>
                    {status === 'office' && '🏢'} {getStatusDescription(status)}
                </div>
            </div>

            <div className="legend">
                <div className="legend-item">
                    <div className="legend-color office"></div>
                    <span>В офиса</span>
                </div>
                <div className="legend-item">
                    <div className="legend-color remote"></div>
                    <span>От вкъщи</span>
                </div>
                <div className="legend-item">
                    <div className="legend-color weekend"></div>
                    <span>Уикенд</span>
                </div>
            </div>

            <div className="calendar-container">
                <div className="calendar-header">
                    <h2>{MONTH_NAMES[currentMonth]} {currentYear}</h2>
                    <div className="calendar-controls">
                        <button className="nav-btn" onClick={goToPrevMonth}>
                            <i className="fas fa-chevron-left"></i>
                        </button>
                        <button className="today-btn" onClick={goToToday}>Днес</button>
                        <button className="nav-btn" onClick={goToNextMonth}>
                            <i className="fas fa-chevron-right"></i>
                        </button>
                    </div>
                </div>

                <div className="calendar-grid">
                    <div className="calendar-weekdays">
                        {['Пон', 'Вто', 'Сря', 'Чет', 'Пет', 'Съб', 'Нед'].map(day => (
                            <div key={day} className="weekday">{day}</div>
                        ))}
                    </div>
                    <div className="calendar-days">
                        {calendar.flat().map((day, index) => (
                            <div
                                key={index}
                                className={`calendar-day ${day.status} ${
                                    !day.isCurrentMonth ? 'other-month' : ''
                                } ${day.isToday ? 'today' : ''}`}
                            >
                                <div className="day-number">{day.dayNumber}</div>
                                <div className="day-status">{getStatusDescription(day.status)}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

// Seats Component
function Seats() {
    return (
        <div className="fade-in">
            <div className="content-header">
                <h1>🪑 Офис места</h1>
            </div>

            <div className="office-seats-grid">
                {OFFICE_SEATS.map((seat, index) => (
                    <div key={index} className="office-seat">
                        <div className="seat-number">{seat.number}</div>
                        <div className={seat.name === 'Свободно' ? 'seat-empty' : 'seat-name'}>
                            {seat.name}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// Main App Component
function App() {
    const [currentPage, setCurrentPage] = useState('home');

    const renderPage = () => {
        switch(currentPage) {
            case 'home':
                return <Home />;
            case 'calendar':
                return <Calendar />;
            case 'seats':
                return <Seats />;
            default:
                return <Home />;
        }
    };

    return (
        <div className="app-container">
            <Sidebar currentPage={currentPage} setCurrentPage={setCurrentPage} />
            <main className="main-content">
                {renderPage()}
            </main>
        </div>
    );
}

// Render App
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);

