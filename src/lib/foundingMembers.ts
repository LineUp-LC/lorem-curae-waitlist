// The founding-member cap. ONE definition, because there were two.
//
// Before 2026-09-18 this number lived as a local `MAX_FOUNDING_MEMBERS` in BOTH
// `api/signup.ts` (1000, and enforcing) and `api/admin.ts` (50, and dead -- declared,
// never read), while `admin/waitlist-analytics` and `admin/user/EditUserPanel` each
// hardcoded "1,000" in a display string and `pages/member` said "first 100". Four
// numbers for one cap. Two constants with the same name and different values is how
// that happens, so there is now one, and the surfaces that DISPLAY the cap import the
// same value the signup path ENFORCES -- a displayed cap cannot drift from the
// enforced one if it is the enforced one.
//
// NOT THE SAME 100 as the text-opt-in pool. `text_opt_in_config.slots_remaining` is a
// separate, mutable counter for the personal-text offer, and it happens to also be 100
// today. They are unrelated pools and must not be merged. See the comments at
// `api/text-opt-in.ts`, `api/signup.ts` and `pages/member/page.tsx`.
//
// THE DATABASE HOLDS THIS NUMBER TOO, and that is the copy the public counter reads:
// the `founding_member_slots` view hardcodes it three times (migration
// 20260918_founding_slots_cap_100.sql). A view cannot import a TypeScript constant, so
// these two are a SYNC PAIR -- change one and change the other in the same commit.
export const MAX_FOUNDING_MEMBERS = 100;

// The creator pool is SEPARATE from the general pool and is counted against its own
// column (`is_founding_member_creator`). It is not a subset of MAX_FOUNDING_MEMBERS.
//
// It had the same defect its sibling had: api/signup.ts ENFORCED 25 while the admin
// page DISPLAYED 20, so the dashboard reported a cap the signup path did not use.
// Founder decision 2026-09-18: 25 is the number, and the display follows the
// enforcement rather than the other way round -- nobody had been turned away at 20,
// so no signup outcome changes, only what the admin page claims.
export const MAX_FOUNDING_MEMBER_CREATORS = 25;
