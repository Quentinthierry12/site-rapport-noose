-- Teams & Divisions System Schema
-- This adds team functionality to the existing NOOSE database

-- 1. Teams Table
-- Teams are sub-groups within divisions (e.g., Division: Investigation -> Team: Homicide Unit)
CREATE TABLE IF NOT EXISTS teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    division TEXT NOT NULL, -- Must match division values in noose_user
    description TEXT,
    created_by UUID REFERENCES noose_user(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Team Members Junction Table
-- Links users to teams (many-to-many relationship)
CREATE TABLE IF NOT EXISTS team_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    user_id UUID REFERENCES noose_user(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'member', -- member, leader
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(team_id, user_id) -- Prevent duplicate memberships
);

-- 3. Add shared_with_teams to reports
ALTER TABLE reports 
ADD COLUMN IF NOT EXISTS shared_with_teams UUID[] DEFAULT '{}';

-- 4. Add shared_with_teams to investigations
ALTER TABLE investigations 
ADD COLUMN IF NOT EXISTS shared_with_teams UUID[] DEFAULT '{}';

-- 5. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_teams_division ON teams(division);
CREATE INDEX IF NOT EXISTS idx_team_members_team_id ON team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_reports_shared_teams ON reports USING GIN(shared_with_teams);
CREATE INDEX IF NOT EXISTS idx_investigations_shared_teams ON investigations USING GIN(shared_with_teams);

-- 6. RLS Policies for teams
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

-- Note: In production with Supabase Auth, you would add proper RLS policies
-- For now, we rely on application-level filtering

-- 7. Update global_search_index to include team info
DROP VIEW IF EXISTS global_search_index;
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
    'Unclassified' AS classification,
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
FROM investigations
UNION ALL
SELECT
    id,
    'team' AS type,
    name || ' (' || division || ')' AS title,
    description AS summary,
    'Unclassified' AS classification,
    created_at
FROM teams;
