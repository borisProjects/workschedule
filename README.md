# 📊 Work Dashboard

A modern web application for tracking office schedules and QC activities with an elegant dark mode interface.

## 🚀 Quick Start

1. Open `index.html` in your web browser
2. The app will load automatically and display your schedules

## 📋 Features

### 🏢 Office Calendar

- **Smart Schedule**: 3-week rotating pattern
  - Week 1: Monday, Tuesday (office days)
  - Week 2: Wednesday, Thursday (office days)
  - Week 3: Friday (office day)
- **Payday Indicator**: Green border on last working day of the month
- **Next Office Day**: Shows when you need to be in the office next

### 📋 QC Calendar

- **Monthly QC**: First full Monday-Friday week of each month
- **Weekly QC**: Every Wednesday and Thursday (all other weeks)
- **Clear Visual Indicators**: Red for Monthly QC, beige for Weekly QC

### ⚙️ General Features

- **Live Clock**: Real-time clock display
- **Calendar Switcher**: Toggle between Office and QC calendars
- **Monthly Navigation**: Browse past and future months
- **Current Status**: Shows today's schedule at a glance
- **Responsive Design**: Optimized for all devices
- **Dark Mode**: Elegant black background with warm color palette
- **Keyboard Shortcuts**: Navigate quickly with keyboard

## 🎨 Color Scheme

### Office Calendar

- **Office Days**: #D8C4B6 (warm beige)
- **Remote Days**: #3E5879 (dark blue)
- **Weekend**: #213555 (navy blue)
- **Payday**: Green border (#10b981)

### QC Calendar

- **Monthly QC**: #B85C5C (muted red - important!)
- **Weekly QC**: #C9A687 (light beige)
- **No QC**: #2a3a4a (dark grey-blue)

## ⌨️ Keyboard Shortcuts

- **← →**: Navigate between months
- **Home** or **T**: Jump to current month
- **Click**: Tap days for visual feedback (mobile)

## 📱 Mobile Optimization

- **Touch-Friendly**: Large touch targets (48px+)
- **Adaptive Text**: Scales perfectly on all screen sizes
- **No Zoom Conflicts**: Swipe gestures removed for better zoom experience
- **Haptic Feedback**: Vibration on navigation (supported devices)

## 🔧 Configuration

### Office Schedule

Edit in `script.js`:

```javascript
const WORK_SCHEDULE = {
  startDate: new Date(2025, 9, 27),
  pattern: [
    { days: [1, 2], weeks: 1 },
    { days: [3, 4], weeks: 1 },
    { days: [5], weeks: 1 },
  ],
};
```

### QC Schedule

The QC logic is automatic:

- First full Monday-Friday week = Monthly QC
- All other Wednesday/Thursday = Weekly QC

## 📁 File Structure

```
workschedule/
├── index.html      # Main HTML file
├── styles.css      # All styles (dark mode)
├── script.js       # Application logic
└── README.md       # This file
```

## 🌐 Browser Support

- Chrome (recommended)
- Firefox
- Safari
- Edge
- Mobile browsers (iOS Safari, Chrome)

## 💡 Usage Tips

1. **Switch Calendars**: Click the buttons at the top to toggle views
2. **Navigate Months**: Use ← → buttons or keyboard arrows
3. **Quick Return**: Click "Днес" button to return to current month
4. **Check Status**: Today's schedule is always displayed at the top
5. **Mobile**: Zoom freely without triggering month changes

## ⚡ Auto-Update Features

- **Clock**: Updates every second
- **Status**: Updates every minute
- **Calendar**: Auto-updates at midnight
- **Tab Focus**: Refreshes when you return to the tab

## ☁️ Deployment

No build step required! Deploy to:

- **GitHub Pages**
- **Vercel**
- **Netlify**
- Any static hosting service

Simply upload the files and you're live!

## 🎯 Future Features

- [ ] Export calendar to PDF
- [ ] Add holidays
- [ ] Custom color themes
- [ ] Multiple team schedules
- [ ] Email notifications

## 📄 License

Not free to use and modify.

---

**Powered by Bobi** 🚀
