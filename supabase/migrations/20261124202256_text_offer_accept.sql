-- ============================================================================
-- ACCEPT A TEXT OFFER IN ONE LOCKED STEP (tracked in #26)
-- ============================================================================
-- Called by api/text-opt-in.ts (action 'accept'). Replaces two separate client
-- writes that could go wrong:
--   1. The slot count was decremented from a value read earlier, so a spot
--      freed in between by release_text_spot (+1 inside the database) was lost.
--      Now the decrement is slots_remaining - 1 inside one UPDATE.
--   2. The final opt-in write had no condition, so a person marked Removed or
--      unsubscribed after the API's check could still get text_opt_in = true
--      and their phone number written back. Removed lives on
--      waitlist_outreach, which a PostgREST update on waitlist cannot filter on,
--      so the check and the write happen here, under the same row locks
--      mark_waitlist_removed and undo_waitlist_removed take, in the same order
--      (waitlist row first, then the outreach row).
--
-- Returns one word; the API maps each to its response:
--   accepted | not_found | outreach_unreadable | not_contactable |
--   already_opted_in | no_offer | expired | no_slots
-- A missing outreach row reads as outreach_unreadable (fail closed, same as
-- readOutreachStatus in api/_outreach.ts).
--
-- Name sorts after 20261124_add_waitlist_outreach.sql, which it depends on
-- (waitlist_outreach, text_opt_in_config).
--
-- APPLIED Nov 24 2026 about 20:22 UTC through the Supabase connector (name text_offer_accept), on Ethan's apply. Apply before deploying the api/text-opt-in.ts that calls it;
-- until then every accept answers 500.
--
-- Rollback: DROP FUNCTION public.accept_text_offer(uuid, text);
-- ============================================================================

CREATE OR REPLACE FUNCTION public.accept_text_offer(p_waitlist_id uuid, p_phone text)
RETURNS text
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_row    public.waitlist%ROWTYPE;
  v_status text;
  v_rows   integer;
BEGIN
  SELECT * INTO v_row FROM public.waitlist WHERE id = p_waitlist_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN 'not_found';
  END IF;

  SELECT o.outreach_status INTO v_status
    FROM public.waitlist_outreach o
   WHERE o.waitlist_id = p_waitlist_id
     FOR SHARE;
  IF v_status IS NULL THEN
    RETURN 'outreach_unreadable';
  END IF;

  IF v_status = 'removed' OR v_row.unsubscribed_at IS NOT NULL THEN
    RETURN 'not_contactable';
  END IF;
  IF v_row.text_opt_in THEN
    RETURN 'already_opted_in';
  END IF;
  -- A declined offer was already passed on to the next person.
  IF v_row.text_opt_in_declined OR v_row.text_opt_in_offer_sent_at IS NULL THEN
    RETURN 'no_offer';
  END IF;
  IF v_row.text_opt_in_expires_at IS NULL OR v_row.text_opt_in_expires_at <= now() THEN
    RETURN 'expired';
  END IF;

  -- Same config row release_text_spot gives spots back to.
  UPDATE public.text_opt_in_config
     SET slots_remaining = slots_remaining - 1
   WHERE id = (SELECT min(id) FROM public.text_opt_in_config)
     AND slots_remaining > 0;
  GET DIAGNOSTICS v_rows = ROW_COUNT;
  IF v_rows = 0 THEN
    RETURN 'no_slots';
  END IF;

  UPDATE public.waitlist
     SET text_opt_in  = true,
         phone_number = p_phone
   WHERE id = p_waitlist_id;

  RETURN 'accepted';
END;
$$;
REVOKE ALL ON FUNCTION public.accept_text_offer(uuid, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.accept_text_offer(uuid, text) TO service_role;
