-- ============================================================================
-- DRIP EMAIL SCHEDULER — idempotency log + pg_cron schedule
-- ============================================================================
-- Tracks each drip email send so the scheduler never sends the same drip to
-- the same user twice. Also schedules the drip-scheduler Edge Function to
-- run daily via pg_cron.
--
-- NOTE: This codebase refers to the signups table as `waitlist` (not
-- `waitlist_signups`). FK targets waitlist(id).
-- ============================================================================

-- ----------------------------------------------------------------------------
-- EXTENSIONS (idempotent — Supabase ships these but may not have them enabled)
-- ----------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net  WITH SCHEMA extensions;

-- ----------------------------------------------------------------------------
-- TABLE: drip_send_log
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.drip_send_log (
    id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      UUID        NOT NULL REFERENCES public.waitlist(id) ON DELETE CASCADE,
    drip_event   TEXT        NOT NULL
                             CHECK (drip_event IN (
                                 'welcome',
                                 'scan_walkthrough',
                                 'founding_rate_urgency',
                                 'scan_deep_dive',
                                 're_engagement'
                             )),
    sent_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    status       TEXT        NOT NULL
                             CHECK (status IN ('sent', 'failed')),
    error_text   TEXT        NULL
);

-- One send per user per drip type, ever.
CREATE UNIQUE INDEX IF NOT EXISTS drip_send_log_user_event_unique
    ON public.drip_send_log (user_id, drip_event);

-- Lookups by user for inspection
CREATE INDEX IF NOT EXISTS drip_send_log_user_id_idx
    ON public.drip_send_log (user_id);

-- ----------------------------------------------------------------------------
-- RLS: service role only
-- ----------------------------------------------------------------------------
ALTER TABLE public.drip_send_log ENABLE ROW LEVEL SECURITY;

-- No policies added — with RLS enabled and no policies, anon + authenticated
-- are blocked. Service role bypasses RLS so the Edge Function can read/write.

REVOKE ALL ON public.drip_send_log FROM anon, authenticated;

-- ----------------------------------------------------------------------------
-- PG_CRON: daily drip-scheduler invocation
-- ----------------------------------------------------------------------------
-- Fires every day at 08:00 UTC. Invokes the drip-scheduler Edge Function via
-- pg_net. The function handles day-3 / day-7 / day-14 / day-30 cohorts in a
-- single run.
--
-- TO DISABLE: run SELECT cron.unschedule('drip-scheduler-daily');
-- TO CHANGE SCHEDULE: run SELECT cron.alter_job(...) or unschedule + re-run
-- this block with a new cron expression.
--
-- REQUIRED SETUP (one-time, run via Supabase dashboard or separately):
--   1. Set vault secret 'project_url'   = https://<project-ref>.supabase.co
--   2. Set vault secret 'service_role_key' = <your service role JWT>
--   The cron job reads these via vault.decrypted_secrets.
-- ----------------------------------------------------------------------------

-- Unschedule any prior job with the same name (idempotent re-run).
DO $$
BEGIN
    PERFORM cron.unschedule('drip-scheduler-daily');
EXCEPTION WHEN OTHERS THEN
    -- Job didn't exist; ignore.
    NULL;
END $$;

SELECT cron.schedule(
    'drip-scheduler-daily',
    '0 8 * * *',
    $cron$
    SELECT net.http_post(
        url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'project_url')
               || '/functions/v1/drip-scheduler',
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' ||
                (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'service_role_key')
        ),
        body := '{}'::jsonb
    );
    $cron$
);
