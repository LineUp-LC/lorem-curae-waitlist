-- NOT APPLIED: Ethan types apply in chat; Claude applies it through the Supabase connector.
--
-- One founding number per founding member (waitlist #43, Ethan's picks 1c and 2a,
-- Nov 24 2026).
--
-- WHY. A founder saw three different numbers for one signup: the success screen
-- counted every earlier row, the welcome email counted earlier founders, and
-- waitlist_position is MAX+1 with a permanent gap where position 1 was deleted.
-- This adds ONE stored number that every surface reads.
--
-- THE RULES (1c):
--   - waitlist.founding_number is a nullable integer with a UNIQUE index.
--   - It is set once, when a founder is created, and never renumbered: not when
--     someone is deleted, and not when someone is marked Removed (Removed people
--     keep their number). Non-founders have null.
--   - On insert, the founding decision and the number are made in ONE locked step
--     (a transaction-level advisory lock in a BEFORE INSERT trigger), so two signups
--     at the same moment cannot both take the 100th spot or the same number.
--   - The cap is 100 founders who are not Removed (the same rule as signup's old
--     cap check, the admin stats and undo_waitlist_removed). A Removed founder
--     frees a spot but keeps their number, so numbers can pass 100.
--
-- THE CAP 100 IS A SYNC PAIR with MAX_FOUNDING_MEMBERS (src/lib/foundingMembers.ts).
-- It is written twice below: in assign_founding_number() and in the
-- founding_member_slots view. Change all three together.
--
-- PRICE LOCK IS UNCHANGED. Since 20260916 no insert sets price_locked (the column
-- default false applies); this migration does not set it either. The Jan 21 row
-- made a founder in step 2 already has price_locked = true (measured 2026-11-24).
--
-- MEASURED BEFORE WRITING (2026-11-24, read-only):
--   select id, created_at, is_founding_member, waitlist_position
--     from waitlist order by created_at, id limit 1;
--   -> 68441bf8-f39e-472e-8cd9-366eea416914, 2026-01-21 16:30:59 UTC,
--      is_founding_member false, waitlist_position 2 (the only non-founder of 21).
--   select count(*) filter (where is_founding_member) from waitlist;  -> 20
--   founding_member_slots -> slots_used 20, slots_remaining 80 (counted by
--   position, which included the Jan 21 non-founder and left out the Removed one).
--   founding_member_slots: owner postgres, reloptions null (owner rights), ACL
--   postgres=arwdDxtm, anon=r, authenticated=r, service_role=arwdDxtm.
--
-- EXPECTED AFTER: 21 founders numbered 1..21 by (created_at, id); the Jan 21 row
-- is 1; the Removed founder keeps their place (13); founding_member_slots reads
-- slots_used 20, slots_remaining 80 (21 founders, 1 Removed).
--
-- ============================================================================
-- ROLLBACK (comments; run as one transaction):
--   BEGIN;
--   DROP TRIGGER IF EXISTS trg_assign_founding_number ON public.waitlist;
--   DROP TRIGGER IF EXISTS trg_sync_founding_number ON public.waitlist;
--   DROP FUNCTION IF EXISTS public.assign_founding_number();
--   DROP FUNCTION IF EXISTS public.sync_founding_number();
--   CREATE OR REPLACE VIEW public.founding_member_slots AS
--     SELECT
--       count(*) FILTER (WHERE w.waitlist_position <= 100 AND NOT r.is_removed)        AS slots_used,
--       100 - count(*) FILTER (WHERE w.waitlist_position <= 100 AND NOT r.is_removed)  AS slots_remaining,
--       count(*) FILTER (WHERE w.waitlist_position <= 100 AND NOT r.is_removed) < 100  AS slots_available
--     FROM waitlist w
--     CROSS JOIN LATERAL (
--       SELECT EXISTS (
--         SELECT 1 FROM waitlist_outreach o
--          WHERE o.waitlist_id = w.id AND o.outreach_status = 'removed'
--       ) AS is_removed
--     ) r;
--   -- undo_waitlist_removed: re-run its definition from
--   -- 20261124_add_waitlist_outreach.sql (the demote UPDATE without founding_number).
--   UPDATE public.waitlist SET is_founding_member = false
--    WHERE id = '68441bf8-f39e-472e-8cd9-366eea416914';
--   DROP INDEX IF EXISTS public.waitlist_founding_number_key;
--   ALTER TABLE public.waitlist DROP COLUMN IF EXISTS founding_number;
--   COMMIT;
-- The API code on feature/founding-number reads founding_number, so roll the
-- deploy back before (or with) this.
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 1. Column and unique index
-- ----------------------------------------------------------------------------
ALTER TABLE public.waitlist ADD COLUMN IF NOT EXISTS founding_number integer;

