# 🪰 Productivity Dashboard

## 🚀 Как да отвориш сайта

### Вариант 1: Директно от файл (Препоръчан)
Просто двоен клик на `index.html` - сайтът ще работи с fallback данните.

### Вариант 2: С локален сървър (за пълна функционалност)

#### Python 3
```bash
cd c:\Users\tedik\OneDrive\Documents\workschedule
python -m http.server 8000
```
После отвори: `http://localhost:8000`

#### Node.js (с npx)
```bash
cd c:\Users\tedik\OneDrive\Documents\workschedule
npx http-server -p 8000
```
После отвори: `http://localhost:8000`

#### PHP
```bash
cd c:\Users\tedik\OneDrive\Documents\workschedule
php -S localhost:8000
```
После отвори: `http://localhost:8000`

## 📱 Функции

### Dashboard
- 📅 **Офис дни** - показва статус и мини календар
- 🪑 **Офис места** - показва броя на местата

### Модални прозорци
- Кликни на карта за пълна информация
- Затвори с: X бутон, ESC, клик извън прозореца, swipe down (мобилни)

### Keyboard shortcuts
- **← / →** - Предишен/следващ месец
- **Home / T** - Днес
- **ESC** - Затвори модал

## 🐛 Решаване на проблеми

### "CORS error" в конзолата
Това е нормално при отваряне директно от файл. Сайтът използва fallback данни и ще работи отлично.

За да премахнеш грешката напълно, използвай локален сървър (виж по-горе).

### Липсват офис места
Ако виждаш "0 места", освежи страницата (F5).

## 📊 Файлове

- `index.html` - Главна страница
- `styles.css` - Стилове
- `script.js` - JavaScript логика
- `officeSeats.csv` - Данни за местата (опционално)

## 🎨 Характеристики

- ✅ Responsive дизайн (320px - 1920px+)
- ✅ Touch gestures за мобилни
- ✅ Keyboard navigation
- ✅ Haptic feedback
- ✅ Dark theme
- ✅ Smooth animations

---

**Powered by Bobi** 🪰
