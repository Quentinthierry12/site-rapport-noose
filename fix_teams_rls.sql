-- Fix RLS Policies for Teams System
-- Since the application uses a custom 'noose_user' table and requests are made as 'anon',
-- we need to explicitly allow the 'anon' role to access teams data.

-- 1. Teams Table
DROP POLICY IF EXISTS "Allow Anon Full Access Teams" ON teams;
CREATE POLICY "Allow Anon Full Access Teams" ON teams
FOR ALL
TO anon
USING (true)
WITH CHECK (true);

-- 2. Team Members Table
DROP POLICY IF EXISTS "Allow Anon Full Access Team Members" ON team_members;
CREATE POLICY "Allow Anon Full Access Team Members" ON team_members
FOR ALL
TO anon
USING (true)
WITH CHECK (true);
