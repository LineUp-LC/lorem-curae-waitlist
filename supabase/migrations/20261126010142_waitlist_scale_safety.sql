-- ============================================================================
-- NOT APPLIED: Ethan applies through the connector.
-- ============================================================================
-- WAITLIST SCALE SAFETY: the not-Removed view (waitlist issue 32) and the
-- sign-in / signup request limiter (Ethan picked our own counter, Nov 25 2026).
--
-- PART 1. public.waitlist_not_removed
--   Every waitlist row whose outreach status is not Removed. Replaces
--   readRemovedIds + excludeIds in api/_outreach.ts, which read every Removed id
--   into the server and put them all in the request address ("id not in (...)").
--   Past about 1,000 Removed people that address grows too long and the read
--   fails. The filter now runs in the database.
--   - A row with NO outreach row counts as not Removed, the same rule the old
--     helper and the founding counter use (NOT EXISTS ... = 'removed').
--   - security_invoker = true (the caller's rights apply). Readable by the
--     service role only, like waitlist_outreach: anon and authenticated are
--     revoked by name, since Supabase's default privileges grant them new views.
--   - w.* is expanded when the view is created. A column added to waitlist
--     later does NOT appear here until the view is recreated.
--
-- PART 2. public.request_limit_hits + public.hit_request_limit(text, text)
--   One counter for api/request-magic-link.ts (email key and network key) and
--   api/signup.ts (network key). Keys arrive already SHA-256 hashed by the API
--   ("email:" + lowercased email, "ip:" + first x-forwarded-for address); the
--   raw email or address never reaches the database.
--   - Fixed 10-minute windows. Limits: 5 per email key, 30 per network key.
--     The limits live HERE, one source; the API sends only the kind.
--   - Counts and decides in one statement (INSERT ... ON CONFLICT DO UPDATE
--     takes the row lock, so two requests at once cannot both read the old
--     count). Denied requests are counted too.
--   - Deletes rows older than 1 hour on every call.
--   - EVERY UPDATE AND DELETE HAS A WHERE: the API login preloads safeupdate,
--     which rejects UPDATE or DELETE without one, even inside a function
--     (decision log 58.3; the 20261125025824 incident).
--   - SECURITY DEFINER, callable by the service role only.
--   - The API fails OPEN when this cannot be reached (signups never break
--     because of the limiter).
--
-- ACCESS (RLS): request_limit_hits turns RLS on with no policies.
--   | role          | read     | change   | add      | delete   |
--   | anon          | no rows  | no rows  | no rows  | no rows  |
--   | authenticated | no rows  | no rows  | no rows  | no rows  |
--   | service role  | all rows | all rows | all rows | all rows |
--   (Grants are revoked from anon and authenticated as well, so both gates are
--   closed. The function writes as its owner.)
--   waitlist_not_removed has no policies of its own (views cannot); with
--   security_invoker it applies waitlist's and waitlist_outreach's rules for
--   the caller, and only the service role holds SELECT on it.
--
-- ROLLBACK (one transaction; nothing here deletes or changes existing data):
--   BEGIN;
--   DROP FUNCTION IF EXISTS public.hit_request_limit(text, text);
--   DROP TABLE IF EXISTS public.request_limit_hits;
--   DROP VIEW IF EXISTS public.waitlist_not_removed;
--   COMMIT;
--   Roll back the API code first (or together): the admin routes fail closed
--   with an error when the view is missing, and the limiter fails open.
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- PART 1: the not-Removed view
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW public.waitlist_not_removed
WITH (security_invoker = true) AS
  SELECT w.*
    FROM public.waitlist w
   WHERE NOT EXISTS (
           SELECT 1 FROM public.waitlist_outreach o
            WHERE o.waitlist_id = w.id
              AND o.outreach_status = 'removed');

COMMENT ON VIEW public.waitlist_not_removed IS
  'Waitlist rows that are not Removed (waitlist issue 32). Service role only. w.* is fixed at creation: recreate after adding a waitlist column.';

REVOKE ALL ON public.waitlist_not_removed FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.waitlist_not_removed TO service_role;

-- ----------------------------------------------------------------------------
-- PART 2: the request limiter
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.request_limit_hits (
    kind          TEXT        NOT NULL CHECK (kind IN ('email', 'ip')),
    key_hash      TEXT        NOT NULL CHECK (key_hash ~ '^[0-9a-f]{64}$'),  -- SHA-256 hex, never a raw value
    window_start  TIMESTAMPTZ NOT NULL,
    hits          INTEGER     NOT NULL DEFAULT 1,
    PRIMARY KEY (kind, key_hash, window_start)
);

CREATE INDEX IF NOT EXISTS request_limit_hits_window_idx
    ON public.request_limit_hits (window_start);

COMMENT ON TABLE public.request_limit_hits IS
  'Sign-in and signup request counter (hashed keys, 10-minute windows). Service role only: RLS on, no policies.';

ALTER TABLE public.request_limit_hits ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.request_limit_hits FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.request_limit_hits TO service_role;

-- Returns true when this request is allowed (the hit is counted either way).
CREATE OR REPLACE FUNCTION public.hit_request_limit(p_kind text, p_key_hash text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_limit  integer;
  v_window timestamptz;
  v_hits   integer;
BEGIN
  v_limit := CASE p_kind WHEN 'email' THEN 5 WHEN 'ip' THEN 30 END;
  IF v_limit IS NULL THEN
    RAISE EXCEPTION 'unknown request limit kind %', p_kind USING ERRCODE = '22023';
  END IF;

  -- Fixed 10-minute window (600 seconds).
  v_window := to_timestamp(floor(extract(epoch FROM now()) / 600) * 600);

  -- Old rows go first. WHERE is required (safeupdate).
  DELETE FROM public.request_limit_hits
   WHERE window_start < now() - interval '1 hour';

  -- Count and read back in one locked step. The DO UPDATE carries a WHERE too,
  -- so no UPDATE in this function is ever without one.
  INSERT INTO public.request_limit_hits AS h (kind, key_hash, window_start, hits)
  VALUES (p_kind, p_key_hash, v_window, 1)
  ON CONFLICT (kind, key_hash, window_start)
  DO UPDATE SET hits = h.hits + 1
          WHERE h.kind = EXCLUDED.kind
            AND h.key_hash = EXCLUDED.key_hash
            AND h.window_start = EXCLUDED.window_start
  RETURNING h.hits INTO v_hits;

  RETURN v_hits <= v_limit;
END;
$$;

REVOKE ALL ON FUNCTION public.hit_request_limit(text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.hit_request_limit(text, text) TO service_role;

COMMIT;

NOTIFY pgrst, 'reload schema';

-- ============================================================================
-- VERIFY (read-only; run after applying)
-- ============================================================================
-- 1. The view leaves out exactly the Removed rows (expect view = all - removed):
--   select (select count(*) from waitlist) all_rows,
--          (select count(*) from waitlist_outreach where outreach_status = 'removed') removed,
--          (select count(*) from waitlist_not_removed) view_rows;
-- 2. The view is invoker-rights (expect {security_invoker=true}):
--   select reloptions from pg_class where relname = 'waitlist_not_removed';
-- 3. No anon / authenticated on the view, the table or the function
--    (expect false, false, false, false, and proacl without anon/authenticated):
--   select has_table_privilege('anon', 'public.waitlist_not_removed', 'SELECT'),
--          has_table_privilege('authenticated', 'public.waitlist_not_removed', 'SELECT'),
--          has_table_privilege('anon', 'public.request_limit_hits', 'SELECT'),
--          has_table_privilege('authenticated', 'public.request_limit_hits', 'SELECT');
--   select proname, prosecdef, proacl from pg_proc where proname = 'hit_request_limit';
-- 4. RLS on, 0 policies:
--   select c.relrowsecurity,
--          (select count(*) from pg_policies where tablename = 'request_limit_hits')
--     from pg_class c where c.relname = 'request_limit_hits';
-- 5. THE LIMITER UNDER safeupdate. The connector session does NOT load
--    safeupdate, so SQL calls here cannot prove the WHERE clauses. Prove it
--    through the API path: six sign-in requests for one test email within ten
--    minutes; the sixth must answer 429 too_many_requests.
