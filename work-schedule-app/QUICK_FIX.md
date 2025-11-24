# ⚡ Бърза Корекция за 404 на Vercel

## 🎯 Най-Вероятният Проблем

Vercel търси файловете в **грешната директория**.

## ✅ Решение (2 минути)

### 1️⃣ Отвори Vercel Dashboard

👉 https://vercel.com/dashboard

### 2️⃣ Отвори Project Settings

- Кликни на проекта
- **Settings** (горе вдясно)

### 3️⃣ Настрой Root Directory

**Settings** → **General** → **Root Directory**

**Ако deploy-ваш цялото repo:**

```
Root Directory: work-schedule-app
```

**Ако deploy-ваш само папката work-schedule-app:**

```
Root Directory: [остави празно]
```

### 4️⃣ Провери Build Settings

**Settings** → **General** → **Build & Development Settings**

```
Framework Preset: Vite ✅
Build Command: npm run build ✅
Output Directory: dist ✅
Install Command: npm install ✅
```

### 5️⃣ Force Redeploy

- **Deployments** tab
- Последния deployment → **⋯** (три точки)
- **Redeploy**
- ❌ Изключи "Use existing Build Cache"
- ✅ **Redeploy**

---

## 📦 Промени в Кода (вече направени)

✅ Създаден `vercel.json`  
✅ Създаден `public/_redirects`  
✅ Оправен `package.json` build script  
✅ Премахнати TypeScript зависимости

**Сега push-ни промените:**

```bash
git add .
git commit -m "Fix Vercel 404 - add routing config"
git push
```

---

## 🔍 Провери Logs

**Deployments** → [последен deployment] → **Building** → виж логовете

Търси грешки като:

- ❌ "No such file or directory"
- ❌ "Cannot find module"
- ❌ "Build failed"

---

## 🆘 Ако Все Още Не Работи

Изпрати ми screenshot на:

1. Vercel Project Settings → General (Root Directory секцията)
2. Vercel Deployment Logs (build процеса)
3. Структурата на Git repo-то (къде е `package.json`)

---

**TL;DR: Най-вероятно трябва да настроиш Root Directory на `work-schedule-app` във Vercel Settings!**








