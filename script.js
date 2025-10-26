// Конфигурация на работния график
const WORK_SCHEDULE = {
    // Начална дата: 27.10.2025 (понеделник) - първата седмица с понеделник и вторник
    startDate: new Date(2025, 9, 27), // Месецът е 0-базиран, така че 9 = октомври
    
    // График: 3-седмичен цикъл
    pattern: [
        { days: [1, 2], weeks: 1 }, // Седмица 1: Понеделник (1) и вторник (2)
        { days: [3, 4], weeks: 1 }, // Седмица 2: Сряда (3) и четвъртък (4)
        { days: [5], weeks: 1 }     // Седмица 3: Петък (5)
    ]
};

// Имена на дните на български
const DAY_NAMES = {
    0: 'Неделя',
    1: 'Понеделник',
    2: 'Вторник', 
    3: 'Сряда',
    4: 'Четвъртък',
    5: 'Петък',
    6: 'Събота'
};

// Имена на месеците на български
const MONTH_NAMES = [
    'януари', 'февруари', 'март', 'април', 'май', 'юни',
    'юли', 'август', 'септември', 'октомври', 'ноември', 'декември'
];

// Текущ избран месец
let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();

// Текущ активен календар
let activeCalendar = 'office'; // 'office' или 'qc'

// Проверка дали устройството е мобилно
function isMobile() {
    return window.innerWidth <= 768;
}

// Функция за форматиране на дата
function formatDate(date) {
    const day = date.getDate();
    const month = MONTH_NAMES[date.getMonth()];
    const year = date.getFullYear();
    const dayName = DAY_NAMES[date.getDay()];
    
    return `${day} ${month} ${year} (${dayName})`;
}

// Функция за проверка дали датата е работен ден (понеделник-петък)
function isWorkDay(date) {
    const day = date.getDay();
    return day >= 1 && day <= 5; // Понеделник до петък
}

// Функция за получаване на понеделника от седмицата на дадена дата
function getMondayOfWeek(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Коригираме за неделя
    return new Date(d.setDate(diff));
}

// Функция за определяне дали датата е офис ден
function isOfficeDay(date) {
    if (!isWorkDay(date)) return false;
    
    // Намираме понеделника на седмицата за началната дата и текущата дата
    const startMonday = getMondayOfWeek(WORK_SCHEDULE.startDate);
    const currentMonday = getMondayOfWeek(date);
    
    // Изчисляваме колко седмици са минали от началната седмица
    const weeksDiff = Math.round((currentMonday - startMonday) / (7 * 24 * 60 * 60 * 1000));
    
    // Определяме в кой цикъл сме (работи и за отрицателни стойности)
    const totalWeeksInCycle = WORK_SCHEDULE.pattern.reduce((sum, pattern) => sum + pattern.weeks, 0);
    const cyclePosition = ((weeksDiff % totalWeeksInCycle) + totalWeeksInCycle) % totalWeeksInCycle;
    
    // Определяме кой ден от седмицата е
    const dayOfWeek = date.getDay();
    
    // Проверяваме дали денят е в текущия цикъл
    let weekCount = 0;
    for (const pattern of WORK_SCHEDULE.pattern) {
        if (cyclePosition >= weekCount && cyclePosition < weekCount + pattern.weeks) {
            return pattern.days.includes(dayOfWeek);
        }
        weekCount += pattern.weeks;
    }
    
    return false;
}

// Функция за получаване на статуса на ден
function getDayStatus(date) {
    if (!isWorkDay(date)) {
        return 'weekend';
    }
    return isOfficeDay(date) ? 'office' : 'remote';
}

// Функция за получаване на описание на статуса
function getStatusDescription(status) {
    switch(status) {
        case 'office': return 'В офиса';
        case 'remote': return 'От вкъщи';
        case 'weekend': return 'Почивка';
        case 'weekly-qc': return 'Weekly QC';
        case 'monthly-qc': return 'Monthly QC';
        case 'no-qc': return 'Без QC';
        default: return '';
    }
}

