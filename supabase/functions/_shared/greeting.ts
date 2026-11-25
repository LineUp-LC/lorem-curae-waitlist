// ----------------------------------------------------------------------------
// THE GREETING (waitlist #40), for Edge Functions (Deno).
//
// Every email opens with greetingHtml(first_name): "Hi Maya," when a name is
// saved, "Hi there," when it is not. Templates carry a {{GREETING}} placeholder
// inside their opening <p>.
//
// SYNC PAIR with api/_greeting.ts (the Vercel copy). The greeting logic in both
// must stay identical. The first-name CHECK lives only in the Vercel copy,
// because nothing in an Edge Function takes a typed name.
//
// Imports nothing, so the Node side can load it too if it ever needs to.
// ----------------------------------------------------------------------------

export const GREETING_FALLBACK = 'Hi there,';

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
