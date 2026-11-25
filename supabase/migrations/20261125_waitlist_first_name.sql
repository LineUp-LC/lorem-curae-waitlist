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
-- No policy changes.
--
-- SYNC PAIR with validateFirstName in api/_greeting.ts. The server stores the
-- name trimmed (JavaScript trim), so this checks the STORED value:
--   - 1 to 50 characters (char_length counts code points, as the server does);
--   - none of U+0001-001F, U+007F-009F, < or > (the server's exact set; written
--     as code points, not [[:cntrl:]], whose meaning depends on the locale);
--   - no leading or trailing whitespace from JavaScript trim's list (the
--     control characters in that list are already refused above), so a
--     whitespace-only name is refused too.
-- Written and checked case by case against the server (22 cases, Nov 24 2026).

alter table public.waitlist add column first_name text;

alter table public.waitlist
  add constraint waitlist_first_name_check
  check (
    first_name is null
    or (char_length(first_name) between 1 and 50
        and first_name !~ '[\x01-\x1F\x7F-\x9F<>]'
        and first_name !~ '^[    -     　﻿]'
        and first_name !~ '[    -     　﻿]$')
  );

-- Rollback:
-- alter table public.waitlist drop constraint waitlist_first_name_check;
-- alter table public.waitlist drop column first_name;
