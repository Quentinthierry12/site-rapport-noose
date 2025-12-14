-- Fix RLS Policies for Custom Auth
-- Since the application uses a custom 'noose_user' table and not Supabase Auth,
-- requests are made as the 'anon' role. We need to allow the 'anon' role to
-- interact with these tables, while relying on the application logic for security.

-- Reports
CREATE POLICY "Allow Anon Full Access Reports" ON reports
FOR ALL
TO anon
USING (true)
WITH CHECK (true);

-- Arrests
CREATE POLICY "Allow Anon Full Access Arrests" ON arrests
FOR ALL
TO anon
USING (true)
WITH CHECK (true);

-- Investigations
CREATE POLICY "Allow Anon Full Access Investigations" ON investigations
FOR ALL
TO anon
USING (true)
WITH CHECK (true);

-- Templates (if RLS is enabled later)
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow Anon Full Access Templates" ON templates
FOR ALL
TO anon
USING (true)
WITH CHECK (true);
