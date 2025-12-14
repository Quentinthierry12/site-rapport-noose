-- Create an admin user with full permissions and Top Secret clearance
INSERT INTO noose_user (
    username,
    password,
    matricule,
    rank,
    division,
    clearance,
    permissions
) VALUES (
    'admin',
    'admin123', -- Change this password immediately after logging in
    'ADM-001',
    'Director',
    'Administration',
    5, -- Top Secret
    ARRAY[
        'admin.access',
        'reports.create',
        'reports.edit',
        'reports.delete',
        'arrests.create',
        'investigations.create',
        'investigations.assign'
    ]
);