// Функция за намиране на първата пълна седмица Понеделник-Петък
function getFirstFullWeekRange(year, month) {
    // Намираме първия понеделник от месеца
    const firstDayOfMonth = new Date(year, month, 1);
    let firstMonday = new Date(firstDayOfMonth);
    
    // Ако първият ден не е понеделник, намираме следващия понеделник
    const firstDayWeekday = firstDayOfMonth.getDay();
    if (firstDayWeekday === 0) {
        // Ако е неделя, първият понеделник е след 1 ден
        firstMonday.setDate(firstDayOfMonth.getDate() + 1);
    } else if (firstDayWeekday > 1) {
        // Ако е вторник или по-късно, преминаваме към следващия понеделник
        firstMonday.setDate(firstDayOfMonth.getDate() + (8 - firstDayWeekday));
    }
    // Ако е понеделник (1), firstMonday вече е правилен
    
    // Първият петък от седмицата е след 4 дни
    const firstFriday = new Date(firstMonday);
    firstFriday.setDate(firstMonday.getDate() + 4);
    
    return {
        mondayDate: firstMonday.getDate(),
        fridayDate: firstFriday.getDate()
    };
}

// Функция за определяне на QC статус за дадена дата
function getQCStatus(date) {
    const dayOfWeek = date.getDay();
    const dayOfMonth = date.getDate();
    const year = date.getFullYear();
    const month = date.getMonth();
    
    // Уикенди - без QC
    if (dayOfWeek === 0 || dayOfWeek === 6) {
        return 'no-qc';
    }
    
    // Намираме първата пълна седмица Понеделник-Петък
    const firstWeek = getFirstFullWeekRange(year, month);
    
    // Проверка дали сме в първата пълна седмица (Понеделник-Петък)
    if (dayOfMonth >= firstWeek.mondayDate && dayOfMonth <= firstWeek.fridayDate) {
        // Monthly QC за цялата първа седмица
        return 'monthly-qc';
    }
    
    // Всички други седмици: само Weekly QC в Сряда и Четвъртък
    if (dayOfWeek === 3 || dayOfWeek === 4) {
        return 'weekly-qc';
    }
    
    // Останалите дни - без QC
    return 'no-qc';
}

// Функция за намиране на последния работен ден в месеца
function isLastWorkingDayOfMonth(date) {
    const year = date.getFullYear();
    const month = date.getMonth();
    
    // Намираме последния ден от месеца
    const lastDayOfMonth = new Date(year, month + 1, 0);
    
    // Търсим последния работен ден (понеделник-петък)
    let lastWorkingDay = new Date(lastDayOfMonth);
    
    while (lastWorkingDay.getDay() === 0 || lastWorkingDay.getDay() === 6) {
        lastWorkingDay.setDate(lastWorkingDay.getDate() - 1);
    }
    
    // Проверяваме дали датата е последният работен ден
    return date.getDate() === lastWorkingDay.getDate() && 
           date.getMonth() === lastWorkingDay.getMonth() &&
           date.getFullYear() === lastWorkingDay.getFullYear();
}

// Функция за намиране на следващия офис ден
function getNextOfficeDay(fromDate) {
    const searchDate = new Date(fromDate);
    searchDate.setDate(searchDate.getDate() + 1); // Започваме от утре
    
    // Търсим максимум 30 дни напред
    for (let i = 0; i < 30; i++) {
        if (isOfficeDay(searchDate)) {
            return new Date(searchDate);
        }
        searchDate.setDate(searchDate.getDate() + 1);
    }
    
    return null;
}

