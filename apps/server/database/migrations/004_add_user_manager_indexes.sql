-- =============================================================================
-- Migration 004: Add Composite Indexes for Manager and Staff Management
-- =============================================================================

BEGIN;

-- 1. Composite Index for Manager and Staff Listing by Business, Role, Active Status, and Soft Deletion
CREATE INDEX IF NOT EXISTS idx_users_biz_role_active_del ON users(club_uuid, role, is_active, deleted_at);

-- 2. Composite Index for Manager and Staff Listing by Business, Role, and Soft Deletion
CREATE INDEX IF NOT EXISTS idx_users_biz_role_del ON users(club_uuid, role, deleted_at);

COMMIT;
