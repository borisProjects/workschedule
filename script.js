// Конфигурация на работния график
// 3-седмичен ротационен цикъл
// Начална дата: 27 октомври 2025 (понеделник) - начало на Седмица 1
const WORK_SCHEDULE = {
    startDate: new Date(2025, 9, 27), // 27 октомври 2025 (понеделник)
    
    pattern: [
        { days: [1, 2], weeks: 1 },  // Седмица 1: Понеделник, Вторник (28-29 октомври, 17-18 ноември, и т.н.)
        { days: [3, 4], weeks: 1 },  // Седмица 2: Сряда, Четвъртък (5-6 ноември, 26-27 ноември, и т.н.)
        { days: [5], weeks: 1 }      // Седмица 3: Петък (14 ноември, 5 декември, и т.н.)
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

// Данни за офис местата
let officeSeatsData = [];

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
        default: return '';
    }
}

// Fallback данни за офис места (ако CSV не може да се зареди)
const FALLBACK_SEATS_DATA = `348,София Григорова
347,Дарина Атанасова
346,Емилия Чакърова
345,Александър Тодоров
352,Христина Нинова
351,Мирослава Алексова
350,Свободно
349,Румен Алексов
356,Гюлджан Ибрям
355,Румен Иванов
354,Пламен Пенков
353,Борис Иванов
360,Станислава Руйкова
359,Виктория Йорданова
358,Христина Хайдарлиева
357,Татяна Демирева
364,Свободно
363,Свободно
362,Свободно
361,Свободно
368,Боян Гечев
367,Лъчезар Хумбаджиев
366,Виолета Масларска
365,Радослав Николов`;

// Функция за зареждане на данни за офис местата от CSV
async function loadOfficeSeatsData() {
    try {
        console.log('🔄 Зареждане на офис места...');
        const response = await fetch('officeSeats.csv');
        
        if (!response.ok) {
            throw new Error('CSV файлът не може да се зареди');
        }
        
        console.log('📡 Отговор получен:', response.status, response.ok);
        const text = await response.text();
        console.log('📄 CSV съдържание (първи 100 символа):', text.substring(0, 100));
        const lines = text.split('\n');
        
        // Пропускаме заглавието
        officeSeatsData = lines.slice(1)
            .filter(line => line.trim())
            .map(line => {
                const [number, name] = line.split(',');
                return {
                    number: number?.trim(),
                    name: name?.trim() || ''
                };
            })
            .filter(seat => seat.number);
            
        // НЕ сортираме - запазваме реда от файла!
        console.log('✅ Заредени', officeSeatsData.length, 'места от CSV');
        console.log('📋 Примерни места:', officeSeatsData.slice(0, 3));
    } catch (error) {
        console.warn('⚠️ Грешка при зареждане на CSV, използвам fallback данни:', error.message);
        
        // Използваме fallback данните
        const lines = FALLBACK_SEATS_DATA.split('\n');
        officeSeatsData = lines
            .filter(line => line.trim())
            .map(line => {
                const [number, name] = line.split(',');
                return {
                    number: number?.trim(),
                    name: name?.trim() || ''
                };
            })
            .filter(seat => seat.number);
            
        // НЕ сортираме - запазваме реда от данните!
        console.log('✅ Заредени', officeSeatsData.length, 'места от fallback данни');
    }
}