// Функция за показване на текущата дата и статус
function showCurrentStatus() {
    const today = new Date();
    const currentDateElement = document.getElementById('currentDate');
    const todayStatusElement = document.getElementById('todayStatus');
    
    currentDateElement.textContent = formatDate(today);
    
    let statusText = '';
    let statusClass = '';
    
    if (activeCalendar === 'office') {
        const status = getDayStatus(today);
        const nextOfficeDay = getNextOfficeDay(today);
        
        if (status === 'office') {
            statusText = '🏢 Днес трябва да съм в офиса';
            statusClass = 'status office';
        } else {
            if (nextOfficeDay) {
                const nextDay = DAY_NAMES[nextOfficeDay.getDay()];
                const nextDate = `${nextOfficeDay.getDate()}.${(nextOfficeDay.getMonth() + 1).toString().padStart(2, '0')}`;
                todayStatusElement.innerHTML = `🏢 Следващ офис ден: <strong>${nextDay}, ${nextDate}</strong>`;
                todayStatusElement.className = 'status remote';
                return;
            } else {
                statusText = '🏠 Работя от вкъщи';
                statusClass = 'status remote';
            }
        }
    } else if (activeCalendar === 'qc') {
        const qcStatus = getQCStatus(today);
        
        if (qcStatus === 'monthly-qc') {
            statusText = '📋 Днес имаме Monthly QC';
            statusClass = 'status monthly-qc';
        } else if (qcStatus === 'weekly-qc') {
            statusText = '📋 Днес имаме Weekly QC';
            statusClass = 'status weekly-qc';
        } else {
            statusText = '✅ Днес няма QC';
            statusClass = 'status remote';
        }
    }
    
    todayStatusElement.textContent = statusText;
    todayStatusElement.className = statusClass;
}

// Функция за генериране на календар за месец
function generateCalendar(month, year) {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    
    // Намираме първия ден от седмицата (понеделник)
    const dayOfWeek = firstDay.getDay();
    const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    startDate.setDate(firstDay.getDate() - daysToMonday);
    
    const calendar = [];
    const today = new Date();
    
    // Генерираме 6 седмици (42 дни) за да покрием целия месец
    for (let week = 0; week < 6; week++) {
        const weekDays = [];
        for (let day = 0; day < 7; day++) {
            const currentDate = new Date(startDate);
            currentDate.setDate(startDate.getDate() + (week * 7) + day);
            
            const isCurrentMonth = currentDate.getMonth() === month;
            const isToday = currentDate.toDateString() === today.toDateString();
            
            // Определяме статуса според активния календар
            const status = activeCalendar === 'office' ? getDayStatus(currentDate) : getQCStatus(currentDate);
            
            weekDays.push({
                date: new Date(currentDate),
                dayNumber: currentDate.getDate(),
                isCurrentMonth: isCurrentMonth,
                isToday: isToday,
                status: status
            });
        }
        calendar.push(weekDays);
    }
    
    return calendar;
}

// Функция за показване на календара
function showCalendar() {
    const calendarDays = document.getElementById('calendarDays');
    const currentMonthYear = document.getElementById('currentMonthYear');
    
    // Показваме текущия месец и година
    currentMonthYear.textContent = `${MONTH_NAMES[currentMonth]} ${currentYear}`;
    
    // Генерираме календара
    const calendar = generateCalendar(currentMonth, currentYear);
    
    calendarDays.innerHTML = '';
    
    calendar.forEach((week, weekIndex) => {
        week.forEach((day, dayIndex) => {
            const dayElement = document.createElement('div');
            dayElement.className = `calendar-day ${day.status}`;
            dayElement.setAttribute('role', 'gridcell');
            dayElement.setAttribute('aria-label', `${day.dayNumber} ${MONTH_NAMES[day.date.getMonth()]} ${day.date.getFullYear()}, ${getStatusDescription(day.status)}`);
            
            if (!day.isCurrentMonth) {
                dayElement.classList.add('other-month');
            }
            
            if (day.isToday) {
                dayElement.classList.add('today');
                dayElement.setAttribute('aria-current', 'date');
            }
            
            // Проверка за последен работен ден от месеца (само за офис календар)
            const isPayday = activeCalendar === 'office' && day.isCurrentMonth && isLastWorkingDayOfMonth(day.date);
            if (isPayday) {
                dayElement.classList.add('payday');
            }
            
            const dayNumber = document.createElement('div');
            dayNumber.className = 'day-number';
            dayNumber.textContent = day.dayNumber;
            
            const dayStatus = document.createElement('div');
            dayStatus.className = 'day-status';
            
            // Ако е ден на заплата, показваме само заплата
            if (isPayday) {
                // На мобилни - без емоджи, на desktop - с емоджи
                if (isMobile()) {
                    dayStatus.textContent = 'Заплата';
                } else {
                    dayStatus.textContent = '💰 Заплата 💰';
                }
            } else {
                dayStatus.textContent = getStatusDescription(day.status);
            }
            
            dayElement.appendChild(dayNumber);
            dayElement.appendChild(dayStatus);
            
            // Добавяме touch events за мобилни устройства
            if (isMobile()) {
                dayElement.addEventListener('touchstart', () => {
                    dayElement.style.transform = 'scale(0.95)';
                });
                
                dayElement.addEventListener('touchend', () => {
                    dayElement.style.transform = '';
                });
            }
            
            calendarDays.appendChild(dayElement);
        });
    });
}

