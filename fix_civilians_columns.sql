-- Add missing columns to noose_civilians
ALTER TABLE noose_civilians ADD COLUMN IF NOT EXISTS height TEXT;
ALTER TABLE noose_civilians ADD COLUMN IF NOT EXISTS weight TEXT;
ALTER TABLE noose_civilians ADD COLUMN IF NOT EXISTS pob TEXT;

-- Notify PostgREST to reload the schema cache
NOTIFY pgrst, 'reload config';