CREATE UNIQUE INDEX IF NOT EXISTS waitlist_founding_number_key
  ON public.waitlist (founding_number);

-- ----------------------------------------------------------------------------
-- 2. The Jan 21 2026 signup becomes a founding member (2a)
-- ----------------------------------------------------------------------------
UPDATE public.waitlist
   SET is_founding_member = true
 WHERE id = '68441bf8-f39e-472e-8cd9-366eea416914';

-- ----------------------------------------------------------------------------
-- 3. Backfill: every founder, in signup order, Removed founders included
-- ----------------------------------------------------------------------------
UPDATE public.waitlist w
   SET founding_number = n.rn
  FROM (
    SELECT id, row_number() OVER (ORDER BY created_at, id) AS rn
      FROM public.waitlist
     WHERE is_founding_member = true
  ) n
 WHERE w.id = n.id;

-- ----------------------------------------------------------------------------
-- 4. One locked step on insert (and number upkeep on update)
--
-- SECURITY DEFINER so the count and the MAX see every row: the table has an
-- anon INSERT policy, and under the caller's RLS an anon insert would count no
-- founders at all. The lock key is the one undo_waitlist_removed already takes,
-- so an insert and an undo cannot both take the last spot.
--
-- Trigger names fire in alphabetical order: trg_assign_founding_number runs
-- BEFORE trg_assign_wave, so a non-founder's wave_number = 1 / status = 'active'
-- (what api/signup.ts used to set when the cap was reached) is in place before
-- assign_wave_on_insert looks at it, exactly as before.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.assign_founding_number()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_count bigint;
BEGIN
  -- The creator pool is separate and is not numbered here.
  IF COALESCE(NEW.is_creator, false) OR COALESCE(NEW.is_founding_member_creator, false) THEN
    NEW.is_founding_member := false;
    NEW.founding_number    := NULL;
    RETURN NEW;
  END IF;

  PERFORM pg_advisory_xact_lock(hashtext('waitlist_founding_cap'));

  SELECT count(*) INTO v_count
    FROM public.waitlist w
   WHERE w.is_founding_member = true
     AND NOT EXISTS (
           SELECT 1 FROM public.waitlist_outreach o
            WHERE o.waitlist_id = w.id AND o.outreach_status = 'removed');

  IF v_count < 100 THEN  -- SYNC PAIR: MAX_FOUNDING_MEMBERS
    NEW.is_founding_member := true;
    SELECT COALESCE(max(founding_number), 0) + 1
      INTO NEW.founding_number
      FROM public.waitlist;
  ELSE
    NEW.is_founding_member := false;
    NEW.founding_number    := NULL;
    IF NEW.wave_number IS NULL THEN
      NEW.wave_number := 1;
      NEW.status      := 'active';
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_assign_founding_number ON public.waitlist;
CREATE TRIGGER trg_assign_founding_number
  BEFORE INSERT ON public.waitlist
  FOR EACH ROW EXECUTE FUNCTION public.assign_founding_number();

-- On update the number is never rewritten. It is only given (a row an admin makes
-- a founder gets the next number, as admin's founding toggle has never checked the
-- cap) or cleared (a row that stops being a founder, as undo_waitlist_removed does
-- when the spots are full).
CREATE OR REPLACE FUNCTION public.sync_founding_number()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.is_founding_member IS DISTINCT FROM OLD.is_founding_member THEN
    IF COALESCE(NEW.is_founding_member, false) THEN
      IF OLD.founding_number IS NULL THEN
        PERFORM pg_advisory_xact_lock(hashtext('waitlist_founding_cap'));
        SELECT COALESCE(max(founding_number), 0) + 1
          INTO NEW.founding_number
          FROM public.waitlist;
      ELSE
        NEW.founding_number := OLD.founding_number;
      END IF;
    ELSE
      NEW.founding_number := NULL;
    END IF;
  ELSE
    NEW.founding_number := OLD.founding_number;
  END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_sync_founding_number ON public.waitlist;
CREATE TRIGGER trg_sync_founding_number
  BEFORE UPDATE ON public.waitlist
  FOR EACH ROW EXECUTE FUNCTION public.sync_founding_number();

