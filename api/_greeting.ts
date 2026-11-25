// ----------------------------------------------------------------------------
// THE GREETING AND THE FIRST-NAME CHECK (waitlist #40), for the Vercel runtime.
//
// Every email opens with greetingHtml(first_name): "Hi Maya," when a name is
// saved, "Hi there," when it is not (people who signed up before names were
// asked for). Templates carry a {{GREETING}} placeholder inside their opening
// <p>, and each sender fills it from this one function.
//
// SYNC PAIR with supabase/functions/_shared/greeting.ts (Deno cannot import
// this file). The greeting logic in both must stay identical.
//
// validateFirstName is the one check for a typed first name: api/signup.ts and
// the admin edit both use it. The signup form checks only for a blank (browser
// code does not import from api/) and shows this check's message when the server
// refuses, so FIRST_NAME_ERRORS.blank is a SYNC PAIR with FIRST_NAME_BLANK_ERROR
// in src/components/SupabaseWaitlistForm.tsx. It mirrors the waitlist_first_name_check constraint in
// supabase/migrations/20261125_waitlist_first_name.sql (1 to 50 characters
// after trimming, none of U+0000-001F, U+007F-009F, < or >). Change both or
// neither: the constraint spells out the same character set and trim list.
// ----------------------------------------------------------------------------

export const GREETING_FALLBACK = 'Hi there,';

export const FIRST_NAME_MAX = 50;

export const FIRST_NAME_ERRORS = {
  blank: 'Please enter your first name.',
  tooLong: `Please enter a first name of ${FIRST_NAME_MAX} characters or fewer.`,
  badCharacters: 'Please remove any < or > from your first name.',
} as const;

// Control characters (C0, DEL, C1), and the two angle brackets.
const FIRST_NAME_BAD_CHARS = /[\u0000-\u001F\u007F-\u009F<>]/;

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// The opening line of an HTML email. Anything that is not a non-empty string
// after trimming (null, undefined, a number, blank) gets the fallback.
export function greetingHtml(firstName: unknown): string {
  const name = typeof firstName === 'string' ? firstName.trim() : '';
  if (name === '') return GREETING_FALLBACK;
  return `Hi ${escapeHtml(name)},`;
}

export type FirstNameCheck =
  | { ok: true; value: string }
  | { ok: false; error: string };

// Length counts characters the way Postgres char_length does (code points), so
// a name the database would accept is never refused here, or the reverse.
export function validateFirstName(raw: unknown): FirstNameCheck {
  const value = typeof raw === 'string' ? raw.trim() : '';
  if (value === '') return { ok: false, error: FIRST_NAME_ERRORS.blank };
  if ([...value].length > FIRST_NAME_MAX) return { ok: false, error: FIRST_NAME_ERRORS.tooLong };
  if (FIRST_NAME_BAD_CHARS.test(value)) return { ok: false, error: FIRST_NAME_ERRORS.badCharacters };
  return { ok: true, value };
}