// Функция за показване на офис местата
function showOfficeSeats() {
    console.log('🪑 Показване на офис места...');
    const grid = document.getElementById('officeSeatsGrid');
    
    if (!grid) {
        console.error('❌ Grid елемент НЕ е намерен!');
        return;
    }
    
    console.log('✅ Grid елемент намерен');
    console.log('📊 Брой места за показване:', officeSeatsData.length);
    
    grid.innerHTML = '';
    
    officeSeatsData.forEach((seat, index) => {
        const seatElement = document.createElement('div');
        seatElement.className = 'office-seat';
        seatElement.setAttribute('data-seat', seat.number);
        
        const numberElement = document.createElement('div');
        numberElement.className = 'seat-number';
        numberElement.textContent = seat.number;
        
        const nameElement = document.createElement('div');
        if (seat.name) {
            nameElement.className = 'seat-name';
            nameElement.textContent = seat.name;
        } else {
            nameElement.className = 'seat-empty';
            nameElement.textContent = 'Свободно';
        }
        
        seatElement.appendChild(numberElement);
        seatElement.appendChild(nameElement);
        grid.appendChild(seatElement);
        
        if (index === 0) {
            console.log('✅ Първо място създадено:', seat.number);
        }
    });
    
    console.log('✅ Всички места показани');
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
    const status = getDayStatus(today);
    const nextOfficeDay = getNextOfficeDay(today);
    
    // Обновяваме dashboard
    const currentDateElement = document.getElementById('currentDate');
    const todayStatusElement = document.getElementById('todayStatus');
    
    if (currentDateElement) {
        currentDateElement.textContent = formatDate(today);
    }
    
    if (todayStatusElement) {
        let statusText = '';
        let statusClass = 'status-preview';
        
        if (status === 'office') {
            statusText = '🏢 Днес трябва да съм в офиса';
            statusClass += ' office';
        } else if (status === 'weekend') {
            statusText = '🏖️ Почивка';
            statusClass += ' weekend';
        } else {
            if (nextOfficeDay) {
                const nextDay = DAY_NAMES[nextOfficeDay.getDay()];
                const nextDate = `${nextOfficeDay.getDate()}.${(nextOfficeDay.getMonth() + 1).toString().padStart(2, '0')}`;
                statusText = `Следващ офис ден: ${nextDay}, ${nextDate}`;
                statusClass += ' remote';
            } else {
                statusText = '🏠 Работя от вкъщи';
                statusClass += ' remote';
            }
        }
        
        todayStatusElement.textContent = statusText;
        todayStatusElement.className = statusClass;
    }
    
    // Обновяваме модала
    const modalCurrentDate = document.getElementById('modalCurrentDate');
    const modalTodayStatus = document.getElementById('modalTodayStatus');
    
    if (modalCurrentDate) {
        modalCurrentDate.textContent = formatDate(today);
    }
    
    if (modalTodayStatus) {
        let statusText = '';
        let statusClass = 'status';
        
        if (status === 'office') {
            statusText = '🏢 Днес трябва да съм в офиса';
            statusClass += ' office';
        } else {
            if (nextOfficeDay) {
                const nextDay = DAY_NAMES[nextOfficeDay.getDay()];
                const nextDate = `${nextOfficeDay.getDate()}.${(nextOfficeDay.getMonth() + 1).toString().padStart(2, '0')}`;
                modalTodayStatus.innerHTML = `🏢 Следващ офис ден: <strong>${nextDay}, ${nextDate}</strong>`;
                modalTodayStatus.className = 'status remote';
                return;
            } else {
                statusText = '🏠 Работя от вкъщи';
                statusClass += ' remote';
            }
        }
        
        modalTodayStatus.textContent = statusText;
        modalTodayStatus.className = statusClass;
    }
}

