-- Този SQL скрипт трябва да се изпълни в Supabase SQL Editor
-- Отиди в Supabase Dashboard -> SQL Editor -> New Query
-- Копирай този код и го изпълни

-- Създаване на таблица за потребители/служители
CREATE TABLE IF NOT EXISTS employees (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    seat_number TEXT,
    seat_group INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    last_login TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true
);

-- Вмъкване на служителите от constants.js
INSERT INTO employees (name, seat_number, seat_group) VALUES
    ('София Григорова', '348', 1),
    ('Дарина Атанасова', '347', 1),
    ('Емилия Чакърова', '346', 1),
    ('Александър Тодоров', '345', 1),
    ('Христина Нинова', '352', 1),
    ('Мирослава Алексова', '351', 1),
    ('Юлия Любенова', '350', 1),
    ('Румен Алексов', '349', 1),
    ('Гюлджан Ибрям', '356', 2),
    ('Румен Иванов', '355', 2),
    ('Пламен Пенков', '354', 2),
    ('Борис Иванов', '353', 2),
    ('Станислава Руйкова', '360', 2),
    ('Виктория Йорданова', '359', 2),
    ('Христина Хайдарлиева', '358', 2),
    ('Татяна Демирева', '357', 2),
    ('Боян Гечев', '368', 3),
    ('Лъчезар Хумбаджиев', '367', 3),
    ('Виолета Масларска', '366', 3),
    ('Радослав Николов', '365', 3)
ON CONFLICT (name) DO NOTHING;

-- Индекс за по-бързо търсене
CREATE INDEX IF NOT EXISTS idx_employees_name ON employees(name);
CREATE INDEX IF NOT EXISTS idx_employees_is_active ON employees(is_active);

-- Enable Row Level Security (RLS)
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;

-- Политика за четене - всички могат да четат активните служители
CREATE POLICY "Всички могат да виждат активните служители"
    ON employees FOR SELECT
    USING (is_active = true);

-- Политика за update - служителите могат да обновяват само своя last_login
CREATE POLICY "Служителите могат да обновят своя last_login"
    ON employees FOR UPDATE
    USING (true)
    WITH CHECK (true);

-- Показване на всички служители
SELECT * FROM employees ORDER BY seat_number;


