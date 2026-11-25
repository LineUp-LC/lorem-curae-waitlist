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

    // Claim the slot and record the opt-in in ONE locked database step
    // (accept_text_offer, migration 20261124202256_text_offer_accept.sql). It
    // decrements slots_remaining inside the database, so a spot freed by a
    // removal meanwhile is never lost, and it re-checks Removed and
    // unsubscribed under the row lock, so an accept can never write
    // text_opt_in or a phone number onto someone who opted out after the
    // checks above. Anything but 'accepted' writes nothing.
    const { data: outcome, error: acceptErr } = await supabase.rpc('accept_text_offer', {
      p_waitlist_id: row.id,
      p_phone: trimmedPhone,
    });
    if (acceptErr) {
      console.error(JSON.stringify({ level: 'error', event: 'text_offer_accept_failed', error: acceptErr.message }));
      return res.status(500).json({ error: 'server-error' });
    }
    switch (outcome) {
      case 'accepted':
        return res.status(200).json({ success: true });
      case 'not_found':
      case 'not_contactable':
        return res.status(404).json({ error: 'not-found' });
      case 'already_opted_in':
        return res.status(409).json({ error: 'already-opted-in' });
      case 'no_offer':
        return res.status(400).json({ error: 'no-offer-active' });
      case 'expired':
        return res.status(410).json({ error: 'offer-expired' });
      case 'no_slots':
        return res.status(409).json({ error: 'no-slots-remaining' });
      default:
        // outreach_unreadable, or an answer this code does not know.
        console.error(JSON.stringify({ level: 'error', event: 'text_offer_accept_refused', outcome }));
        return res.status(500).json({ error: 'server-error' });
    }
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
