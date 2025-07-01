# 📅 Work Schedule - Calendar

A web app for tracking your office/home work schedule with a modern calendar view.

## 🚀 How to Start the App

1. Open `index.html` in your web browser
2. The app will load automatically and show your work schedule

## 📋 Features

- **Current Status**: Shows if you need to be in the office or work from home today
- **Live Clock**: Displays the current time in real time
- **Calendar View**: Monthly calendar with navigation
- **Automatic Updates**: Status and date update automatically
- **Responsive Design**: Works on all devices
- **History**: You can view your schedule for past dates

## 🏢 Work Schedule Logic

The app is configured with the following logic:

- **Start date**: 07.07.2025 (Monday)
- **Weeks 07.07-11.07 and 14.07-18.07**: Office days are Monday and Tuesday
- **Next 2 weeks**: Office days are Wednesday and Thursday
- **Then again 2 weeks**: Monday and Tuesday in the office
- **Cycle**: 2 weeks Mon-Tue, 2 weeks Wed-Thu (repeats throughout the year)

### 📅 Past Dates Support

The app can show your schedule for dates before 07.07.2025. The same cycle logic is applied retroactively.

## 🎨 Color Legend

- 🟢 **Green**: Office days
- 🔵 **Blue**: Work from home
- 🟠 **Orange**: Weekend
- 🔵 **Blue border**: Today (with animation)

## ⌨️ Keyboard Shortcuts

- **← →**: Navigate between months
- **Home**: Jump to current month
- **T**: Quick jump to today

## 📱 Mobile Gestures

- **Swipe left**: Next month
- **Swipe right**: Previous month
- **Tap on day**: Visual feedback

## 📁 File Structure

```
workschedule/
├── index.html      # Main HTML file
├── styles.css      # CSS styles
├── script.js       # JavaScript logic
└── README.md       # Documentation
```

## 🔧 Customization

To change the work schedule, edit the configuration in `script.js`:

```javascript
const WORK_SCHEDULE = {
  startDate: new Date(2025, 6, 7), // Change the start date
  pattern: [
    { days: [1, 2], weeks: 2 }, // Monday and Tuesday for 2 weeks
    { days: [3, 4], weeks: 2 }, // Wednesday and Thursday for 2 weeks
  ],
};
```

## 🌐 Supported Browsers

- Chrome (recommended)
- Firefox
- Safari
- Edge

## 📱 Mobile Support

The app is fully responsive and works great on mobile devices with touch gestures and haptic feedback.

## ⚡ Automatic Updates

- **Time**: Updates every second
- **Date/Status**: Updates every minute
- **Calendar**: Automatically jumps to the current month on a new day
- **Visibility**: Updates when you return to the tab

## ☁️ Deployment

You can deploy this app for free using:

- **GitHub Pages**
- **Vercel**
- **Netlify**
- Or any static hosting

No backend or build step is required. Just upload the files and you're live!
