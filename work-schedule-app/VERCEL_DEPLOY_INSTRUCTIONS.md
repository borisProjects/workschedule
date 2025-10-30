# 🚀 Vercel Deploy - Инструкции за Оправяне на 404

## Проблемът
404 грешка означава че Vercel не може да намери правилните файлове или routing не работи.

## ✅ Решение - Vercel Dashboard Settings

### Стъпка 1: Отиди в Project Settings
1. Отвори [Vercel Dashboard](https://vercel.com/dashboard)
2. Избери проекта (work-schedule-app)
3. Кликни на **Settings** (горе)

### Стъпка 2: Провери Root Directory
В **Settings** → **General**:

- **Root Directory**: `work-schedule-app` ✅ (ако проектът е в подпапка)
- Или празно ако директно deploy-ваш `work-schedule-app` папката

### Стъпка 3: Провери Build & Development Settings
В **Settings** → **General** → **Build & Development Settings**:

```
Framework Preset: Vite
Build Command: npm run build
Output Directory: dist
Install Command: npm install
```

### Стъпка 4: Провери Git Integration
**Ако deploy-ваш цялото repo (включително родителската папка):**

1. В **Settings** → **General**
2. **Root Directory**: напиши `work-schedule-app`
3. Това казва на Vercel да търси в тази папка

**Ако deploy-ваш само work-schedule-app папката:**
- Root Directory трябва да е празно

### Стъпка 5: Force Redeploy
След като промениш настройките:

1. Отиди на **Deployments** tab
2. Намери последния deployment
3. Кликни на **⋯** (три точки)
4. Избери **"Redeploy"**
5. ✅ Чекни **"Use existing Build Cache"** - изключи го
6. Кликни **"Redeploy"**

---

## 🔧 Алтернативно Решение

Ако горното не работи, може да има проблем с Router. Нека пробваме различна конфигурация:

### Вариант 1: `public/_redirects` (за SPA)
Създай файл `public/_redirects`:
```
/* /index.html 200
```

### Вариант 2: Опрости `vercel.json`
```json
{
  "routes": [
    { "handle": "filesystem" },
    { "src": "/(.*)", "dest": "/" }
  ]
}
```

---

## 🐛 Debug Checklist

- [ ] Root Directory е правилно настроен
- [ ] Build Command: `npm run build`
- [ ] Output Directory: `dist`
- [ ] Framework: Vite
- [ ] `vercel.json` е push-нат в Git
- [ ] Force redeploy без cache
- [ ] Check Deployment Logs за грешки

---

## 📞 Ако Нищо Не Работи

**Опция: Започни от нулата**

1. Изтрий проекта от Vercel
2. Създай нов Import
3. Избери правилното repo
4. При Import, настрой:
   - Root Directory: `work-schedule-app` (ако е в подпапка)
   - Framework: Vite (автоматично се открива)
5. Deploy!

---

**Важно:** Провери деплоймент логовете във Vercel Dashboard → Deployments → [последен deployment] → View Function Logs