// Функция за навигация към предишен месец
function goToPreviousMonth() {
    currentMonth--;
    if (currentMonth < 0) {
        currentMonth = 11;
        currentYear--;
    }
    showCalendar();
    
    // Добавяме haptic feedback за мобилни устройства
    if (navigator.vibrate) {
        navigator.vibrate(50);
    }
}

// Функция за навигация към следващ месец
function goToNextMonth() {
    currentMonth++;
    if (currentMonth > 11) {
        currentMonth = 0;
        currentYear++;
    }
    showCalendar();
    
    // Добавяме haptic feedback за мобилни устройства
    if (navigator.vibrate) {
        navigator.vibrate(50);
    }
}

// Функция за навигация към текущия ден
function goToToday() {
    const today = new Date();
    currentMonth = today.getMonth();
    currentYear = today.getFullYear();
    showCalendar();
    
    // Добавяме haptic feedback за мобилни устройства
    if (navigator.vibrate) {
        navigator.vibrate(50);
    }
    
    // Добавяме визуална обратна връзка
    const todayBtn = document.getElementById('goToToday');
    todayBtn.style.transform = 'scale(0.95)';
    setTimeout(() => {
        todayBtn.style.transform = '';
    }, 150);
}

// Функция за обработка на клавиатурни съкращения
function handleKeyboardNavigation(event) {
    switch(event.key) {
        case 'ArrowLeft':
            event.preventDefault();
            goToPreviousMonth();
            break;
        case 'ArrowRight':
            event.preventDefault();
            goToNextMonth();
            break;
        case 'Home':
            event.preventDefault();
            goToToday();
            break;
        case 't':
        case 'T':
            event.preventDefault();
            goToToday();
            break;
    }
}

// Функция за обработка на swipe gestures за мобилни устройства
let touchStartX = 0;
let touchEndX = 0;
let touchStartY = 0;
let touchEndY = 0;

function handleTouchStart(event) {
    touchStartX = event.changedTouches[0].screenX;
    touchStartY = event.changedTouches[0].screenY;
}

function handleTouchEnd(event) {
    touchEndX = event.changedTouches[0].screenX;
    touchEndY = event.changedTouches[0].screenY;
    handleSwipe();
}

function handleSwipe() {
    const swipeThreshold = 50;
    const diffX = touchStartX - touchEndX;
    const diffY = touchStartY - touchEndY;
    
    // Проверяваме дали swipe-ът е предимно хоризонтален
    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > swipeThreshold) {
        if (diffX > 0) {
            // Swipe left - next month
            goToNextMonth();
        } else {
            // Swipe right - previous month
            goToPreviousMonth();
        }
    }
}

