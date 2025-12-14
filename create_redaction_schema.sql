-- Redaction Tool Schema
-- This adds document versioning and redaction capabilities

-- 1. Report Versions Table
-- Stores different redacted versions of reports (Full, Partial, Public)
CREATE TABLE IF NOT EXISTS report_versions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_id UUID REFERENCES reports(id) ON DELETE CASCADE,
    version_type TEXT NOT NULL CHECK (version_type IN ('full', 'partial', 'public')),
    redacted_fields JSONB DEFAULT '[]', -- Array of field names to redact
    created_by UUID REFERENCES noose_user(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(report_id, version_type) -- Only one version of each type per report
);

-- 2. Add redaction metadata to reports table
ALTER TABLE reports 
ADD COLUMN IF NOT EXISTS redaction_metadata JSONB DEFAULT '{}';

-- 3. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_report_versions_report_id ON report_versions(report_id);
CREATE INDEX IF NOT EXISTS idx_report_versions_type ON report_versions(version_type);

-- 4. Function to get appropriate version based on clearance
CREATE OR REPLACE FUNCTION get_report_version_for_clearance(
    p_report_id UUID,
    p_user_clearance INTEGER
) RETURNS TABLE (
    version_type TEXT,
    redacted_fields JSONB
) AS $$
BEGIN
    -- Clearance 4+ can see full version
    IF p_user_clearance >= 4 THEN
        RETURN QUERY
        SELECT 'full'::TEXT, '[]'::JSONB;
    -- Clearance 2-3 can see partial version
    ELSIF p_user_clearance >= 2 THEN
        RETURN QUERY
        SELECT rv.version_type, rv.redacted_fields
        FROM report_versions rv
        WHERE rv.report_id = p_report_id
        AND rv.version_type = 'partial'
        LIMIT 1;
    -- Clearance 0-1 can only see public version
    ELSE
        RETURN QUERY
        SELECT rv.version_type, rv.redacted_fields
        FROM report_versions rv
        WHERE rv.report_id = p_report_id
        AND rv.version_type = 'public'
        LIMIT 1;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- 5. RLS Policies
ALTER TABLE report_versions ENABLE ROW LEVEL SECURITY;

-- Note: Add proper RLS policies based on your auth setup
-- Example: Users can only see versions appropriate for their clearance level
