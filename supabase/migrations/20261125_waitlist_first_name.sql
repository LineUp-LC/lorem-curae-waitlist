-- NOT APPLIED: Ethan types apply in chat; Claude applies it through the Supabase connector.
--
-- Waitlist #40: a first name at signup, so every email can greet people by it.
-- Nullable: the signups from before this change have no name, and their emails
-- fall back to "Hi there,". The form and api/signup.ts require it for new ones.
--
-- APPLY THIS BEFORE THE CODE SHIPS. api/signup.ts inserts first_name and the
-- senders select it; against a table without the column, every signup fails.
--
-- The limit lives here as well as in api/signup.ts, because the policy
-- "Anyone can join waitlist" lets the anon key insert rows directly.
-- Mirrors validateFirstName in api/_greeting.ts. No policy changes.

alter table public.waitlist add column first_name text;

alter table public.waitlist
  add constraint waitlist_first_name_check
  check (
    first_name is null
    or (char_length(btrim(first_name)) between 1 and 50
        and first_name !~ '[[:cntrl:]<>]')
  );

-- Rollback:
-- alter table public.waitlist drop constraint waitlist_first_name_check;
-- alter table public.waitlist drop column first_name;
