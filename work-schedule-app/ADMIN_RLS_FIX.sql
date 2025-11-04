-- SQL скрипт за оправяне на RLS политиките за Admin функционалност
-- Изпълни този код в Supabase SQL Editor

-- Първо, премахни съществуващите INSERT и UPDATE политики (ако има)
DROP POLICY IF EXISTS "Всички могат да създават служители" ON employees;
DROP POLICY IF EXISTS "Всички могат да обновяват служители" ON employees;
DROP POLICY IF EXISTS "Служителите могат да обновят своя last_login" ON employees;

-- Създаване на нова INSERT политика за employees
-- ЗА СЕГА: Позволяваме на всички да добавят служители (защото проверката е в frontend)
-- В PRODUCTION: Трябва да се използва Supabase Auth с custom claims или role колона
CREATE POLICY "Всички могат да създават служители"
    ON employees FOR INSERT
    WITH CHECK (true);

-- Създаване на UPDATE политика за employees
-- Позволяваме обновяване на всички полета (включително is_active за soft delete и редактиране)
-- Това е необходимо за:
-- 1. Soft delete (is_active = false)
-- 2. Редактиране на име, място, група
-- 3. Обновяване на last_login
CREATE POLICY "Всички могат да обновяват служители"
    ON employees FOR UPDATE
    USING (true)
    WITH CHECK (true);

-- Проверка на резултата
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    permissive, 
    roles, 
    cmd, 
    qual
FROM pg_policies 
WHERE tablename = 'employees';

