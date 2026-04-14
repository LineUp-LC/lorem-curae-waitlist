-- ============================================================================
-- ADD UNSUBSCRIBE SUPPORT TO WAITLIST
-- ============================================================================
-- Adds unsubscribed_at and unsubscribe_token to support a hosted one-click
-- unsubscribe endpoint (supabase/functions/unsubscribe/index.ts).
--
-- unsubscribe_token is auto-generated per row and never changes.
-- unsubscribed_at is NULL until the user unsubscribes.
-- ============================================================================

ALTER TABLE public.waitlist
    ADD COLUMN IF NOT EXISTS unsubscribed_at   TIMESTAMPTZ NULL,
    ADD COLUMN IF NOT EXISTS unsubscribe_token UUID        NOT NULL DEFAULT gen_random_uuid();

-- Unique index for fast token lookup by the unsubscribe Edge Function.
CREATE UNIQUE INDEX IF NOT EXISTS waitlist_unsubscribe_token_idx
    ON public.waitlist (unsubscribe_token);
