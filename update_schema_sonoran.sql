-- Create Civilians Table
CREATE TABLE IF NOT EXISTS noose_civilians (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name TEXT NOT NULL,
    dob DATE,
    gender TEXT,
    race TEXT,
    hair_color TEXT,
    eye_color TEXT,
    weight TEXT,
    pob TEXT, -- Place of Birth
    address TEXT,
    licenses JSONB DEFAULT '{}'::jsonb, -- e.g., { "driver": "valid", "weapon": "revoked" }
    mugshot_url TEXT,
    flags TEXT[] DEFAULT '{}', -- e.g., ['violent', 'wanted']
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create Vehicles Table
CREATE TABLE IF NOT EXISTS noose_vehicles (
    plate TEXT PRIMARY KEY,
    model TEXT NOT NULL,
    color TEXT,
    owner_id UUID REFERENCES noose_civilians(id),
    status TEXT DEFAULT 'Valid', -- Valid, Stolen, Expired, Impounded
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create Weapons Table
CREATE TABLE IF NOT EXISTS noose_weapons (
    serial_number TEXT PRIMARY KEY,
    type TEXT NOT NULL,
    owner_id UUID REFERENCES noose_civilians(id),
    status TEXT DEFAULT 'Valid', -- Valid, Stolen, Lost
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add suspect_id to reports
ALTER TABLE reports ADD COLUMN IF NOT EXISTS suspect_id UUID REFERENCES noose_civilians(id);

-- Enable RLS
ALTER TABLE noose_civilians ENABLE ROW LEVEL SECURITY;
ALTER TABLE noose_vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE noose_weapons ENABLE ROW LEVEL SECURITY;

-- Add civilian_id to arrests
ALTER TABLE arrests ADD COLUMN IF NOT EXISTS civilian_id UUID REFERENCES noose_civilians(id);

-- Create Policies (Permissive for now, can be tightened later)
-- Note: Since we are using custom auth and not Supabase Auth, users are 'anon'.
-- We allow all operations for now. In a real app, we would use Supabase Auth or a custom JWT.
CREATE POLICY "Allow all access" ON noose_civilians FOR ALL USING (true);
CREATE POLICY "Allow all access" ON noose_vehicles FOR ALL USING (true);
CREATE POLICY "Allow all access" ON noose_weapons FOR ALL USING (true);

-- Update Global Search View
DROP VIEW IF EXISTS global_search_index;

CREATE OR REPLACE VIEW global_search_index AS
SELECT 
    id::text,
    'report'::text as type,
    title,
    substring(content from 1 for 200) as summary,
    classification,
    created_at
FROM reports
UNION ALL
SELECT 
    id::text,
    'arrest'::text as type,
    suspect_name || ' (' || array_to_string(charges, ', ') || ')' as title,
    location as summary,
    'Unclassified' as classification,
    created_at
FROM arrests
UNION ALL
SELECT 
    id::text,
    'investigation'::text as type,
    case_number || ': ' || title as title,
    description as summary,
    classification,
    created_at
FROM investigations
UNION ALL
SELECT 
    id::text,
    'civilian'::text as type,
    full_name as title,
    'DOB: ' || COALESCE(dob::text, 'Unknown') || ' | Flags: ' || array_to_string(flags, ', ') as summary,
    'Unclassified' as classification,
    created_at
FROM noose_civilians
UNION ALL
SELECT 
    plate as id,
    'vehicle'::text as type,
    plate || ' - ' || model as title,
    'Color: ' || color || ' | Status: ' || status as summary,
    'Unclassified' as classification,
    created_at
FROM noose_vehicles
UNION ALL
SELECT 
    serial_number as id,
    'weapon'::text as type,
    serial_number || ' - ' || type as title,
    'Status: ' || status as summary,
    'Unclassified' as classification,
    created_at
FROM noose_weapons;

-- Grant permissions
GRANT SELECT ON global_search_index TO anon, authenticated, service_role;
GRANT ALL ON noose_civilians TO anon, authenticated, service_role;
GRANT ALL ON noose_vehicles TO anon, authenticated, service_role;
GRANT ALL ON noose_weapons TO anon, authenticated, service_role;
