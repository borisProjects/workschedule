-- SQL setup за custom Seats layout
-- Изпълни в Supabase SQL Editor

CREATE TABLE IF NOT EXISTS seat_layout_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    seat_number TEXT NOT NULL UNIQUE,
    position_index INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX IF NOT EXISTS idx_seat_layout_items_position ON seat_layout_items(position_index);
CREATE INDEX IF NOT EXISTS idx_seat_layout_items_active ON seat_layout_items(is_active);

ALTER TABLE seat_layout_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "seat_layout_select" ON seat_layout_items;
CREATE POLICY "seat_layout_select"
    ON seat_layout_items FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "seat_layout_insert" ON seat_layout_items;
CREATE POLICY "seat_layout_insert"
    ON seat_layout_items FOR INSERT
    WITH CHECK (true);

DROP POLICY IF EXISTS "seat_layout_update" ON seat_layout_items;
CREATE POLICY "seat_layout_update"
    ON seat_layout_items FOR UPDATE
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS "seat_layout_delete" ON seat_layout_items;
CREATE POLICY "seat_layout_delete"
    ON seat_layout_items FOR DELETE
    USING (true);

-- Начално seed-ване с текущия layout (безопасно при повторно пускане)
INSERT INTO seat_layout_items (seat_number, position_index)
VALUES
    ('277', 0), ('276', 1), ('275', 2), ('280', 3), ('279', 4), ('278', 5),
    ('283', 6), ('282', 7), ('281', 8), ('286', 9), ('285', 10), ('284', 11),
    ('289', 12), ('288', 13), ('287', 14), ('292', 15), ('291', 16), ('290', 17),
    ('295', 18), ('294', 19), ('293', 20), ('298', 21), ('297', 22), ('296', 23)
ON CONFLICT (seat_number) DO NOTHING;

SELECT * FROM seat_layout_items WHERE is_active = true ORDER BY position_index;
