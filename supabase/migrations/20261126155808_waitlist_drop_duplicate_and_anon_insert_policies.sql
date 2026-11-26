-- APPLIED Nov 26 2026 (version 20261126155808) through the Supabase connector on Ethan's typed apply in chat; do not re-apply.
-- Waitlist issue 25: "Service role full access" duplicated "Service role can manage waitlist" exactly.
-- Also: "Anyone can join waitlist" let the anon key insert rows directly, skipping the API's request limit and checks. The site signs up through api/signup.ts (service role).
-- Proven Nov 26 2026: an anon insert was refused by row-level security, and a real signup through the site worked and got its welcome email.
-- Undo:
--   CREATE POLICY "Anyone can join waitlist" ON public.waitlist FOR INSERT TO anon
--     WITH CHECK ((email IS NOT NULL) AND (email <> ''::text));
--   CREATE POLICY "Service role full access" ON public.waitlist FOR ALL TO service_role
--     USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Service role full access" ON public.waitlist;
DROP POLICY IF EXISTS "Anyone can join waitlist" ON public.waitlist;
