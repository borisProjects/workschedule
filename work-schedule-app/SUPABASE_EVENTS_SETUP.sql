-- SQL скрипт за Events функционалност
-- Изпълни този код в Supabase SQL Editor СЛЕД като си изпълнил SUPABASE_SETUP.sql

-- Таблица за събития (events)
CREATE TABLE IF NOT EXISTS events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    event_date DATE NOT NULL,
    created_by UUID REFERENCES employees(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    is_active BOOLEAN DEFAULT true
);

-- Таблица за гласове (votes)
CREATE TABLE IF NOT EXISTS votes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    vote_type TEXT NOT NULL CHECK (vote_type IN ('yes', 'no', 'maybe')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    UNIQUE(event_id, employee_id) -- Всеки служител може да гласува само веднъж за събитие
);

-- Индекси за бързо търсене
CREATE INDEX IF NOT EXISTS idx_events_event_date ON events(event_date);
CREATE INDEX IF NOT EXISTS idx_events_is_active ON events(is_active);
CREATE INDEX IF NOT EXISTS idx_votes_event_id ON votes(event_id);
CREATE INDEX IF NOT EXISTS idx_votes_employee_id ON votes(employee_id);

-- Enable Row Level Security (RLS)
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;

-- RLS Политики за events
CREATE POLICY "Всички могат да виждат активните събития"
    ON events FOR SELECT
    USING (is_active = true);

CREATE POLICY "Всички могат да създават събития"
    ON events FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Създателят може да изтрива своите събития"
    ON events FOR DELETE
    USING (true);

CREATE POLICY "Създателят може да обновява своите събития"
    ON events FOR UPDATE
    USING (true)
    WITH CHECK (true);

-- RLS Политики за votes
CREATE POLICY "Всички могат да виждат гласовете"
    ON votes FOR SELECT
    USING (true);

CREATE POLICY "Всички могат да гласуват"
    ON votes FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Всеки може да обновява своя глас"
    ON votes FOR UPDATE
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Всеки може да изтрива своя глас"
    ON votes FOR DELETE
    USING (true);

-- Функция за автоматично обновяване на updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger за автоматично обновяване на updated_at при промяна на глас
CREATE TRIGGER update_votes_updated_at
    BEFORE UPDATE ON votes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- View за лесно извличане на статистика за гласове
CREATE OR REPLACE VIEW event_vote_summary AS
SELECT 
    e.id as event_id,
    e.title,
    e.event_date,
    e.created_at,
    COUNT(CASE WHEN v.vote_type = 'yes' THEN 1 END) as yes_count,
    COUNT(CASE WHEN v.vote_type = 'no' THEN 1 END) as no_count,
    COUNT(CASE WHEN v.vote_type = 'maybe' THEN 1 END) as maybe_count,
    COUNT(v.id) as total_votes
FROM events e
LEFT JOIN votes v ON e.id = v.event_id
WHERE e.is_active = true
GROUP BY e.id, e.title, e.event_date, e.created_at
ORDER BY e.event_date ASC;

-- Показване на всички активни събития
SELECT * FROM events WHERE is_active = true ORDER BY event_date;

-- Показване на статистика
SELECT * FROM event_vote_summary;


