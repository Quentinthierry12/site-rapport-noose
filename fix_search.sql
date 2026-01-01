-- Drop existing view if it exists
DROP VIEW IF EXISTS global_search_index;

-- Recreate the view with all searchable entities
CREATE OR REPLACE VIEW global_search_index AS
SELECT
    id::text,
    'report'::text AS type,
    title,
    substring(content from 1 for 200) AS summary,
    classification,
    created_at
FROM reports
UNION ALL
SELECT
    id::text,
    'arrest'::text AS type,
    suspect_name || ' (' || array_to_string(charges, ', ') || ')' AS title,
    location AS summary,
    'Unclassified' AS classification,
    created_at
FROM arrests
UNION ALL
SELECT
    id::text,
    'investigation'::text AS type,
    case_number || ': ' || title AS title,
    description AS summary,
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

