-- NOT APPLIED: Ethan types apply in chat; Claude applies it through the Supabase connector.
--
-- The admin founding switch can no longer pass the 100 cap (waitlist #44).
--
-- WHY. Turning is_founding_member on from the admin person page (api/admin.ts
-- handleUpdateUser) wrote the flag with no cap check, and sync_founding_number
-- only handed out the next number. At 100 founders a mistaken click made a 101st
-- founder and the public spots-left counter went below zero.
--
-- THE RULE (Nov 24 2026): the cap is 100 founders who are not Removed. A Removed
-- person keeps their record and number but frees a spot, so switching a Removed
-- person on is still allowed (they take no spot; undo_waitlist_removed re-checks
-- the cap when they come back).
--
-- WHAT CHANGES. Only sync_founding_number. Turning founding ON now always takes
-- the founding lock (the one assign_founding_number and undo_waitlist_removed
-- take), counts founders who are not Removed (this row left out), and refuses
-- with errcode FC001 when 100 are already counted. api/admin.ts turns FC001 into
-- a 409 "Founding spots are full (100 of 100). Nothing was changed."
-- Numbering is unchanged: the counter UPDATE keeps WHERE only_row (safeupdate is
-- loaded for the website's database login; see 20261125025824), and no other
-- UPDATE or DELETE is added. Same signature, owner, SECURITY DEFINER and
-- search_path; the trigger points at the function by name, so it needs no change.
--
-- LOCK ORDER. The UPDATE holds the row lock when this trigger asks for the cap
-- lock, the same order undo_waitlist_removed uses, so the two cannot deadlock.
--
-- THE CAP 100 IS A SYNC PAIR with MAX_FOUNDING_MEMBERS (src/lib/foundingMembers.ts),
-- assign_founding_number() and the founding_member_slots view.
--
-- SIGNUP. This trigger fires on every UPDATE of waitlist, including signup's own
-- follow-up write (the text-offer stamp), with is_founding_member unchanged. Prove
-- it with one real signup through the website after applying.
--
-- ROLLBACK (comments): re-run the sync_founding_number block from
-- 20261125025824_founding_counter_where.sql (the version without the cap check).
--
-- VERIFY after applying:
--   1. The body carries the check and the WHERE (expect true, true):
--      select prosrc like '%FC001%', prosrc like '%WHERE only_row%'
--        from pg_proc where proname = 'sync_founding_number';
--   2. ONE real signup through the live site.

BEGIN;

CREATE OR REPLACE FUNCTION public.sync_founding_number()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE
  v_count   bigint;
  v_removed boolean;
BEGIN
  IF NEW.is_founding_member IS DISTINCT FROM OLD.is_founding_member THEN
    IF COALESCE(NEW.is_founding_member, false) THEN
      PERFORM pg_advisory_xact_lock(hashtext('waitlist_founding_cap'));
      SELECT EXISTS (SELECT 1 FROM public.waitlist_outreach o
                      WHERE o.waitlist_id = NEW.id AND o.outreach_status = 'removed')
        INTO v_removed;
      IF NOT v_removed THEN
        SELECT count(*) INTO v_count
          FROM public.waitlist w
         WHERE w.is_founding_member = true
           AND w.id <> NEW.id
           AND NOT EXISTS (SELECT 1 FROM public.waitlist_outreach o
                            WHERE o.waitlist_id = w.id AND o.outreach_status = 'removed');
        IF v_count >= 100 THEN  -- SYNC PAIR: MAX_FOUNDING_MEMBERS
          RAISE EXCEPTION 'founding spots are full' USING ERRCODE = 'FC001';
        END IF;
      END IF;
      IF OLD.founding_number IS NULL THEN
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
