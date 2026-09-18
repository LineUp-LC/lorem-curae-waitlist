-- Founding member cap: 1000 -> 100.
--
-- Founder decision 2026-09-18. The public counter on the landing page and the
-- member page both read slots_remaining from this view, so this one statement
-- moves both, with no deploy.
--
-- NOBODY IS DEMOTED. Measured before writing:
--   select count(*), count(*) filter (where waitlist_position <= 1000),
--          count(*) filter (where waitlist_position <= 100), max(waitlist_position)
--     from waitlist;
--   -> 21 rows, 21 at <= 1000, 21 at <= 100, max position 22.
-- Every existing signup stays inside the new cap. The counter reads 979 before
-- and 79 after; no row changes classification.
--
-- CREATE OR REPLACE, NOT DROP + CREATE, AND THAT IS DELIBERATE.
-- Rule 27 prescribes DROP + CREATE for a view change, because CREATE OR REPLACE
-- cannot rename, remove, reorder or retype a column. NONE of that happens here:
-- the three output columns keep their names, order and types, and only a literal
-- changes. Replace is therefore legal.
--
-- It is also the SAFER of the two here, which is the part worth reading. The live
-- ACL is:
--   {postgres=arwdDxtm/postgres, anon=rxtm/postgres,
--    authenticated=arwdDxtm/postgres, service_role=arwdDxtm/postgres}
-- anon holds SELECT, and anon is how the landing page reads the counter. A DROP
-- would take that grant with it and the public counter would start failing until
-- someone re-granted. CREATE OR REPLACE keeps the ACL untouched.
--
-- Note `information_schema.role_table_grants` returns ZERO rows for this view,
-- so it cannot be used to check this. Read pg_class.relacl (rule 27: read the
-- ACL, not the role list).
--
-- NO DEPENDENTS: checked via pg_depend/pg_rewrite before writing; nothing else
-- selects from this view inside the database.
--
-- ROLLBACK: re-run this file with 100 changed back to 1000.

CREATE OR REPLACE VIEW public.founding_member_slots AS
  SELECT
    count(*) FILTER (WHERE waitlist_position <= 100)              AS slots_used,
    100 - count(*) FILTER (WHERE waitlist_position <= 100)        AS slots_remaining,
    count(*) FILTER (WHERE waitlist_position <= 100) < 100        AS slots_available
  FROM waitlist;

-- VERIFY (expect slots_used 21, slots_remaining 79, slots_available true):
--   select * from public.founding_member_slots;
-- VERIFY the grant survived (expect true):
--   select has_table_privilege('anon','public.founding_member_slots','SELECT');
