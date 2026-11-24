import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { passOnTextOffer } from './_textOffer.js';
import { checkSendable } from './_outreach.js';

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
    .select('id, email, created_at, unsubscribed_at, text_opt_in, text_opt_in_declined, text_opt_in_offer_sent_at, text_opt_in_expires_at')
    .eq('email', trimmedEmail)
    .maybeSingle();

  if (rowErr || !row) {
    return res.status(404).json({ error: 'not-found' });
  }

  // A Removed or unsubscribed person is out of every text send (#26). Answer as
  // if there were no record, so the response reveals nothing. A failed read
  // does not let them through.
  const contact = await checkSendable(supabase, {
    id: row.id as string,
    unsubscribed_at: row.unsubscribed_at as string | null,
  });
  if (!contact.sendable && contact.reason === 'read_failed') {
    return res.status(500).json({ error: 'server-error' });
  }
  if (!contact.sendable) {
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
      await passOnTextOffer(supabase, resendApiKey, row.created_at as string);
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

  await passOnTextOffer(supabase, resendApiKey, row.created_at as string);

  return res.status(200).json({ success: true });
}
