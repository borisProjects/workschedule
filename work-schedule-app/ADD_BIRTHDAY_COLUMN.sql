-- SQL скрипт за добавяне на колона за рожден ден в employees таблицата
-- Изпълни този код в Supabase SQL Editor

-- Добавяне на колона за рожден ден (само дата и ден, без година)
-- Използваме DATE тип, но ще форматираме да показва само месец и ден
ALTER TABLE employees 
ADD COLUMN IF NOT EXISTS birthday DATE;

-- Коментар за колоната
COMMENT ON COLUMN employees.birthday IS 'Рожден ден (само дата и ден, без година)';

