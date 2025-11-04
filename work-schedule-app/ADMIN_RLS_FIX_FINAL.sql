-- ФИНАЛЕН SQL скрипт за оправяне на RLS политиките
-- Изпълни този код в Supabase SQL Editor
-- Този скрипт ПРЕМАХВА всички стари политики и създава нови чисти

-- Стъпка 1: Премахване на ВСИЧКИ съществуващи политики за employees
-- Използваме динамичен SQL за да премахнем всички политики без значение на името
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'employees') LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON employees', r.policyname);
    END LOOP;
END $$;

-- Стъпка 2: Създаване на нови политики

-- SELECT: Всички могат да виждат активните служители (за Login страницата)
CREATE POLICY "SELECT_employees_active"
    ON employees FOR SELECT
    USING (is_active = true);

-- SELECT: Всички могат да виждат всички служители (за Admin страницата)
-- Забележка: Това е по-либерално, но за сега е необходимо за admin функционалността
CREATE POLICY "SELECT_employees_all"
    ON employees FOR SELECT
    USING (true);

-- INSERT: Всички могат да създават служители
CREATE POLICY "INSERT_employees"
    ON employees FOR INSERT
    WITH CHECK (true);

-- UPDATE: Всички могат да обновяват служители
-- Това е необходимо за:
-- 1. Soft delete (is_active = false)
-- 2. Редактиране на име, място, група
-- 3. Обновяване на last_login
CREATE POLICY "UPDATE_employees"
    ON employees FOR UPDATE
    USING (true)
    WITH CHECK (true);

-- Стъпка 3: Проверка на резултата
SELECT 
    policyname, 
    cmd, 
    permissive,
    roles
FROM pg_policies 
WHERE tablename = 'employees'
ORDER BY cmd, policyname;

-- Ако всичко е ОК, трябва да видиш:
-- SELECT_employees_active (SELECT)
-- SELECT_employees_all (SELECT)
-- INSERT_employees (INSERT)
-- UPDATE_employees (UPDATE)

