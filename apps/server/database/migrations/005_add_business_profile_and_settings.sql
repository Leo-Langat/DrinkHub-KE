-- =============================================================================
-- Migration 005: Add Business Profile & Operational Settings
-- =============================================================================

BEGIN;

-- 1. Create Enums if not exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'business_type_enum') THEN
    CREATE TYPE business_type_enum AS ENUM (
      'RESTAURANT',
      'CLUB',
      'BAR',
      'LOUNGE',
      'CAFE',
      'FAST_FOOD',
      'HOTEL',
      'FOOD_COURT',
      'OTHER'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'business_status_enum') THEN
    CREATE TYPE business_status_enum AS ENUM (
      'TRIAL',
      'ACTIVE',
      'SUSPENDED',
      'CANCELLED'
    );
  END IF;
END $$;

-- 2. Add description column to clubs (Business)
ALTER TABLE clubs ADD COLUMN IF NOT EXISTS description TEXT;

-- 3. Add banner_url column
ALTER TABLE clubs ADD COLUMN IF NOT EXISTS banner_url TEXT;

-- 4. Add country column with default 'Kenya'
ALTER TABLE clubs ADD COLUMN IF NOT EXISTS country VARCHAR(100) DEFAULT 'Kenya' NOT NULL;

-- 5. Add currency column with default 'KES'
ALTER TABLE clubs ADD COLUMN IF NOT EXISTS currency VARCHAR(10) DEFAULT 'KES' NOT NULL;

-- 6. Add timezone column with default 'Africa/Nairobi'
ALTER TABLE clubs ADD COLUMN IF NOT EXISTS timezone VARCHAR(100) DEFAULT 'Africa/Nairobi' NOT NULL;

-- 7. Add business_type column with default 'RESTAURANT'
ALTER TABLE clubs ADD COLUMN IF NOT EXISTS business_type business_type_enum DEFAULT 'RESTAURANT' NOT NULL;

-- 8. Add business_status column with default 'ACTIVE'
ALTER TABLE clubs ADD COLUMN IF NOT EXISTS business_status business_status_enum DEFAULT 'ACTIVE' NOT NULL;

-- 9. Add operating_schedule JSONB column
ALTER TABLE clubs ADD COLUMN IF NOT EXISTS operating_schedule JSONB DEFAULT '{
  "monday": { "isOpen": true, "openingTime": "08:00", "closingTime": "23:00", "crossesMidnight": false },
  "tuesday": { "isOpen": true, "openingTime": "08:00", "closingTime": "23:00", "crossesMidnight": false },
  "wednesday": { "isOpen": true, "openingTime": "08:00", "closingTime": "23:00", "crossesMidnight": false },
  "thursday": { "isOpen": true, "openingTime": "08:00", "closingTime": "23:00", "crossesMidnight": false },
  "friday": { "isOpen": true, "openingTime": "08:00", "closingTime": "02:00", "crossesMidnight": true },
  "saturday": { "isOpen": true, "openingTime": "08:00", "closingTime": "02:00", "crossesMidnight": true },
  "sunday": { "isOpen": true, "openingTime": "08:00", "closingTime": "23:00", "crossesMidnight": false }
}'::jsonb;

COMMIT;
