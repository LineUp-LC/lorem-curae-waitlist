import type { SupabaseClient } from '@supabase/supabase-js';
import { sendTextOfferEmail } from '../supabase/functions/_shared/textOfferEmail.js';

// ----------------------------------------------------------------------------
// Passing the text-offer spot to the next person. Moved here from
// api/text-opt-in.ts so the admin "move to Removed" action can use it too
// (decision 5a, tracked in #26).
//
// The next person is picked AND stamped by claim_next_text_offer (migration
// 20261124_add_waitlist_outreach.sql), which also leaves Removed people out.
// The unsubscribe edge function calls the same database function.
// ----------------------------------------------------------------------------

// The email itself (sender, subject, body, timeout) has one copy, shared with
// the unsubscribe edge function: supabase/functions/_shared/textOfferEmail.ts.

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

  const sent = await sendTextOfferEmail(resendApiKey, next.email);
  if (!sent.ok) {
    console.error('[text-offer] Cascade email failed:', sent.status ?? '', sent.error);
    return { offered: false, error: 'The next person was picked but the offer email failed' };
  }
  return { offered: true };
}
