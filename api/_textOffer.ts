import type { SupabaseClient } from '@supabase/supabase-js';

// ----------------------------------------------------------------------------
// Passing the text-offer spot to the next person. Moved here from
// api/text-opt-in.ts so the admin "move to Removed" action can use it too
// (decision 5a, tracked in #26).
//
// The next person is picked AND stamped by claim_next_text_offer (migration
// 20261124_add_waitlist_outreach.sql), which also leaves Removed people out.
// The unsubscribe edge function calls the same database function.
// ----------------------------------------------------------------------------

const FROM_EMAIL = 'Curae <hello@loremcurae.com>';
const CLAIM_URL = 'https://lorem-curae-waitlist.vercel.app/member';

// Moved VERBATIM from api/text-opt-in.ts. Known problem, deliberately not
// changed in this move: the six comment lines below sit inside the template
// string, so they are sent in the email. Reported for its own fix.
function textOptInOfferHtml(): string {
  return `<p>Hi there,</p>
// THE 100 BELOW IS THE TEXT POOL, NOT THE FOUNDING CAP. They are unrelated and
// coincidentally equal since 2026-09-18, when the founding cap moved 1000 -> 100.
// This one is text_opt_in_config.slots_remaining: a mutable counter, decremented on
// accept, that cascades to the next person when someone declines. The founding cap is
// MAX_FOUNDING_MEMBERS (src/lib/foundingMembers.ts) and the founding_member_slots view.
// Do not merge them, and do not replace either number with the other constant.
<p>You're one of our first 100 founding members on Curae.</p>
<p>I personally text the first 100 — it's the fastest way to tell me what's working, what isn't, and what you want built next.</p>
<p><strong><a href="${CLAIM_URL}">Claim your spot</a></strong></p>
<p>This offer expires in 48 hours. If you'd rather not, no worries — just ignore this email.</p>
<p>— Ethan Jones<br/>Founder, Curae</p>`;
}

// Finds the next eligible person after the given created_at and sends them the
// text opt-in offer. No-op if nobody is eligible. Never throws: a failed pass-on
// is logged and reported, and never fails the action that caused it.
//
// Cascade intentionally has no upper position bound. The accept flow checks
// slots_remaining > 0, so at most 100 people can ever accept regardless of how
// far the cascade travels.
export async function passOnTextOffer(
  supabase: SupabaseClient,
  resendApiKey: string,
  afterCreatedAt: string,
): Promise<{ offered: boolean; error?: string }> {
  const { data, error } = await supabase.rpc('claim_next_text_offer', { p_after: afterCreatedAt });
  if (error) {
    console.error(JSON.stringify({ level: 'error', event: 'text_offer_claim_failed', error: error.message }));
    return { offered: false, error: 'Could not pick the next person for the text offer' };
  }

  const next = (Array.isArray(data) ? data[0] : data) as { email?: string } | null | undefined;
  if (!next?.email) return { offered: false };

  try {
    const emailRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: next.email,
        subject: "A personal note from Ethan — you're in the first 100",
        html: textOptInOfferHtml(),
      }),
    });
    if (!emailRes.ok) {
      console.error('[text-offer] Cascade email failed:', await emailRes.text());
      return { offered: false, error: 'The next person was picked but the offer email failed' };
    }
  } catch (err) {
    console.error('[text-offer] Cascade email threw:', err);
    return { offered: false, error: 'The next person was picked but the offer email failed' };
  }
  return { offered: true };
}
