-- Send log for FOLLOW-UP emails (wave opened, tester access opened, role changed).
--
-- WHY THIS EXISTS: sendFollowupEmail has no log and no dedupe. It resolves a
-- template, reads the unsubscribe token, sends, and returns. So running
-- onConsumerWaveOpenedBatch twice emails every recipient twice, and nothing
-- anywhere would record that the first run happened. Those batch senders are
-- the milestone layer of the waitlist sequence, which is exactly the mail you
-- cannot afford to duplicate: "your access is open" arriving twice reads as a
-- system that does not know what it has told you.
--
-- Nothing has ever fired, so there is no backlog to reconcile. Verified before
-- writing: no follow-up log table exists, and drip_send_log holds only the four
-- scheduler drip events.
--
-- WHY NOT REUSE drip_send_log. Its drip_event column carries a CLOSED five-value
-- CHECK ('welcome', 'scan_walkthrough', 'founding_rate_urgency',
-- 'scan_deep_dive', 're_engagement'), so follow-up events could not be written
-- without widening it -- and widening it would be worse than the duplicate
-- column. The drip scheduler's idempotency check is:
--
--   select id from drip_send_log where user_id = ? and drip_event = ?
--
-- which reads only whether a row EXISTS. Sharing the table means a follow-up row
-- is a row, and the surface area for a mistake is a scheduler that silently
-- stops sending a real drip because an unrelated follow-up was logged under a
-- name someone reused. Two logs, one job each.
--
-- SHAPE MIRRORS drip_send_log deliberately, including the unique index that makes
-- "once per user per event, ever" a database fact rather than a convention.
--
-- POSTURE MIRRORS IT TOO: RLS enabled with NO policies, and the grant revoked
-- from anon and authenticated BY NAME. Rule 27: Supabase default privileges
-- grant to those roles by name, so REVOKE ... FROM PUBLIC does not remove them.
-- Live ACL on drip_send_log is postgres + service_role only; this matches.
--
-- ROLLBACK:
--   DROP TABLE public.followup_send_log;

CREATE TABLE IF NOT EXISTS public.followup_send_log (
    id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      UUID        NOT NULL REFERENCES public.waitlist(id) ON DELETE CASCADE,
    event_type   TEXT        NOT NULL
                             CHECK (event_type IN (
                                 'tester_access_opened',
                                 'creator_tools_opened',
                                 'consumer_wave_opened',
                                 'role_upgraded',
                                 'role_downgraded',
                                 'tester_selected',
                                 'wave_assigned',
                                 'wave_changed'
                             )),
    -- The resolved template, e.g. 'consumer_wave_1_opened' or 'wave_assigned'.
    -- Informational: it says WHICH email, not which instance of it.
    template_key TEXT        NOT NULL,
    -- What "already sent" is judged on. It is template_key plus the template vars,
    -- e.g. 'wave_assigned|WAVE=3' or 'wave_changed|PREVIOUS_WAVE=1,WAVE=3'.
    --
    -- THE VARS HAVE TO BE IN THE KEY. wave_assigned is ONE template covering every
    -- wave, so keying on the template alone would mean a person assigned to a wave,
    -- returned to the holding pool, and assigned again is told once. That is the
    -- same mistake the seven hardcoded consumer_wave_N templates were avoiding, and
    -- it reappears the moment one template serves many values.
    dedupe_key   TEXT        NOT NULL,
    sent_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    status       TEXT        NOT NULL CHECK (status IN ('sent', 'failed')),
    error_text   TEXT        NULL
);

-- One send per user per INSTANCE, ever. Not per event_type:
-- 'consumer_wave_opened' fires once per wave a person is in, so someone moved from
-- wave 2 to wave 1 must still be told that wave 1 opened. And not per template
-- either, for the reason on dedupe_key above.
CREATE UNIQUE INDEX IF NOT EXISTS followup_send_log_user_dedupe_unique
    ON public.followup_send_log (user_id, dedupe_key);

CREATE INDEX IF NOT EXISTS followup_send_log_user_id_idx
    ON public.followup_send_log (user_id);

ALTER TABLE public.followup_send_log ENABLE ROW LEVEL SECURITY;

-- No policies: every read and write goes through the service-role sender.
REVOKE ALL ON public.followup_send_log FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.followup_send_log TO service_role;

-- VERIFY (expect rls true, policies 0, acl postgres + service_role only):
--   select c.relrowsecurity,
--          (select count(*) from pg_policies p where p.tablename = 'followup_send_log'),
--          pg_catalog.array_to_string(c.relacl, ' | ')
--     from pg_class c where c.relname = 'followup_send_log';
-- VERIFY the unique index exists (expect 1):
--   select count(*) from pg_indexes
--    where tablename = 'followup_send_log'
--      and indexname = 'followup_send_log_user_dedupe_unique';
