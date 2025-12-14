-- 1. Add the column if it doesn't exist
ALTER TABLE reports ADD COLUMN IF NOT EXISTS suspect_id UUID;

-- 2. Drop the constraint if it exists (to ensure we can recreate it cleanly)
ALTER TABLE reports DROP CONSTRAINT IF EXISTS fk_reports_suspect;

-- 3. Add the foreign key constraint explicitly
ALTER TABLE reports
ADD CONSTRAINT fk_reports_suspect
FOREIGN KEY (suspect_id)
REFERENCES noose_civilians(id);

-- 4. Notify PostgREST to reload the schema cache
NOTIFY pgrst, 'reload config';
