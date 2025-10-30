# 🪰 Work Schedule Dashboard

Модерен React dashboard за управление на работен график и офис места.

## ✨ Характеристики

### 📅 Работен График
- Интерактивен календар с месечен изглед
- Цветово кодиране: Офис дни | Работа от вкъщи | Уикенд
- Автоматично изчисляване на работни дни по модел
- Навигация между месеци
- Индикатор за днешния ден

### 🪑 Офис Места
- 24 офис места, организирани в 3 групи
- 6-колонен grid layout на десктоп
- Визуално разграничаване на заети и свободни места
- Hover ефекти и анимации

### 🏠 Home Dashboard
- Преглед на текущия статус (офис/вкъщи)
- Следващи офис дни (до 2 дни напред)
- Бърз преглед на общия брой места
- Линкове към пълни страници

### 📱 Responsive Design
- **Desktop**: 6-колонен grid за места, пълна sidebar навигация
- **Tablet**: 4-колонен grid, компактна sidebar
- **Mobile**: 2-колонен grid, bottom navigation
- Екстремно responsive - 8 професионални breakpoints

## 🚀 Бързо Стартиране

### Инсталация
```bash
cd work-schedule-app
npm install
```

### Development
```bash
npm run dev
```
Отваря на `http://localhost:5173`

### Build за Production
```bash
npm run build
```

### Preview на Build
```bash
npm run preview
```

## 🌐 Деплой на Vercel

Проектът е готов за деплой на Vercel:

1. Push-ни проекта в GitHub/GitLab/Bitbucket
2. Отиди на [Vercel](https://vercel.com)
3. Import repository
4. Vercel автоматично ще открие Vite проекта
5. Deploy!

**Важно:** Проектът вече има `vercel.json` с правилната конфигурация за SPA routing.

### Ръчен Деплой
```bash
# Инсталирай Vercel CLI
npm i -g vercel

# Deploy
vercel
```

## 📁 Структура на Проекта

```
work-schedule-app/
├── src/
│   ├── components/         # React компоненти
│   │   ├── Sidebar.jsx    # Странична навигация
│   │   └── BottomNav.jsx  # Долна навигация (mobile)
│   ├── pages/             # Страници
│   │   ├── Home.jsx       # Начална страница
│   │   ├── Calendar.jsx   # Календар страница
│   │   └── Seats.jsx      # Офис места страница
│   ├── utils/             # Utility функции
│   │   └── schedule.js    # Логика за работен график
│   ├── data/              # Данни и конфигурация
│   │   └── constants.js   # Константи и места
│   ├── App.jsx            # Главен компонент
│   ├── App.css            # Глобални стилове
│   └── main.jsx           # Entry point
├── public/                # Статични файлове
├── index.html            # HTML template
├── package.json          # Dependencies
└── vite.config.js        # Vite конфигурация
```

## 🎨 Технологии

- **React 18** - UI библиотека
- **Vite** - Build tool и dev server
- **CSS Variables** - Теминг система
- **Font Awesome** - Икони
- **Google Fonts (Inter)** - Typography

## 🎯 Responsive Breakpoints

- `1920px+`: Large Desktop - 6 колони
- `1200px-1919px`: Desktop - 6 колони
- `900px-1199px`: Tablet Landscape - 4 колони
- `768px-899px`: Tablet Portrait - 3 колони
- `< 768px`: Mobile - 2 колони + bottom nav

## 🛠️ Персонализация

### Промяна на работния график
Редактирай `src/data/constants.js`:
```javascript
export const WORK_SCHEDULE = {
    startDate: new Date(2025, 10, 3),
    pattern: [
        { days: [1, 2], weeks: 1 },  // Пон-Вто
        { days: [3, 4], weeks: 1 },  // Сря-Чет
        { days: [5], weeks: 1 }       // Петък
    ]
};
```

### Промяна на местата
Редактирай `src/data/constants.js`:
```javascript
export const OFFICE_SEATS = [
    { number: '348', name: 'София Григорова', group: 1 },
    // ... още места
];
```

### Промяна на цветовата схема
Редактирай CSS variables в `src/App.css`:
```css
:root {
    --primary-bg: #0a0f1e;
    --accent-cyan: #00d4ff;
    --accent-teal: #00c9a7;
    // ... още цветове
}
```

## 📝 Scripts

- `npm run dev` - Стартира development сървър
- `npm run build` - Build за production
- `npm run preview` - Preview на production build

## 🐛 Известни Проблеми

Няма известни проблеми в момента. Ако намериш бъг, моля съобщи го!

## 📄 License

MIT

---

Made with ❤️ for Market Data UK


