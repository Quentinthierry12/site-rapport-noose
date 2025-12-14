-- Create Investigation Links Table
CREATE TABLE IF NOT EXISTS investigation_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    investigation_id UUID REFERENCES investigations(id) ON DELETE CASCADE,
    linked_item_id TEXT NOT NULL, -- ID of the linked item (report, arrest, etc.)
    linked_item_title TEXT, -- Display name/title of the linked item
    linked_item_type TEXT NOT NULL, -- 'report', 'arrest', 'civilian', 'vehicle', 'weapon'
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES noose_user(id)
);

-- Enable RLS
ALTER TABLE investigation_links ENABLE ROW LEVEL SECURITY;

-- Create Policy
CREATE POLICY "Allow all access" ON investigation_links FOR ALL USING (true);

-- Grant permissions
GRANT ALL ON investigation_links TO anon, authenticated, service_role;
