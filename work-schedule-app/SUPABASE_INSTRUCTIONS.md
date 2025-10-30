# 🚀 Supabase Интеграция - Инструкции за настройка

## Стъпка 1: Създаване на .env файл

Създай файл `.env` в главната директория на проекта (до `package.json`) със следното съдържание:

```env
VITE_SUPABASE_URL=https://sceqcspusbxqwkiterus.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNjZXFjc3B1c2J4cXdraXRlcnVzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE4MjMxOTcsImV4cCI6MjA3NzM5OTE5N30.L42ad6Bk4r4S34Ei2qfnYbqftiPw7xbklX33PuLqufU
```

⚠️ **ВАЖНО**: Ако `.env` файлът не се създава автоматично, направи го ръчно!

## Стъпка 2: Настройка на Supabase Database

1. Влез в [Supabase Dashboard](https://supabase.com/dashboard)
2. Отвори проекта си
3. Отиди на **SQL Editor** (в лявото меню)
4. Натисни **New Query**
5. Копирай целия код от файла `SUPABASE_SETUP.sql`
6. Постави го в SQL Editor и натисни **Run** (или F5)

Това ще създаде:
- ✅ Таблица `employees` с всички служители
- ✅ Индекси за бързо търсене
- ✅ Row Level Security (RLS) политики

## Стъпка 3: Стартиране на приложението

```bash
npm run dev
```

## Как работи системата?

### 🔐 Login Система
- При влизане в приложението ще видиш **Login страница**
- Избери своето име от списъка
- Можеш да търсиш по име
- След успешен login, ще видиш dashboard-а

### 👤 Потребителски Профил
- В sidebar виждаш името си и номера на мястото
- Информацията се запазва в `localStorage` и в Supabase
- При всяко влизане се обновява `last_login` в базата данни

### 🚪 Logout
- Натисни бутона **"Изход"** в sidebar
- Ще бъдеш върнат към Login страницата

## Файлова Структура

### Нови файлове:
```
src/
├── config/
│   └── supabase.js           # Supabase клиент конфигурация
├── contexts/
│   └── AuthContext.jsx       # Authentication context за управление на потребителя
├── pages/
│   └── Login.jsx             # Login страница с избор на служител
```

### Модифицирани файлове:
- `App.jsx` - добавен AuthProvider и Login логика
- `Sidebar.jsx` - показва потребителско име и бутон за изход

## API Reference

### AuthContext Hooks

```javascript
import { useAuth } from './contexts/AuthContext';

const { 
  user,              // Текущ потребител
  loading,           // Зареждане на данни
  employees,         // Списък с всички служители
  login,             // Функция за влизане
  logout,            // Функция за излизане
  isAuthenticated    // Boolean - дали е логнат
} = useAuth();
```

### Login функция

```javascript
const result = await login('София Григорова');
if (result.success) {
  console.log('Успешен login!', result.user);
} else {
  console.error('Грешка:', result.error);
}
```

## Troubleshooting

### Грешка: "Supabase URL и API Key липсват"
- Провери дали `.env` файлът съществува
- Провери дали променливите започват с `VITE_`
- Рестартирай dev сървъра (`npm run dev`)

### Грешка: "relation employees does not exist"
- Изпълни SQL скрипта от `SUPABASE_SETUP.sql` в Supabase
- Провери дали таблицата е създадена: `SELECT * FROM employees;`

### Login не работи
- Провери дали има грешки в конзолата
- Провери дали Supabase URL и API Key са правилни
- Провери дали RLS политиките са активирани правилно

## Database Schema

### Таблица: employees

| Колона | Тип | Описание |
|--------|-----|----------|
| id | UUID | Уникален идентификатор |
| name | TEXT | Име на служителя (уникално) |
| seat_number | TEXT | Номер на офис място |
| seat_group | INTEGER | Група на мястото (1, 2 или 3) |
| created_at | TIMESTAMP | Дата на създаване |
| last_login | TIMESTAMP | Последно влизане |
| is_active | BOOLEAN | Активен ли е служителят |

## Security

### Row Level Security (RLS)
- ✅ Активирана RLS на таблицата `employees`
- ✅ Всички могат да четат активните служители
- ✅ Служителите могат да обновяват само своя `last_login`

### Environment Variables
- Anon Key е безопасен за използване в клиентски код
- Не споделяй Service Role Key никога!
- `.env` файлът трябва да е в `.gitignore`

## Следващи стъпки (Опционално)

- 🔔 Добавяне на известия
- 📊 Статистика за посещения в офиса
- 🗓️ Персонализиран календар за всеки служител
- 💬 Чат система между служители
- 🎨 Персонализиране на профил (аватар, тема)

## Поддръжка

Ако имаш въпроси или проблеми:
1. Провери конзолата за грешки
2. Провери Supabase логовете
3. Провери дали `.env` файлът е правилен
4. Рестартирай dev сървъра

---

Готово! 🎉 Приложението е свързано със Supabase и има работеща authentication система!


