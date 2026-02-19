-- Multi-layout schema for Seats screen (teams + seats)
-- Run in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS seat_layouts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    rows INTEGER NOT NULL CHECK (rows > 0),
    cols INTEGER NOT NULL CHECK (cols > 0),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT TIMEZONE('utc', NOW())
);

ALTER TABLE seat_layout_items
ADD COLUMN IF NOT EXISTS layout_id UUID REFERENCES seat_layouts(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_seat_layouts_active ON seat_layouts(is_active);
CREATE INDEX IF NOT EXISTS idx_seat_layout_items_layout ON seat_layout_items(layout_id);

-- if old single-layout data exists, move it into a default layout
DO $$
DECLARE
    default_layout_id UUID;
BEGIN
    IF EXISTS (SELECT 1 FROM seat_layout_items WHERE layout_id IS NULL) THEN
        INSERT INTO seat_layouts (name, rows, cols, is_active)
        VALUES ('Office', 4, 6, true)
        RETURNING id INTO default_layout_id;

        UPDATE seat_layout_items
        SET layout_id = default_layout_id
        WHERE layout_id IS NULL;
    END IF;
END $$;

ALTER TABLE seat_layout_items
ALTER COLUMN layout_id SET NOT NULL;

ALTER TABLE seat_layout_items
DROP CONSTRAINT IF EXISTS seat_layout_items_seat_number_key;

ALTER TABLE seat_layout_items
ADD CONSTRAINT seat_layout_items_layout_seat_unique UNIQUE (layout_id, seat_number);

ALTER TABLE seat_layout_items
ADD CONSTRAINT seat_layout_items_layout_position_unique UNIQUE (layout_id, position_index);

ALTER TABLE seat_layouts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "seat_layouts_select" ON seat_layouts;
CREATE POLICY "seat_layouts_select"
    ON seat_layouts FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "seat_layouts_insert" ON seat_layouts;
CREATE POLICY "seat_layouts_insert"
    ON seat_layouts FOR INSERT
    WITH CHECK (true);

DROP POLICY IF EXISTS "seat_layouts_update" ON seat_layouts;
CREATE POLICY "seat_layouts_update"
    ON seat_layouts FOR UPDATE
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS "seat_layouts_delete" ON seat_layouts;
CREATE POLICY "seat_layouts_delete"
    ON seat_layouts FOR DELETE
    USING (true);

-- ensure row-level rules also allow layout_id updates/inserts in seat_layout_items
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

DROP POLICY IF EXISTS "seat_layout_select" ON seat_layout_items;
CREATE POLICY "seat_layout_select"
    ON seat_layout_items FOR SELECT
    USING (true);
