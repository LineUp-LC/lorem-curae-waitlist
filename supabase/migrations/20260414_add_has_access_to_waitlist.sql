-- ============================================================================
-- ADD has_access TO WAITLIST
-- ============================================================================
-- Gates product access per user. Drip scheduler and app-side auth checks
-- filter on this column to determine whether a user can enter the product.
--
-- Defaults to false for all existing and new rows.
-- Set to true by an admin action or automated access-opening flow.
-- ============================================================================

ALTER TABLE public.waitlist
    ADD COLUMN IF NOT EXISTS has_access BOOLEAN NOT NULL DEFAULT false;

-- Index for fast lookups — drip scheduler and access-gate queries filter
-- on has_access = false (candidates) or has_access = true (admitted users).
CREATE INDEX IF NOT EXISTS waitlist_has_access_idx
    ON public.waitlist (has_access);
