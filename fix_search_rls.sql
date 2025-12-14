-- Enable RLS on core tables if not already enabled
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE arrests ENABLE ROW LEVEL SECURITY;
ALTER TABLE investigations ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Allow all access" ON reports;
DROP POLICY IF EXISTS "Allow all access" ON arrests;
DROP POLICY IF EXISTS "Allow all access" ON investigations;

-- Create permissive policies for 'anon' role (since we use custom auth)
CREATE POLICY "Allow all access" ON reports FOR ALL USING (true);
CREATE POLICY "Allow all access" ON arrests FOR ALL USING (true);
CREATE POLICY "Allow all access" ON investigations FOR ALL USING (true);

-- Grant permissions to anon role
GRANT ALL ON reports TO anon;
GRANT ALL ON arrests TO anon;
GRANT ALL ON investigations TO anon;

-- Ensure global_search_index is accessible
GRANT SELECT ON global_search_index TO anon;
