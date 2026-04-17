import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const FROM_EMAIL = 'Curae <hello@loremcurae.com>';
const CLAIM_URL = 'https://lorem-curae-waitlist.vercel.app/member';

function textOptInOfferHtml(): string {
  return `<p>Hi there,</p>
<p>You're one of our first 1,000 founding members on Curae.</p>
<p>I personally text the first 1,000 — it's the fastest way to tell me what's working, what isn't, and what you want built next.</p>
<p><strong><a href="${CLAIM_URL}">Claim your spot</a></strong></p>
<p>This offer expires in 48 hours. If you'd rather not, no worries — just ignore this email.</p>
<p>— Ethan Jones<br/>Founder, Curae</p>`;
}

// Finds the next eligible user after the given created_at timestamp and sends
// them the text opt-in offer email. No-op if no eligible user is found.
//
// Cascade intentionally has no upper position bound. The accept flow checks
// slots_remaining > 0, so at most 100 users can ever accept regardless of
// how far the cascade travels. Users beyond position 100 can only accept
// if a prior user declined (their slot is available).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function sendCascadeOffer(
  supabase: any,
  resendApiKey: string,
  afterCreatedAt: string
): Promise<void> {
  const { data: nextUser } = await supabase
    .from('waitlist')
    .select('id, email')
    .gt('created_at', afterCreatedAt)
    .eq('text_opt_in', false)
    .eq('text_opt_in_declined', false)
    .is('unsubscribed_at', null)
    .is('text_opt_in_offer_sent_at', null)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!nextUser || !nextUser.email) return;

  const now = new Date();
  const expiresAt = new Date(now.getTime() + 48 * 60 * 60 * 1000);

  await supabase
    .from('waitlist')
    .update({
      text_opt_in_offer_sent_at: now.toISOString(),
      text_opt_in_expires_at: expiresAt.toISOString(),
    })
    .eq('id', nextUser.id);

  const emailRes = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: FROM_EMAIL,
      to: nextUser.email as string,
      subject: "A personal note from Ethan — you're in the first 1,000",
      html: textOptInOfferHtml(),
    }),
  });

  if (!emailRes.ok) {
    console.error('[text-opt-in] Cascade email failed:', await emailRes.text());
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const resendApiKey = process.env.RESEND_API_KEY;

  if (!supabaseUrl || !serviceRoleKey || !resendApiKey) {
    return res.status(500).json({ error: 'Server misconfiguration' });
  }

  const { email, phone_number, action } = req.body || {};

  if (!email || typeof email !== 'string') {
    return res.status(400).json({ error: 'email is required' });
  }
  if (action !== 'accept' && action !== 'decline') {
    return res.status(400).json({ error: 'action must be "accept" or "decline"' });
  }

  const trimmedEmail = email.trim().toLowerCase();

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: row, error: rowErr } = await supabase
    .from('waitlist')
    .select('id, email, created_at, text_opt_in, text_opt_in_declined, text_opt_in_offer_sent_at, text_opt_in_expires_at')
    .eq('email', trimmedEmail)
    .maybeSingle();

  if (rowErr || !row) {
    return res.status(404).json({ error: 'not-found' });
  }

  if (row.text_opt_in) {
    return res.status(409).json({ error: 'already-opted-in' });
  }

  if (action === 'accept') {
    if (!row.text_opt_in_offer_sent_at) {
      return res.status(400).json({ error: 'no-offer-active' });
    }

    const expiresAt = row.text_opt_in_expires_at ? new Date(row.text_opt_in_expires_at as string) : null;
    if (!expiresAt || expiresAt < new Date()) {
      // Offer expired — treat as decline and cascade
      await supabase
        .from('waitlist')
        .update({ text_opt_in_declined: true })
        .eq('id', row.id);
      await sendCascadeOffer(supabase, resendApiKey, row.created_at as string);
      return res.status(410).json({ error: 'offer-expired' });
    }

    const trimmedPhone = typeof phone_number === 'string' ? phone_number.trim() : '';
    if (!trimmedPhone) {
      return res.status(400).json({ error: 'phone_number is required' });
    }
    // Validate phone: digits, spaces, hyphens, parentheses, plus sign — 7 to 20 chars
    if (!/^[\d\s\-()+.]{7,20}$/.test(trimmedPhone)) {
      return res.status(400).json({ error: 'invalid phone number format' });
    }

    // Read current slot count
    const { data: config } = await supabase
      .from('text_opt_in_config')
      .select('id, slots_remaining')
      .single();

    if (!config || (config.slots_remaining as number) <= 0) {
      return res.status(409).json({ error: 'no-slots-remaining' });
    }

    // Decrement first with a WHERE guard so a concurrent race to the last slot
    // cannot push slots_remaining below 0. The .gt() filter is evaluated at
    // update time in Postgres — if another request already claimed the slot,
    // this update affects 0 rows and we reject the second claimer.
    const { data: decremented } = await supabase
      .from('text_opt_in_config')
      .update({ slots_remaining: (config.slots_remaining as number) - 1 })
      .eq('id', config.id)
      .gt('slots_remaining', 0)
      .select('id')
      .maybeSingle();

    if (!decremented) {
      return res.status(409).json({ error: 'no-slots-remaining' });
    }

    // Slot claimed — record the opt-in
    await supabase
      .from('waitlist')
      .update({ text_opt_in: true, phone_number: trimmedPhone })
      .eq('id', row.id);

    return res.status(200).json({ success: true });
  }

  // action === 'decline'
  // Decline passes the slot to the next person via cascade — slots_remaining
  // is NOT decremented here because the slot was never consumed.
  await supabase
    .from('waitlist')
    .update({ text_opt_in_declined: true })
    .eq('id', row.id);

  await sendCascadeOffer(supabase, resendApiKey, row.created_at as string);

  return res.status(200).json({ success: true });
}
