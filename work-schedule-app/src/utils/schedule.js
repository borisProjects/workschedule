import { WORK_SCHEDULE, DAY_NAMES, MONTH_NAMES } from '../data/constants';

export function getMondayOfWeek(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
}

export function isWorkDay(date) {
    const day = date.getDay();
    return day >= 1 && day <= 5;
}

export function isOfficeDay(date) {
    if (!isWorkDay(date)) return false;
    
    const startMonday = getMondayOfWeek(WORK_SCHEDULE.startDate);
    const currentMonday = getMondayOfWeek(date);
    const weeksDiff = Math.round((currentMonday - startMonday) / (7 * 24 * 60 * 60 * 1000));
    
    const totalWeeksInCycle = WORK_SCHEDULE.pattern.reduce((sum, p) => sum + p.weeks, 0);
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

export function getDayStatus(date) {
    if (!isWorkDay(date)) return 'weekend';
    return isOfficeDay(date) ? 'office' : 'remote';
}

export function getStatusDescription(status) {
    return status === 'office' ? 'Офис' : status === 'remote' ? 'Вкъщи' : 'Почивка';
}

export function formatDate(date) {
    return `${date.getDate()} ${MONTH_NAMES[date.getMonth()]} ${date.getFullYear()} (${DAY_NAMES[date.getDay()]})`;
}

export function getNextOfficeDays(fromDate = new Date(), count = 2) {
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