REVOKE ALL ON FUNCTION public.assign_founding_number() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.sync_founding_number() FROM PUBLIC, anon, authenticated;

-- ----------------------------------------------------------------------------
-- 5. Spots remaining = 100 minus founders who are not Removed
--
-- CREATE OR REPLACE keeps the owner (postgres), owner-rights behaviour and the ACL
-- (anon and authenticated read it for the public counter). Column names, order and
-- types are unchanged (bigint, bigint, boolean). security_invoker is deliberately
-- NOT set here: that is app issue 658.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW public.founding_member_slots AS
  SELECT
    count(*) FILTER (WHERE w.is_founding_member AND NOT r.is_removed)        AS slots_used,
    100 - count(*) FILTER (WHERE w.is_founding_member AND NOT r.is_removed)  AS slots_remaining,
    count(*) FILTER (WHERE w.is_founding_member AND NOT r.is_removed) < 100  AS slots_available
  FROM waitlist w
  CROSS JOIN LATERAL (
    SELECT EXISTS (
      SELECT 1 FROM waitlist_outreach o
       WHERE o.waitlist_id = w.id AND o.outreach_status = 'removed'
    ) AS is_removed
  ) r;

-- ----------------------------------------------------------------------------
-- 6. undo_waitlist_removed: same rule, and a demoted person loses the number
--
-- Identical to the live definition (read 2026-11-24) except the demote UPDATE also
-- clears founding_number. (trg_sync_founding_number would clear it anyway; it is
-- written here so the function says what it does.) CREATE OR REPLACE keeps its
-- grants.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.undo_waitlist_removed(p_waitlist_id uuid, p_new_status text, p_founding_cap integer)
 RETURNS TABLE(founding_kept boolean)
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  v_status   text;
  v_founding boolean;
  v_count    bigint;
  v_kept     boolean := true;
BEGIN
  IF p_new_status IS NULL OR p_new_status NOT IN ('not_sent', 'sent', 'replied', 'quiet') THEN
    RAISE EXCEPTION 'undo needs a status other than removed, got %', p_new_status USING ERRCODE = '22023';
  END IF;

  IF p_founding_cap IS NULL OR p_founding_cap <= 0 THEN
    RAISE EXCEPTION 'undo needs a positive founding cap, got %', p_founding_cap USING ERRCODE = '22023';
  END IF;

  PERFORM pg_advisory_xact_lock(hashtext('waitlist_founding_cap'));

  SELECT w.is_founding_member INTO v_founding
    FROM public.waitlist w
   WHERE w.id = p_waitlist_id
     FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'waitlist row % not found', p_waitlist_id USING ERRCODE = 'P0002';
  END IF;

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

  IF COALESCE(v_founding, false) THEN
    SELECT count(*) INTO v_count
      FROM public.waitlist w
     WHERE w.is_founding_member = true
       AND NOT EXISTS (
             SELECT 1 FROM public.waitlist_outreach o
              WHERE o.waitlist_id = w.id AND o.outreach_status = 'removed');
    IF v_count >= p_founding_cap THEN
      UPDATE public.waitlist
         SET is_founding_member = false,
             price_locked       = false,
             founding_number    = NULL
       WHERE id = p_waitlist_id;
      v_kept := false;
    END IF;
  END IF;

  UPDATE public.waitlist_outreach
     SET outreach_status    = p_new_status,
         removed_cleared_at = now()
   WHERE waitlist_id = p_waitlist_id;

  RETURN QUERY SELECT v_kept;
END;
$function$;

COMMIT;

-- ============================================================================
-- VERIFY (read-only; run after applying)
-- 1. Numbers (expect 21 rows, 1..21, Jan 21 row = 1, Removed founder = 13):
--   select w.founding_number, w.created_at, o.outreach_status
--     from waitlist w left join waitlist_outreach o on o.waitlist_id = w.id
--    where w.is_founding_member order by w.founding_number;
-- 2. No founder without a number, no non-founder with one (expect 0, 0):
--   select count(*) filter (where is_founding_member and founding_number is null),
--          count(*) filter (where not is_founding_member and founding_number is not null)
--     from waitlist;
-- 3. Counter (expect 20, 80, true):  select * from public.founding_member_slots;
-- 4. Counter still readable by the public page (expect true, true):
--   select has_table_privilege('anon','public.founding_member_slots','SELECT'),
--          (select reloptions is null from pg_class where relname = 'founding_member_slots');
-- ============================================================================
