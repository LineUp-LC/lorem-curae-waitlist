-- Stop assign_waitlist_position() from auto-stamping price_locked. The founding
-- rate is undecided pending AI/personalization cost-per-user measurement.
-- Existing rows are untouched -- this only changes future inserts.
-- waitlist_position keeps incrementing exactly as before.
--
-- founding_member_slots is re-keyed off waitlist_position <= 1000 instead of
-- price_locked, so the public "spots remaining" counter keeps moving with real
-- signups regardless of when the rate is decided. Output columns and types are
-- unchanged (slots_used, slots_remaining, slots_available).
--
-- Applied via mcp apply_migration 2026-09-16; verified live: function and view
-- definitions match this file, founding_member_slots reads 21/979 both before
-- and after (no discontinuity for existing rows).

CREATE OR REPLACE FUNCTION public.assign_waitlist_position()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  next_position integer;
BEGIN
  SELECT COALESCE(MAX(waitlist_position), 0) + 1
  INTO next_position
  FROM public.waitlist;

  NEW.waitlist_position := next_position;
  -- price_locked no longer auto-set here (was: next_position <= 1000).
  -- Column default (false) applies to new rows until a rate is decided.

  RETURN NEW;
END;
$function$;

CREATE OR REPLACE VIEW public.founding_member_slots AS
SELECT
  count(*) FILTER (WHERE waitlist_position <= 1000) AS slots_used,
  1000 - count(*) FILTER (WHERE waitlist_position <= 1000) AS slots_remaining,
  count(*) FILTER (WHERE waitlist_position <= 1000) < 1000 AS slots_available
FROM public.waitlist;
