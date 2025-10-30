# 🚀 React Dashboard - Нова версия

## 📁 Файлова структура

### Нови файлове:

- **`dashboard.html`** - Самостоятелен файл с всичко вътре (ПРЕПОРЪЧАН)
- `app.html` - HTML wrapper (ако искаш разделени файлове)
- `app-styles.css` - CSS стилове
- `app-script.jsx` - React компоненти

### Стари файлове (запазени):

- `index.html` - Старият modal-based дизайн
- `script.js` - Старата JavaScript логика
- `styles.css` - Старите стилове

## 🎯 Как да отвориш

### Вариант 1: Dashboard (Препоръчан)

Просто отвори **`dashboard.html`** - всичко е в един файл!

### Вариант 2: Модулни файлове

Отвори `app.html` (но трябва локален сървър заради CORS)

## ✨ Нови функции

### Side Navigation

- **Fixed sidebar** вляво
- 3 главни секции: Home, Office Calendar, Seats
- Responsive - на мобилни се минимизира до икони
- Активно състояние с цветни индикатори

### Home Page (Dashboard)

- Преглед на текущия статус
- 2 главни карти:
  - Офис календар (preview)
  - Офис места (брой)
- Search bar и notifications (готови за бъдещи функции)

### Office Calendar Page

- Пълен календар с навигация
- Легенда с цветове
- Текущ статус
- Бутони за навигация (← Днес →)

### Seats Page

- Grid 6x4 с всички места
- Имена на служители
- Hover ефекти

## 🎨 Дизайн

Вдъхновен от inspiration снимката:

- **Тъмна тема** - modern dark UI
- **Side navigation** - fixed left sidebar
- **Cyan accent color** (#00d4ff) - за активни елементи
- **Gradient buttons** - cyan to teal
- **Card-based layout** - модерни карти с border
- **Smooth animations** - fade-in и hover ефекти

## 💻 Технологии

### React 18

- Използва **React Hooks** (useState)
- **Functional components**
- **Component-based architecture**
- CDN версия (без build process)

### CSS

- **CSS Variables** за лесна персонализация
- **CSS Grid & Flexbox** за layout
- **Responsive design** с media queries
- **Animations** с keyframes

### Icons

- **Font Awesome 6** за икони
- **Inter font** за typography

## 📱 Mobile Responsive

- **Desktop**: Пълен sidebar (280px)
- **Mobile** (< 768px):
  - Минимизиран sidebar (80px)
  - Само икони, скрит текст
  - Вертикален layout
  - 2 колони grid за места

## 🔧 Customization

### Цветове

Промени в `:root` в CSS:

```css
--accent-cyan: #00d4ff; /* Primary accent */
--accent-teal: #00c9a7; /* Secondary accent */
--primary-bg: #0a0f1e; /* Main background */
--card-bg: #1e2936; /* Card background */
```

### Work Schedule

Промени в JavaScript (в началото):

```javascript
const WORK_SCHEDULE = {
  startDate: new Date(2025, 10, 3),
  pattern: [
    { days: [1, 2], weeks: 1 }, // Понеделник, Вторник
    { days: [3, 4], weeks: 1 }, // Сряда, Четвъртък
    { days: [5], weeks: 1 }, // Петък
  ],
};
```

### Office Seats

Промени масива `OFFICE_SEATS`:

```javascript
const OFFICE_SEATS = [
  { number: "348", name: "София Григорова" },
  // ... добави още
];
```

## 🚀 Предимства на новата версия

### ✅ По-добра организация

- Component-based структура
- Лесно разширяване
- По-чист код

### ✅ По-добра навигация

- Side menu винаги видим
- Ясни секции
- Бърз достъп

### ✅ Модерен дизайн

- Professional look
- Вдъхновен от съвременни dashboards
- Smooth animations

### ✅ React екосистема

- Лесно добавяне на нови компоненти
- State management
- Готово за разширяване

## 🔮 Бъдещи подобрения

Лесно можеш да добавиш:

- **Backend integration** - API calls
- **User authentication** - Login system
- **Real-time updates** - WebSocket
- **Notifications** - Push notifications
- **Settings page** - User preferences
- **Dark/Light theme toggle**
- **Export calendar** - PDF/Excel
- **Team management** - CRUD operations

## 📊 Сравнение

| Feature           | Стара версия       | Нова версия        |
| ----------------- | ------------------ | ------------------ |
| Layout            | Dashboard + Modals | Side nav + Pages   |
| Tech              | Vanilla JS         | React              |
| Navigation        | Card clicks        | Sidebar menu       |
| Mobile            | Modal full-screen  | Responsive sidebar |
| Extensibility     | Medium             | High               |
| Code organization | Single file        | Component-based    |

## 🎯 Кога да използваш коя версия?

### Старата (`index.html`):

- Искаш прост, бърз преглед
- Харесваш modal дизайна
- Не искаш много навигация

### Новата (`dashboard.html`):

- Искаш професионален dashboard
- Планираш да добавяш функции
- Харесваш modern side-nav дизайна
- Готов си за React

## 📝 Notes

- И двете версии работят напълно offline
- Няма нужда от backend (засега)
- Всички данни са в JavaScript
- Лесно може да се добави API integration

---

**Created with 🪰 by Bobi**  
**Version**: 2.0 React Dashboard Edition  
**Date**: 29.10.2025

