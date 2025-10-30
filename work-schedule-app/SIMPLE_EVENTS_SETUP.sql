-- ОПРОСТЕН SQL СКРИПТ ЗА EVENTS
-- Копирай ЦЕЛИЯ код и го изпълни в Supabase SQL Editor

-- 1. Създаване на таблица за събития
CREATE TABLE IF NOT EXISTS events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    event_date DATE NOT NULL,
    created_by UUID REFERENCES employees(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true
);

-- 2. Създаване на таблица за гласове
CREATE TABLE IF NOT EXISTS votes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    vote_type TEXT NOT NULL CHECK (vote_type IN ('yes', 'no', 'maybe')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(event_id, employee_id)
);

-- 3. Индекси за скорост
CREATE INDEX IF NOT EXISTS idx_events_date ON events(event_date);
CREATE INDEX IF NOT EXISTS idx_events_active ON events(is_active);
CREATE INDEX IF NOT EXISTS idx_votes_event ON votes(event_id);

-- 4. Row Level Security
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;

-- 5. Политики за events (всички могат да правят всичко)
DROP POLICY IF EXISTS "events_select" ON events;
CREATE POLICY "events_select" ON events FOR SELECT USING (true);

DROP POLICY IF EXISTS "events_insert" ON events;
CREATE POLICY "events_insert" ON events FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "events_update" ON events;
CREATE POLICY "events_update" ON events FOR UPDATE USING (true);

DROP POLICY IF EXISTS "events_delete" ON events;
CREATE POLICY "events_delete" ON events FOR DELETE USING (true);

-- 6. Политики за votes (всички могат да правят всичко)
DROP POLICY IF EXISTS "votes_select" ON votes;
CREATE POLICY "votes_select" ON votes FOR SELECT USING (true);

DROP POLICY IF EXISTS "votes_insert" ON votes;
CREATE POLICY "votes_insert" ON votes FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "votes_update" ON votes;
CREATE POLICY "votes_update" ON votes FOR UPDATE USING (true);

DROP POLICY IF EXISTS "votes_delete" ON votes;
CREATE POLICY "votes_delete" ON votes FOR DELETE USING (true);

-- ГОТОВО! Сега провери:
SELECT 'Таблиците са създадени успешно!' as status;
SELECT COUNT(*) as events_count FROM events;
SELECT COUNT(*) as votes_count FROM votes;


