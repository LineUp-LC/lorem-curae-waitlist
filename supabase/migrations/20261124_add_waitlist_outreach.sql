-- ============================================================================
-- WAITLIST OUTREACH: status, last-emailed date and notes per signup (admin only)
-- ============================================================================
-- Tracked in #26. Decisions: Ethan, Nov 24 2026.
--
-- A SEPARATE TABLE, not columns on public.waitlist. waitlist has a live SELECT
-- policy "Users can view their own waitlist entry" (email = auth.email()), which
-- is row-scoped, so any column added to waitlist is readable by the person it
-- describes. Notes must not be.
--
-- NOT named "status": waitlist.status already means wave state (status_check:
-- 'active' | 'waiting_for_next_wave').
--
-- Removed = taken off the waitlist, record KEPT. Removed people are left out of
-- every send and every waitlist count, including the public founding-spots
-- counter (decision 3b, view replaced at the end of this file).
--
-- WRITE NOTHING BY HAND OUTSIDE THIS FILE. Apply only after an explicit "apply".
--
-- ROLLBACK (one transaction; order matters: the view reads the table):
--   BEGIN;
--   CREATE OR REPLACE VIEW public.founding_member_slots AS
--     SELECT
--       count(*) FILTER (WHERE waitlist_position <= 100)              AS slots_used,
--       100 - count(*) FILTER (WHERE waitlist_position <= 100)        AS slots_remaining,
--       count(*) FILTER (WHERE waitlist_position <= 100) < 100        AS slots_available
--     FROM waitlist;
--   DROP TRIGGER IF EXISTS trg_waitlist_outreach_row ON public.waitlist;
--   DROP FUNCTION IF EXISTS public.create_waitlist_outreach_row();
--   DROP FUNCTION IF EXISTS public.flag_removed_resignup(text);
--   DROP FUNCTION IF EXISTS public.mark_waitlist_removed(uuid);
--   DROP FUNCTION IF EXISTS public.undo_waitlist_removed(uuid, text, integer);
--   DROP FUNCTION IF EXISTS public.claim_next_text_offer(timestamptz);
--   DROP TABLE IF EXISTS public.waitlist_outreach;
--   COMMIT;
-- WHAT THE ROLLBACK CANNOT UNDO (both are deletions, decisions 5a and 6a):
--   - phone_number and text_opt_in cleared by THIS migration's backfill for rows
--     with unsubscribed_at set (measured 2026-11-24: 1 unsubscribed row, 0 with a
--     phone number, 0 opted in, so nothing was deleted at that time);
--   - phone_number and text_opt_in cleared later by mark_waitlist_removed.
-- Founding badges removed by undo_waitlist_removed are not restored either.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.waitlist_outreach (
    waitlist_id         UUID        PRIMARY KEY
                                    REFERENCES public.waitlist(id) ON DELETE CASCADE,
    outreach_status     TEXT        NOT NULL DEFAULT 'not_sent'
                                    CHECK (outreach_status IN
                                      ('not_sent', 'sent', 'replied', 'quiet', 'removed')),
    last_emailed_on     DATE        NULL,          -- typed by hand in admin, never auto-filled
    notes               TEXT        NULL
                                    CHECK (notes IS NULL OR char_length(notes) <= 500),
    removed_at          TIMESTAMPTZ NULL,          -- latest move to Removed; kept as history
    removed_cleared_at  TIMESTAMPTZ NULL,          -- latest undo of Removed (decision 2a)
    resignup_attempts   INTEGER     NOT NULL DEFAULT 0,
    last_resignup_at    TIMESTAMPTZ NULL,
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS waitlist_outreach_removed_idx
    ON public.waitlist_outreach (waitlist_id) WHERE outreach_status = 'removed';

COMMENT ON TABLE public.waitlist_outreach IS
  'Admin-only outreach tracking per waitlist signup (#26). Service role only: RLS on, no policies.';

-- ----------------------------------------------------------------------------
-- NEW SIGNUPS START AS NOT SENT
-- SECURITY DEFINER because anon may insert into waitlist directly ("Anyone can
-- join waitlist") and holds no grant on waitlist_outreach.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.create_waitlist_outreach_row()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.waitlist_outreach (waitlist_id) VALUES (NEW.id)
  ON CONFLICT (waitlist_id) DO NOTHING;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.create_waitlist_outreach_row() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_waitlist_outreach_row ON public.waitlist;
CREATE TRIGGER trg_waitlist_outreach_row
    AFTER INSERT ON public.waitlist
    FOR EACH ROW EXECUTE FUNCTION public.create_waitlist_outreach_row();

-- Reuses the existing generic "NEW.updated_at = now()" function.
DROP TRIGGER IF EXISTS trigger_waitlist_outreach_updated_at ON public.waitlist_outreach;
CREATE TRIGGER trigger_waitlist_outreach_updated_at
    BEFORE UPDATE ON public.waitlist_outreach
    FOR EACH ROW EXECUTE FUNCTION public.update_waitlist_updated_at();

-- ----------------------------------------------------------------------------
-- BACKFILL (after the insert trigger exists, so a signup that lands during the
-- migration gets its row from the trigger or from here; ON CONFLICT covers both)
-- Existing signups start as Not sent. Anyone already unsubscribed starts as
-- Removed, with removed_at = unsubscribed_at, and loses their phone number and
-- text opt-in (decision 6a, matching what mark_waitlist_removed does).
-- ----------------------------------------------------------------------------
INSERT INTO public.waitlist_outreach (waitlist_id, outreach_status, removed_at)
SELECT w.id,
       CASE WHEN w.unsubscribed_at IS NOT NULL THEN 'removed' ELSE 'not_sent' END,
       w.unsubscribed_at
  FROM public.waitlist w
ON CONFLICT (waitlist_id) DO NOTHING;

-- THIS DELETION CANNOT BE ROLLED BACK. The cleared phone numbers are not kept
-- anywhere. Measured 2026-11-24: 1 unsubscribed row, with no phone number and
-- no text opt-in, so no text spot is held and none needs giving back.
UPDATE public.waitlist
   SET phone_number = NULL,
       text_opt_in  = false
 WHERE unsubscribed_at IS NOT NULL
   AND (phone_number IS NOT NULL OR text_opt_in);

-- ----------------------------------------------------------------------------
-- RE-SIGNUP FLAG
-- Called by api/signup.ts when an insert hits the unique email index. Counts
-- the attempt only if the existing record is Removed. Never changes the status.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.flag_removed_resignup(p_email text)
RETURNS boolean
LANGUAGE sql
SECURITY INVOKER
SET search_path = public
AS $$
  WITH hit AS (
    UPDATE public.waitlist_outreach o
       SET resignup_attempts = o.resignup_attempts + 1,
           last_resignup_at  = now()
      FROM public.waitlist w
     WHERE w.id = o.waitlist_id
       AND w.email = lower(trim(p_email))
       AND o.outreach_status = 'removed'
    RETURNING 1
  )
  SELECT EXISTS (SELECT 1 FROM hit);
$$;
REVOKE ALL ON FUNCTION public.flag_removed_resignup(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.flag_removed_resignup(text) TO service_role;

-- ----------------------------------------------------------------------------
-- MOVE TO REMOVED (admin action and the unsubscribe edge function)
-- Decision 5a: clears phone_number and text_opt_in. A held text spot (the
-- person had accepted, so slots_remaining was decremented) is given back to the
-- pool; a still-open offer is treated as declined, as the decline path does.
-- Returns pass_on_after = the person's created_at when a spot or open offer
-- should be passed on; the caller then calls claim_next_text_offer and sends
-- the offer email. Idempotent: a second call changes nothing further.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.mark_waitlist_removed(p_waitlist_id uuid)
RETURNS TABLE (was_already_removed boolean, pass_on_after timestamptz)
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_row           public.waitlist%ROWTYPE;
  v_status        text;
  v_held_slot     boolean;
  v_pending_offer boolean;
BEGIN
  SELECT * INTO v_row FROM public.waitlist WHERE id = p_waitlist_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'waitlist row % not found', p_waitlist_id USING ERRCODE = 'P0002';
  END IF;

  INSERT INTO public.waitlist_outreach (waitlist_id) VALUES (p_waitlist_id)
  ON CONFLICT (waitlist_id) DO NOTHING;

  SELECT o.outreach_status INTO v_status
    FROM public.waitlist_outreach o
   WHERE o.waitlist_id = p_waitlist_id
     FOR UPDATE;

  IF v_status <> 'removed' THEN
    UPDATE public.waitlist_outreach
       SET outreach_status = 'removed',
           removed_at      = now()
     WHERE waitlist_id = p_waitlist_id;
  END IF;

  v_held_slot     := v_row.text_opt_in;
  v_pending_offer := NOT v_row.text_opt_in
                     AND NOT v_row.text_opt_in_declined
                     AND v_row.text_opt_in_offer_sent_at IS NOT NULL
                     AND v_row.text_opt_in_expires_at > now();

  UPDATE public.waitlist
     SET phone_number         = NULL,
         text_opt_in          = false,
         text_opt_in_declined = text_opt_in_declined OR v_held_slot OR v_pending_offer
   WHERE id = p_waitlist_id;

  IF v_held_slot THEN
    UPDATE public.text_opt_in_config
       SET slots_remaining = slots_remaining + 1
     WHERE id = (SELECT min(id) FROM public.text_opt_in_config);
  END IF;

  RETURN QUERY
    SELECT (v_status = 'removed'),
           CASE WHEN v_held_slot OR v_pending_offer THEN v_row.created_at END;
END;
$$;
REVOKE ALL ON FUNCTION public.mark_waitlist_removed(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.mark_waitlist_removed(uuid) TO service_role;

-- ----------------------------------------------------------------------------
-- UNDO REMOVED (admin, decisions 2a and 3a)
-- Sets the new status and removed_cleared_at (removed_at is kept as history).
-- If the person had the founding badge and the founding cap is already reached
-- (founding members who are not Removed, the same count api/signup.ts uses),
-- they return WITHOUT the badge: is_founding_member = false. The cap is passed
-- in by the caller (MAX_FOUNDING_MEMBERS in src/lib/foundingMembers.ts, one
-- source). A transaction-scoped advisory lock serialises undos, so two undos
-- cannot both take the last spot. Returns founding_kept = false when the badge
-- was taken off. A deleted phone number is not restored.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.undo_waitlist_removed(
  p_waitlist_id uuid,
  p_new_status  text,
  p_founding_cap integer
)
RETURNS TABLE (founding_kept boolean)
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_status   text;
  v_founding boolean;
  v_count    bigint;
  v_kept     boolean := true;
BEGIN
  IF p_new_status IS NULL OR p_new_status NOT IN ('not_sent', 'sent', 'replied', 'quiet') THEN
    RAISE EXCEPTION 'undo needs a status other than removed, got %', p_new_status USING ERRCODE = '22023';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtext('waitlist_founding_cap'));

  SELECT o.outreach_status INTO v_status
    FROM public.waitlist_outreach o
   WHERE o.waitlist_id = p_waitlist_id
     FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'no outreach row for %', p_waitlist_id USING ERRCODE = 'P0002';
  END IF;
  IF v_status <> 'removed' THEN
    RAISE EXCEPTION 'signup % is not removed', p_waitlist_id USING ERRCODE = '55000';
  END IF;

  SELECT w.is_founding_member INTO v_founding
    FROM public.waitlist w
   WHERE w.id = p_waitlist_id
     FOR UPDATE;

  IF COALESCE(v_founding, false) THEN
    -- This person is still Removed here, so they are not in the count.
    SELECT count(*) INTO v_count
      FROM public.waitlist w
     WHERE w.is_founding_member = true
       AND NOT EXISTS (
             SELECT 1 FROM public.waitlist_outreach o
              WHERE o.waitlist_id = w.id AND o.outreach_status = 'removed');
    IF v_count >= p_founding_cap THEN
      UPDATE public.waitlist SET is_founding_member = false WHERE id = p_waitlist_id;
      v_kept := false;
    END IF;
  END IF;

  UPDATE public.waitlist_outreach
     SET outreach_status    = p_new_status,
         removed_cleared_at = now()
   WHERE waitlist_id = p_waitlist_id;

  RETURN QUERY SELECT v_kept;
END;
$$;
REVOKE ALL ON FUNCTION public.undo_waitlist_removed(uuid, text, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.undo_waitlist_removed(uuid, text, integer) TO service_role;

-- ----------------------------------------------------------------------------
-- NEXT TEXT OFFER (one selector for api/_textOffer.ts and the unsubscribe edge
-- function). Same filter as the old sendCascadeOffer in api/text-opt-in.ts, plus
-- Removed people left out, and the pick and the stamp happen in one statement.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.claim_next_text_offer(p_after timestamptz)
RETURNS TABLE (waitlist_id uuid, email text)
LANGUAGE sql
SECURITY INVOKER
SET search_path = public
AS $$
  WITH next_person AS (
    SELECT w.id
      FROM public.waitlist w
     WHERE w.created_at > p_after
       AND w.text_opt_in = false
       AND w.text_opt_in_declined = false
       AND w.unsubscribed_at IS NULL
       AND w.text_opt_in_offer_sent_at IS NULL
       AND NOT EXISTS (
             SELECT 1 FROM public.waitlist_outreach o
              WHERE o.waitlist_id = w.id AND o.outreach_status = 'removed')
     ORDER BY w.created_at ASC
     LIMIT 1
     FOR UPDATE OF w SKIP LOCKED
  )
  UPDATE public.waitlist w
     SET text_opt_in_offer_sent_at = now(),
         text_opt_in_expires_at    = now() + interval '48 hours'
    FROM next_person
   WHERE w.id = next_person.id
  RETURNING w.id, w.email;
$$;
REVOKE ALL ON FUNCTION public.claim_next_text_offer(timestamptz) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_next_text_offer(timestamptz) TO service_role;

-- ----------------------------------------------------------------------------
-- ACCESS: RLS ON with NO policies, grants revoked BY NAME (same posture as
-- followup_send_log). Only the service role (the admin API after
-- validateAdminRequest, and the senders) can read or write it.
-- ----------------------------------------------------------------------------
ALTER TABLE public.waitlist_outreach ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.waitlist_outreach FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.waitlist_outreach TO service_role;

-- ----------------------------------------------------------------------------
-- PUBLIC FOUNDING-SPOTS COUNTER LEAVES REMOVED PEOPLE OUT (decision 3b)
-- CREATE OR REPLACE, not DROP + CREATE: the three output columns keep their
-- names, order and types, and REPLACE keeps the live ACL (anon SELECT is how the
-- landing page reads it; a DROP would take the grant with it). The view stays
-- definer-rights, as today, so anon can read the aggregate without any grant on
-- waitlist_outreach; it still exposes only the three aggregates.
-- Stored waitlist_position values are not changed.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW public.founding_member_slots AS
  SELECT
    count(*) FILTER (WHERE w.waitlist_position <= 100 AND NOT r.is_removed)        AS slots_used,
    100 - count(*) FILTER (WHERE w.waitlist_position <= 100 AND NOT r.is_removed)  AS slots_remaining,
    count(*) FILTER (WHERE w.waitlist_position <= 100 AND NOT r.is_removed) < 100  AS slots_available
  FROM waitlist w
  CROSS JOIN LATERAL (
    SELECT EXISTS (
      SELECT 1 FROM waitlist_outreach o
       WHERE o.waitlist_id = w.id AND o.outreach_status = 'removed'
    ) AS is_removed
  ) r;

-- ============================================================================
-- VERIFY (read-only; run after applying)
-- ============================================================================
-- 1. RLS on, 0 policies, ACL postgres + service_role only:
--   select c.relrowsecurity,
--          (select count(*) from pg_policies where tablename = 'waitlist_outreach'),
--          array_to_string(c.relacl, ' | ')
--     from pg_class c where c.relname = 'waitlist_outreach';
-- 2. One outreach row per signup, and unsubscribed rows backfilled as removed
--    (expect w = o, and unsub = removed_from_unsub):
--   select (select count(*) from waitlist) w,
--          (select count(*) from waitlist_outreach) o,
--          (select count(*) from waitlist where unsubscribed_at is not null) unsub,
--          (select count(*) from waitlist_outreach o join waitlist w on w.id = o.waitlist_id
--            where o.outreach_status = 'removed' and o.removed_at = w.unsubscribed_at) removed_from_unsub;
-- 3. Functions are service_role only (expect no anon / authenticated in proacl):
--   select proname, proacl from pg_proc
--    where proname in ('flag_removed_resignup', 'mark_waitlist_removed',
--                      'undo_waitlist_removed', 'claim_next_text_offer',
--                      'create_waitlist_outreach_row');
-- 2b. No unsubscribed row keeps a phone number or text opt-in (expect 0):
--   select count(*) from waitlist
--    where unsubscribed_at is not null and (phone_number is not null or text_opt_in);
-- 4. The public counter still works for anon, and its grant survived (expect true):
--   select * from public.founding_member_slots;
--   select has_table_privilege('anon', 'public.founding_member_slots', 'SELECT');
-- 5. The view is still definer-rights (expect reloptions null or without security_invoker):
--   select reloptions from pg_class where relname = 'founding_member_slots';
