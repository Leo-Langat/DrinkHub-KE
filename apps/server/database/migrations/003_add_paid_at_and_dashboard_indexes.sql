-- =============================================================================
-- Migration 003: Add paid_at timestamp to payments and optimize dashboard indexes
-- =============================================================================

BEGIN;

-- 1. Add paid_at column if not exists
ALTER TABLE payments ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;

-- 2. Backfill existing PAID payments with their updated_at or created_at timestamp
UPDATE payments
SET paid_at = COALESCE(updated_at, created_at)
WHERE payment_status = 'PAID' AND paid_at IS NULL;

-- 3. Composite Index for Payment Revenue queries (filtering by business, status, and paid_at timestamp)
CREATE INDEX IF NOT EXISTS idx_payments_biz_status_paid_at ON payments(club_uuid, payment_status, paid_at);

-- 4. Composite Index for Orders filtering by business and creation date
CREATE INDEX IF NOT EXISTS idx_orders_biz_created_at ON orders(club_uuid, created_at);

-- 5. Composite Index for Orders filtering by business and status
CREATE INDEX IF NOT EXISTS idx_orders_biz_status ON orders(club_uuid, status);

COMMIT;
