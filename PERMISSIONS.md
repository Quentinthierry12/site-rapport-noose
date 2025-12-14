# NOOSE Permission System

This document outlines the permission and clearance system used in the NOOSE Incident & Case Management System (NICMS).

## Overview

The system uses a combination of **Clearance Levels** and **Specific Permissions** to control access to data and features. These are stored in the `noose_user` table.

## Clearance Levels

Clearance levels determine the maximum classification of data a user can access.

| Level | Name | Description |
| :--- | :--- | :--- |
| 1 | **Unclassified** | Public or general internal information. |
| 2 | **Restricted** | Sensitive internal information. |
| 3 | **Confidential** | Highly sensitive information requiring need-to-know. |
| 4 | **Secret** | Critical information with potential for severe damage if compromised. |
| 5 | **Top Secret** | The highest level of classification. |

### Enforcement
- **Reports/Investigations**: Users can only view records where `record.classification_level <= user.clearance_level`.
- **Templates**: Users can only use templates where `template.min_clearance <= user.clearance_level`.

## Permissions

Permissions are granular flags stored in a JSONB array (`permissions` column) in the `noose_user` table. They control access to specific actions or modules.

### List of Permissions

| Permission Key | Description |
| :--- | :--- |
| `admin.access` | Access to the Administration module. |
| `reports.create` | Ability to create new incident reports. |
| `reports.edit` | Ability to edit existing reports (own or others depending on policy). |
| `reports.delete` | Ability to delete reports. |
| `arrests.create` | Ability to create new arrest records. |
| `investigations.create` | Ability to open new investigations. |
| `investigations.assign` | Ability to assign agents to cases. |

## Implementation Details

### Database (RLS)
Row Level Security (RLS) policies in Supabase enforce these rules at the database level.

**Example RLS Policy (Pseudo-code):**
```sql
CREATE POLICY "View Reports based on Clearance"
ON reports
FOR SELECT
USING (
  (SELECT clearance FROM noose_user WHERE id = auth.uid()) >= classification_level
);
```

### Frontend (React)
The `AuthStore` holds the current user's profile, including their clearance and permissions.

**Checking Permissions:**
```typescript
const { user } = useAuthStore();

if (user.clearance >= 3) {
  // Show Confidential data
}

if (user.permissions.includes('admin.access')) {
  // Show Admin link in Sidebar
}
```

## User Roles (Ranks)
While `rank` (e.g., Officer, Detective, Captain) is stored in the user profile, it is primarily for display and organizational hierarchy. Actual access control is driven by `clearance` and `permissions`, allowing for flexibility (e.g., a specialist civilian consultant might have Top Secret clearance but no arrest powers).
