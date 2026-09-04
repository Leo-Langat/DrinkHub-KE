-- =============================================================================
-- Migration 002: Migrate Legacy Roles (PLATFORM_ADMIN, CLUB_ADMIN, TENANT_ADMIN)
-- Standard: Non-destructive, Data-Preserving, Invalidate Stale Sessions
-- =============================================================================

BEGIN;

-- 1. Ensure new role values exist in enum if not already present
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'user_role_enum' AND e.enumlabel = 'SUPER_ADMIN') THEN
    ALTER TYPE user_role_enum ADD VALUE 'SUPER_ADMIN';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'user_role_enum' AND e.enumlabel = 'ADMIN') THEN
    ALTER TYPE user_role_enum ADD VALUE 'ADMIN';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'user_role_enum' AND e.enumlabel = 'CUSTOMER') THEN
    ALTER TYPE user_role_enum ADD VALUE 'CUSTOMER';
  END IF;
END $$;

COMMIT;

-- 2. Migrate existing users with PLATFORM_ADMIN to SUPER_ADMIN
UPDATE users 
SET role = 'SUPER_ADMIN'::user_role_enum,
    updated_at = NOW()
WHERE role::text = 'PLATFORM_ADMIN';

-- 3. Migrate existing users with CLUB_ADMIN or TENANT_ADMIN to ADMIN
UPDATE users 
SET role = 'ADMIN'::user_role_enum,
    updated_at = NOW()
WHERE role::text IN ('CLUB_ADMIN', 'TENANT_ADMIN');

-- 4. Invalidate active sessions and refresh tokens for migrated users to force fresh authentication
UPDATE user_sessions
SET is_valid = false,
    updated_at = NOW()
WHERE user_uuid IN (
  SELECT user_uuid FROM users WHERE role::text IN ('SUPER_ADMIN', 'ADMIN')
);

UPDATE refresh_tokens
SET is_revoked = true,
    updated_at = NOW()
WHERE user_uuid IN (
  SELECT user_uuid FROM users WHERE role::text IN ('SUPER_ADMIN', 'ADMIN')
);
