-- =============================================================================
-- Migration 006: Add performance indexes for reporting queries
-- =============================================================================

BEGIN;

-- 1. Index for waiter-scoped order queries in reporting
CREATE INDEX IF NOT EXISTS idx_orders_biz_waiter ON orders(club_uuid, waiter_uuid);

-- 2. Index for product-scoped order items queries in reporting
CREATE INDEX IF NOT EXISTS idx_order_items_product ON order_items(product_uuid);
CREATE INDEX IF NOT EXISTS idx_order_items_biz_product ON order_items(club_uuid, product_uuid);

COMMIT;
