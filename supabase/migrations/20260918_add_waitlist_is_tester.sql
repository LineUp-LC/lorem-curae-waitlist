-- Admin-assigned tester flag on public.waitlist.
--
-- WHY A NEW COLUMN RATHER THAN REUSING wants_tester_access.
-- wants_tester_access is the USER's declaration, captured at signup: "I would
-- like to test." is_tester is OUR decision: "we have selected this person."
-- They are different facts and they disagree in both directions -- someone can
-- ask and not be picked, and someone can be picked who never asked. Writing an
-- admin decision into the request column destroys the only record of who
-- volunteered, and that record cannot be reconstructed afterwards.
--
-- Measured before writing:
--   select count(*) total,
--          count(*) filter (where wants_tester_access) asked
--     from public.waitlist;
--   -> 21 total, 5 asked.
--
-- ADDITIVE AND NON-BREAKING. NOT NULL with a default, so every existing row
-- gets false and no backfill is needed. No RLS change: policies on waitlist are
-- row-scoped, not column-scoped.
--
-- NO VIEW BREAKS. Rule 27 warns that a view selecting `t.*` inherits the
-- table's column positions, so an additive column lands mid-list and
-- CREATE OR REPLACE VIEW cannot express it. Checked before writing:
--   select c.relname from pg_depend d
--     join pg_rewrite r on r.oid = d.objid
--     join pg_class c on c.oid = r.ev_class
--    where d.refobjid = 'public.waitlist'::regclass and c.relname <> 'waitlist'
--    group by 1;
--   -> founding_member_slots only, and it selects three aggregates, never `*`.
--      Unaffected.
--
-- WHAT THIS COLUMN DOES NOT DO: it does not grant app access (has_access, via
-- the grant-access action) and it does not affect the founding counter, which
-- reads waitlist_position <= 100 and never reads a flag.
--
-- ROLLBACK:
--   ALTER TABLE public.waitlist DROP COLUMN is_tester;

ALTER TABLE public.waitlist
  ADD COLUMN IF NOT EXISTS is_tester BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN public.waitlist.is_tester IS
  'Admin-assigned: this person has been selected as a tester. Distinct from wants_tester_access, which is the person''s own request and must never be overwritten to record this decision.';

-- VERIFY (expect is_tester present, boolean, NOT NULL, default false):
--   select column_name, data_type, is_nullable, column_default
--     from information_schema.columns
--    where table_schema = 'public' and table_name = 'waitlist'
--      and column_name = 'is_tester';
-- VERIFY no row was disturbed (expect 21 rows, 0 true):
--   select count(*) total, count(*) filter (where is_tester) tester
--     from public.waitlist;
