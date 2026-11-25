-- APPLIED Nov 24 2026 (version 20261125025824) through the Supabase connector on Ethan's typed apply in chat; do not re-apply. Proven by one real signup through the site (#22 on screen, in the database and in the welcome email).
--
-- Signups broke after 20261125024242_founding_number (waitlist issue 43).
--
-- WHAT BROKE. Supabase loads the safeupdate extension for every API session
-- (pg_db_role_setting: authenticator has session_preload_libraries =
-- supautils, safeupdate). safeupdate rejects an UPDATE with no WHERE clause, even
-- inside a trigger. Both founding-number triggers updated the one-row
-- founding_number_counter with no WHERE, so every signup through /api/signup
-- failed with 21000 "UPDATE requires a WHERE clause" (Vercel log, 02:50:49 UTC
-- Nov 25), and an admin turning founding ON would fail the same way. The verify
-- queries passed because the connector session does not load safeupdate.
--
-- THE FIX. Both functions are recreated with WHERE only_row on the counter
-- UPDATE. Nothing else changes: same signatures, owner, SECURITY DEFINER,
-- search_path, locks and rules. The triggers point at the functions by name, so
-- they pick up the new bodies with no trigger change.
--
-- ROLLBACK (comments): re-run the two CREATE OR REPLACE FUNCTION blocks from
-- 20261125024242_founding_number.sql (this restores the broken versions; only
-- useful together with rolling that whole migration back).
--
-- VERIFY after applying:
--   1. Both bodies carry the WHERE (expect 2):
--      select count(*) from pg_proc
--       where proname in ('assign_founding_number','sync_founding_number')
--         and prosrc like '%WHERE only_row%';
--   2. ONE real signup through the live site (the API path, which loads
--      safeupdate). SQL reads alone cannot show this bug.

BEGIN;

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
    UPDATE public.founding_number_counter
       SET last_number = last_number + 1
     WHERE only_row
     RETURNING last_number INTO NEW.founding_number;
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
        UPDATE public.founding_number_counter
           SET last_number = last_number + 1
         WHERE only_row
         RETURNING last_number INTO NEW.founding_number;
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

COMMIT;
