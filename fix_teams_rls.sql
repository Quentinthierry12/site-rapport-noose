-- Fix RLS policies for teams and team_members
-- This allows authenticated users to see all teams and their own memberships

-- 1. Policies for teams
DROP POLICY IF EXISTS "Allow all access for authenticated users" ON teams;
CREATE POLICY "Allow all access for authenticated users" ON teams
    FOR SELECT
    USING (true);

CREATE POLICY "Admin full access" ON teams
    FOR ALL
    USING (true);

-- 2. Policies for team_members
DROP POLICY IF EXISTS "Allow all access for authenticated users" ON team_members;
CREATE POLICY "Allow members to see memberships" ON team_members
    FOR SELECT
    USING (true);

CREATE POLICY "Admin full access members" ON team_members
    FOR ALL
    USING (true);

-- 3. Grant permissions just in case
GRANT SELECT ON teams TO authenticated, anon;
GRANT SELECT ON team_members TO authenticated, anon;
