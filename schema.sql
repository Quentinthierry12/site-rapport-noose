-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Agents / Users Table (Custom Auth)
CREATE TABLE noose_user (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL, -- In production, this should be hashed/encrypted
    matricule TEXT UNIQUE NOT NULL,
    rank TEXT NOT NULL,
    division TEXT NOT NULL,
    clearance INTEGER DEFAULT 0,
    permissions TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE
);

-- 2. Reports Table
CREATE TABLE reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    content TEXT, -- HTML content from WYSIWYG
    author_id UUID REFERENCES noose_user(id),
    classification TEXT DEFAULT 'Unclassified', -- Unclassified, Restricted, Confidential, Secret, Top Secret
    status TEXT DEFAULT 'Draft', -- Draft, Validated, Archived
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    investigation_id UUID, -- Link to investigation (FK added later to avoid circular dependency issues if needed)
    tags TEXT[] DEFAULT '{}'
);

-- 3. Arrests Table
CREATE TABLE arrests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    suspect_name TEXT NOT NULL,
    suspect_alias TEXT,
    charges TEXT[],
    arresting_officer_id UUID REFERENCES noose_user(id),
    date_of_arrest TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    location TEXT,
    mugshot_url TEXT,
    report_id UUID REFERENCES reports(id),
    investigation_id UUID,
    status TEXT DEFAULT 'Active', -- Active, Processed, Archived
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Investigations (Cases) Table
CREATE TABLE investigations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    case_number TEXT UNIQUE NOT NULL, -- e.g., CASE-2023-001
    title TEXT NOT NULL,
    description TEXT,
    lead_agent_id UUID REFERENCES noose_user(id),
    status TEXT DEFAULT 'Open', -- Open, Closed, Archived
    classification TEXT DEFAULT 'Restricted',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add foreign key for reports -> investigations
ALTER TABLE reports ADD CONSTRAINT fk_investigation FOREIGN KEY (investigation_id) REFERENCES investigations(id);
-- Add foreign key for arrests -> investigations
ALTER TABLE arrests ADD CONSTRAINT fk_arrest_investigation FOREIGN KEY (investigation_id) REFERENCES investigations(id);

-- 5. Templates Table
CREATE TABLE templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    content TEXT NOT NULL, -- Default content/structure
    category TEXT, -- Report, Arrest, etc.
    min_clearance INTEGER DEFAULT 0,
    created_by UUID REFERENCES noose_user(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Logs Table
CREATE TABLE logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES noose_user(id),
    action TEXT NOT NULL,
    details JSONB,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Global Search Index (View)
CREATE OR REPLACE VIEW global_search_index AS
SELECT
    id,
    'report' AS type,
    title,
    substring(content from 1 for 200) AS summary,
    classification,
    created_at
FROM reports
UNION ALL
SELECT
    id,
    'arrest' AS type,
    suspect_name || ' (' || array_to_string(charges, ', ') || ')' AS title,
    location AS summary,
    'Unclassified' AS classification, -- Arrests are generally public/unclassified in this context
    created_at
FROM arrests
UNION ALL
SELECT
    id,
    'investigation' AS type,
    case_number || ': ' || title AS title,
    description AS summary,
    classification,
    created_at
FROM investigations;

-- RLS Policies (Examples - to be refined based on specific needs)
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE arrests ENABLE ROW LEVEL SECURITY;
ALTER TABLE investigations ENABLE ROW LEVEL SECURITY;

-- Policy: Users can see reports if their clearance is high enough (Simplified logic)
-- Note: In a real Supabase Auth scenario, we'd use auth.uid(). Since we use custom auth, 
-- we might need to handle RLS differently or rely on application-level logic if we don't sync with Supabase Auth.
-- For now, we assume application-level filtering or a sync mechanism.
