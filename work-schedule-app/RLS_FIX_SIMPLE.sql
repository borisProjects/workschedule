-- ОПРОСТЕН SQL скрипт - изпълни този код!
-- Този скрипт премахва ВСИЧКИ политики и създава нови

-- 1. Премахване на всички политики
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'employees') LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON employees', r.policyname);
    END LOOP;
END $$;

-- 2. Създаване на нови политики

-- SELECT: Виждане на активните (за Login)
CREATE POLICY "select_active" ON employees FOR SELECT USING (is_active = true);

-- SELECT: Виждане на всички (за Admin)
CREATE POLICY "select_all" ON employees FOR SELECT USING (true);

-- INSERT: Добавяне на нови
CREATE POLICY "insert_employees" ON employees FOR INSERT WITH CHECK (true);

-- UPDATE: Обновяване
CREATE POLICY "update_employees" ON employees FOR UPDATE USING (true) WITH CHECK (true);

-- DELETE: Изтриване (hard delete)
CREATE POLICY "delete_employees" ON employees FOR DELETE USING (true);

-- 3. Проверка
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'employees';

