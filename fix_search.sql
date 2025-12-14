-- Drop existing view if it exists
DROP VIEW IF EXISTS global_search_index;

-- Recreate the view
CREATE OR REPLACE VIEW global_search_index AS
SELECT
    id,
    'report'::text AS type,
    title,
    substring(content from 1 for 200) AS summary,
    classification,
    created_at
FROM reports
UNION ALL
SELECT
    id,
    'arrest'::text AS type,
    suspect_name || ' (' || array_to_string(charges, ', ') || ')' AS title,
    location AS summary,
    'Unclassified' AS classification,
    created_at
FROM arrests
UNION ALL
SELECT
    id,
    'investigation'::text AS type,
    case_number || ': ' || title AS title,
    description AS summary,
    classification,
    created_at
FROM investigations;

-- Grant permissions
GRANT SELECT ON global_search_index TO anon, authenticated, service_role;