// Функция за показване на mini calendar в dashboard
function showMiniCalendar() {
    const miniCalendar = document.getElementById('miniCalendar');
    if (!miniCalendar) return;
    
    const today = new Date();
    const month = today.getMonth();
    const year = today.getFullYear();
    
    // Генерираме само следващите 2 седмици
    miniCalendar.innerHTML = '';
    
    for (let i = 0; i < 14; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        
        const dayElement = document.createElement('div');
        dayElement.className = 'mini-day';
        
        const status = getDayStatus(date);
        dayElement.classList.add(status);
        
        if (i === 0) {
            dayElement.classList.add('today');
        }
        
        dayElement.textContent = date.getDate();
        dayElement.title = `${date.getDate()} ${MONTH_NAMES[date.getMonth()]} - ${getStatusDescription(status)}`;
        
        miniCalendar.appendChild(dayElement);
    }
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
            
            // Определяме статуса
            const status = getDayStatus(currentDate);
            
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
            
            // Проверка за последен работен ден от месеца
            const isPayday = day.isCurrentMonth && isLastWorkingDayOfMonth(day.date);
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

// Modal swipe gestures
let modalTouchStartY = 0;
let modalTouchEndY = 0;

function handleModalSwipe(event, closeFunction) {
    if (event.type === 'touchstart') {
        modalTouchStartY = event.touches[0].clientY;
    } else if (event.type === 'touchend') {
        modalTouchEndY = event.changedTouches[0].clientY;
        const diffY = modalTouchEndY - modalTouchStartY;
        
        // Swipe down за затваряне (поне 100px)
        if (diffY > 100) {
            closeFunction();
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
    showMiniCalendar();

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

// Функция за отваряне на calendar modal
function openCalendarModal() {
    const modal = document.getElementById('calendarModal');
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        showCalendar();
        showCurrentStatus();
        
        // Haptic feedback за мобилни
        if (navigator.vibrate) {
            navigator.vibrate(50);
        }
    }
}

// Функция за затваряне на calendar modal
function closeCalendarModal() {
    const modal = document.getElementById('calendarModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
        
        // Haptic feedback за мобилни
        if (navigator.vibrate) {
            navigator.vibrate(30);
        }
    }
}

// Функция за отваряне на seats modal
function openSeatsModal() {
    const modal = document.getElementById('seatsModal');
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        showOfficeSeats();
        
        // Haptic feedback за мобилни
        if (navigator.vibrate) {
            navigator.vibrate(50);
        }
    }
}

// Функция за затваряне на seats modal
function closeSeatsModal() {
    const modal = document.getElementById('seatsModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
        
        // Haptic feedback за мобилни
        if (navigator.vibrate) {
            navigator.vibrate(30);
        }
    }
}

// Функция за обновяване на seats count в dashboard
function updateSeatsCount() {
    const seatsCountElement = document.getElementById('seatsCount');
    if (seatsCountElement) {
        seatsCountElement.textContent = officeSeatsData.length;
    }
}

// Инициализация на приложението
async function initApp() {
    console.log('🚀 Стартиране на приложението...');
    
    // Зареждаме офис местата
    await loadOfficeSeatsData();
    
    // Показваме dashboard съдържание
    showCurrentStatus();
    showMiniCalendar();
    updateSeatsCount();
    
    // Стартираме автоматичното обновяване
    startAutoUpdate();
    
    // Dashboard Cards - Event Listeners
    const calendarCard = document.getElementById('calendarCard');
    const seatsCard = document.getElementById('seatsCard');
    
    if (calendarCard) {
        calendarCard.addEventListener('click', openCalendarModal);
        console.log('✅ Calendar card listener добавен');
    }
    
    if (seatsCard) {
        seatsCard.addEventListener('click', openSeatsModal);
        console.log('✅ Seats card listener добавен');
    }
    
    // Modal Close Buttons
    const closeCalendarBtn = document.getElementById('closeCalendarModal');
    const closeSeatsBtn = document.getElementById('closeSeatsModal');
    
    if (closeCalendarBtn) {
        closeCalendarBtn.addEventListener('click', closeCalendarModal);
    }
    
    if (closeSeatsBtn) {
        closeSeatsBtn.addEventListener('click', closeSeatsModal);
    }
    
    // Затваряне на модал при клик извън съдържанието
    const calendarModal = document.getElementById('calendarModal');
    const seatsModal = document.getElementById('seatsModal');
    
    if (calendarModal) {
        calendarModal.addEventListener('click', (e) => {
            if (e.target === calendarModal) {
                closeCalendarModal();
            }
        });
        
        // Swipe down gesture за затваряне на мобилни
        if (isMobile()) {
            const calendarModalContent = calendarModal.querySelector('.modal-content');
            if (calendarModalContent) {
                calendarModalContent.addEventListener('touchstart', (e) => handleModalSwipe(e, closeCalendarModal));
                calendarModalContent.addEventListener('touchend', (e) => handleModalSwipe(e, closeCalendarModal));
            }
        }
    }
    
    if (seatsModal) {
        seatsModal.addEventListener('click', (e) => {
            if (e.target === seatsModal) {
                closeSeatsModal();
            }
        });
        
        // Swipe down gesture за затваряне на мобилни
        if (isMobile()) {
            const seatsModalContent = seatsModal.querySelector('.modal-content');
            if (seatsModalContent) {
                seatsModalContent.addEventListener('touchstart', (e) => handleModalSwipe(e, closeSeatsModal));
                seatsModalContent.addEventListener('touchend', (e) => handleModalSwipe(e, closeSeatsModal));
            }
        }
    }
    
    // Затваряне на модал с ESC клавиш
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeCalendarModal();
            closeSeatsModal();
        }
    });
    
    // Добавяме event listeners за навигацията в календара
    const prevMonthBtn = document.getElementById('prevMonth');
    const nextMonthBtn = document.getElementById('nextMonth');
    const goTodayBtn = document.getElementById('goToToday');
    
    if (prevMonthBtn) {
        prevMonthBtn.addEventListener('click', goToPreviousMonth);
    }
    
    if (nextMonthBtn) {
        nextMonthBtn.addEventListener('click', goToNextMonth);
    }
    
    if (goTodayBtn) {
        goTodayBtn.addEventListener('click', goToToday);
    }
    
    // Добавяме клавиатурна навигация за календара
    document.addEventListener('keydown', handleKeyboardNavigation);
    
    // Добавяме подобрена мобилна навигация
    enhanceMobileNavigation();
    
    console.log('✅ Приложението е готово!');
}

// Стартираме приложението когато страницата се зареди
document.addEventListener('DOMContentLoaded', initApp); 