-- Create Penal Code Table
CREATE TABLE IF NOT EXISTS penal_code (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    category TEXT NOT NULL, -- e.g., 'Crime', 'Délit', 'Infraction'
    fine INTEGER DEFAULT 0,
    prison_time INTEGER DEFAULT 0, -- In minutes or months, depending on preference
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE penal_code ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Allow all access for admin" ON penal_code FOR ALL USING (true);

-- Grant permissions
GRANT ALL ON penal_code TO anon, authenticated, service_role;