// Функция за подобрена мобилна навигация
function enhanceMobileNavigation() {
    if (isMobile()) {
        // Добавяме по-големи touch areas за мобилни устройства
        const navButtons = document.querySelectorAll('.nav-btn');
        navButtons.forEach(btn => {
            btn.addEventListener('touchstart', function() {
                this.style.transform = 'scale(0.9)';
            });
            
            btn.addEventListener('touchend', function() {
                this.style.transform = '';
            });
        });
        
        // Добавяме long press за бързо преминаване към днес
        let longPressTimer;
        const todayBtn = document.getElementById('goToToday');
        
        todayBtn.addEventListener('touchstart', function() {
            longPressTimer = setTimeout(() => {
                goToToday();
                if (navigator.vibrate) {
                    navigator.vibrate([100, 50, 100]);
                }
            }, 800);
        });
        
        todayBtn.addEventListener('touchend', function() {
            clearTimeout(longPressTimer);
        });
        
        todayBtn.addEventListener('touchmove', function() {
            clearTimeout(longPressTimer);
        });
    }
}

let lastRenderedDate = new Date();

function updateDateTime() {
    const now = new Date();
    showCurrentStatus();

    // Обновявай календара само ако е нов ден
    if (
        now.getDate() !== lastRenderedDate.getDate() ||
        now.getMonth() !== lastRenderedDate.getMonth() ||
        now.getFullYear() !== lastRenderedDate.getFullYear()
    ) {
        currentMonth = now.getMonth();
        currentYear = now.getFullYear();
        showCalendar();
        lastRenderedDate = now;
    }
}

function scheduleDayUpdate() {
    const now = new Date();
    // Изчисли колко ms до следващия ден (00:00:00)
    const nextDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0);
    const msToNextDay = nextDay - now;

    setTimeout(() => {
        updateDateTime(); // ще обнови календара и статуса
        scheduleDayUpdate(); // насрочи следващото обновяване
    }, msToNextDay);
}

function startAutoUpdate() {
    updateDateTime();
    setInterval(showCurrentStatus, 60000);
    scheduleDayUpdate();

    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
            updateDateTime();
        }
    });
}

// Функция за превключване между календари
function switchCalendar(calendarType) {
    activeCalendar = calendarType;
    
    // Обновяваме активния бутон
    document.querySelectorAll('.switch-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    if (calendarType === 'office') {
        document.getElementById('officeCalendarBtn').classList.add('active');
        document.getElementById('officeLegend').style.display = 'flex';
        document.getElementById('qcLegend').style.display = 'none';
    } else if (calendarType === 'qc') {
        document.getElementById('qcCalendarBtn').classList.add('active');
        document.getElementById('officeLegend').style.display = 'none';
        document.getElementById('qcLegend').style.display = 'flex';
    }
    
    // Обновяваме статуса и календара
    showCurrentStatus();
    showCalendar();
}

// Инициализация на приложението
function initApp() {
    showCurrentStatus();
    showCalendar();
    
    // Стартираме автоматичното обновяване
    startAutoUpdate();
    
    // Добавяме event listeners за навигацията
    document.getElementById('prevMonth').addEventListener('click', goToPreviousMonth);
    document.getElementById('nextMonth').addEventListener('click', goToNextMonth);
    document.getElementById('goToToday').addEventListener('click', goToToday);
    
    // Добавяме event listeners за превключване на календари
    document.getElementById('officeCalendarBtn').addEventListener('click', () => switchCalendar('office'));
    document.getElementById('qcCalendarBtn').addEventListener('click', () => switchCalendar('qc'));
    
    // Добавяме клавиатурна навигация
    document.addEventListener('keydown', handleKeyboardNavigation);
    
    // Swipe жестове са премахнати за да не пречат на zoom и scroll
    
    // Добавяме focus management за по-добра достъпност
    document.getElementById('prevMonth').addEventListener('focus', function() {
        this.setAttribute('aria-expanded', 'true');
    });
    
    document.getElementById('nextMonth').addEventListener('focus', function() {
        this.setAttribute('aria-expanded', 'true');
    });
    
    document.getElementById('goToToday').addEventListener('focus', function() {
        this.setAttribute('aria-expanded', 'true');
    });
    
    // Добавяме подобрена мобилна навигация
    enhanceMobileNavigation();
}

// Стартираме приложението когато страницата се зареди
document.addEventListener('DOMContentLoaded', initApp); 