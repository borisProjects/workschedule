import { useState } from 'react';
import { getDayStatus, getStatusDescription, formatDate } from '../utils/schedule';
import { MONTH_NAMES } from '../data/constants';

function Calendar() {
    const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
    const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

    const generateCalendar = (month, year) => {
        const firstDay = new Date(year, month, 1);
        const startDate = new Date(firstDay);
        
        const dayOfWeek = firstDay.getDay();
        const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        startDate.setDate(firstDay.getDate() - daysToMonday);
        
        const calendar = [];
        const today = new Date();
        
        for (let week = 0; week < 6; week++) {
            for (let day = 0; day < 7; day++) {
                const currentDate = new Date(startDate);
                currentDate.setDate(startDate.getDate() + (week * 7) + day);
                
                calendar.push({
                    date: new Date(currentDate),
                    dayNumber: currentDate.getDate(),
                    isCurrentMonth: currentDate.getMonth() === month,
                    isToday: currentDate.toDateString() === today.toDateString(),
                    status: getDayStatus(currentDate)
                });
            }
        }
        
        return calendar;
    };

    const calendar = generateCalendar(currentMonth, currentYear);
    const today = new Date();
    const status = getDayStatus(today);

    const handlePrevMonth = () => {
        if (currentMonth === 0) {
            setCurrentMonth(11);
            setCurrentYear(currentYear - 1);
        } else {
            setCurrentMonth(currentMonth - 1);
        }
    };

    const handleNextMonth = () => {
        if (currentMonth === 11) {
            setCurrentMonth(0);
            setCurrentYear(currentYear + 1);
        } else {
            setCurrentMonth(currentMonth + 1);
        }
    };

    const handleToday = () => {
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
                    <span>Офис</span>
                </div>
                <div className="legend-item">
                    <div className="legend-color remote"></div>
                    <span>Вкъщи</span>
                </div>
                <div className="legend-item">
                    <div className="legend-color weekend"></div>
                    <span>Уикенд</span>
                </div>
            </div>

            <div className="calendar-container">
                <div className="calendar-header">
                    <div className="calendar-nav-group">
                        <button className="nav-btn" onClick={handlePrevMonth}>
                            <i className="fas fa-chevron-left"></i>
                        </button>
                        <h2>{MONTH_NAMES[currentMonth]} {currentYear}</h2>
                        <button className="nav-btn" onClick={handleNextMonth}>
                            <i className="fas fa-chevron-right"></i>
                        </button>
                    </div>
                </div>

                <div className="calendar-grid">
                    {['Пон', 'Вто', 'Сря', 'Чет', 'Пет', 'Съб', 'Нед'].map(day => (
                        <div key={day} className="weekday">{day}</div>
                    ))}
                    {calendar.map((day, index) => (
                        <div
                            key={index}
                            className={`calendar-day ${day.status} ${!day.isCurrentMonth ? 'other-month' : ''} ${day.isToday ? 'today' : ''}`}
                        >
                            <div className="day-number">{day.dayNumber}</div>
                            <div className="day-status">{getStatusDescription(day.status)}</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default Calendar;

