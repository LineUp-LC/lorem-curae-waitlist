// ============================================================================
// UNSUBSCRIBE — Supabase Edge Function
// ============================================================================
// Handles one-click unsubscribe links embedded in all Curae emails.
// Accepts GET /functions/v1/unsubscribe?token=<unsubscribe_token>
//
// The token is the unsubscribe_token UUID stored on the waitlist row.
// On success, sets unsubscribed_at = now() on the matching row.
//
// Returns a minimal HTML page — no branding, no navigation, no redirect.
// ============================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

// ----------------------------------------------------------------------------
// HTML HELPERS
// ----------------------------------------------------------------------------

function htmlPage(message: string): Response {
  const body = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Unsubscribe</title>
</head>
<body style="font-family:sans-serif;display:flex;justify-content:center;align-items:center;min-height:100vh;margin:0;background:#fff;">
  <p style="font-size:16px;color:#333;text-align:center;max-width:400px;padding:0 16px;">${message}</p>
</body>
</html>`;

  return new Response(body, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}

function htmlError(message: string, status: number): Response {
  const body = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Unsubscribe</title>
</head>
<body style="font-family:sans-serif;display:flex;justify-content:center;align-items:center;min-height:100vh;margin:0;background:#fff;">
  <p style="font-size:16px;color:#333;text-align:center;max-width:400px;padding:0 16px;">${message}</p>
</body>
</html>`;

  return new Response(body, {
    status,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}

// ----------------------------------------------------------------------------
// REMOVED ON UNSUBSCRIBE (#26, decision 6a)
// ----------------------------------------------------------------------------
// Unsubscribing also marks the signup Removed through mark_waitlist_removed
// (migration 20261124_add_waitlist_outreach.sql), which clears the phone number
// and text opt-in and gives back a held text spot (decision 5a). If a spot or an
// open offer was freed, it is passed to the next person: claim_next_text_offer
// picks and stamps them (the same database function api/_textOffer.ts uses),
// and the offer email is sent here.
//
// The offer HTML below is the one api/signup.ts sends (signup.ts:247-252), not
// the copy in api/_textOffer.ts, which carries a known problem (comment lines
// inside the email). SYNC PAIR with signup.ts until that is fixed.

const FROM_EMAIL = 'Curae <hello@loremcurae.com>';
const TEXT_OFFER_CLAIM_URL = 'https://lorem-curae-waitlist.vercel.app/member';
const TEXT_OFFER_SUBJECT = "A personal note from Ethan — you're in the first 100";
const TEXT_OFFER_HTML = `<p>Hi there,</p>
<p>You're one of our first 100 founding members on Curae.</p>
<p>I personally text the first 100 — it's the fastest way to tell me what's working, what isn't, and what you want built next.</p>
<p><strong><a href="${TEXT_OFFER_CLAIM_URL}">Claim your spot</a></strong></p>
<p>This offer expires in 48 hours. If you'd rather not, no worries — just ignore this email.</p>
<p>— Ethan Jones<br/>Founder, Curae</p>`;

// deno-lint-ignore no-explicit-any
async function markRemoved(supabase: any, waitlistId: string): Promise<void> {
  const { data: marked, error: markErr } = await supabase.rpc('mark_waitlist_removed', {
    p_waitlist_id: waitlistId,
  });
  if (markErr) {
    console.error(JSON.stringify({ level: 'error', event: 'mark_removed_failed', userId: waitlistId, error: markErr.message }));
    return;
  }

  const row = Array.isArray(marked) ? marked[0] : marked;
  const passOnAfter: string | null = row?.pass_on_after ?? null;
  if (!passOnAfter) return;

  // Check the key BEFORE claiming: a claim stamps the next person's offer, and
  // a stamped offer with no email would strand them.
  const resendApiKey = Deno.env.get('RESEND_API_KEY') ?? '';
  if (!resendApiKey) {
    console.error(JSON.stringify({ level: 'error', event: 'text_offer_pass_on_skipped', reason: 'missing RESEND_API_KEY' }));
    return;
  }

  const { data: claimed, error: claimErr } = await supabase.rpc('claim_next_text_offer', { p_after: passOnAfter });
  if (claimErr) {
    console.error(JSON.stringify({ level: 'error', event: 'text_offer_claim_failed', error: claimErr.message }));
    return;
  }
  const next = Array.isArray(claimed) ? claimed[0] : claimed;
  if (!next?.email) return;

  // Bounded: the unsubscribe page waits on this, and a slow email service must
  // not hang it. An abort is logged like any other failed send.
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${resendApiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: FROM_EMAIL, to: next.email, subject: TEXT_OFFER_SUBJECT, html: TEXT_OFFER_HTML }),
      signal: controller.signal,
    });
    if (!res.ok) {
      console.error(JSON.stringify({ level: 'error', event: 'text_offer_email_failed', status: res.status }));
    }
  } catch (err) {
    console.error(JSON.stringify({ level: 'error', event: 'text_offer_email_failed', error: (err as Error).message }));
  } finally {
    clearTimeout(timer);
  }
}

// ----------------------------------------------------------------------------
// HANDLER
// ----------------------------------------------------------------------------

serve(async (req: Request) => {
  if (req.method !== 'GET') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  const url = new URL(req.url);
  const token = url.searchParams.get('token');

  if (!token) {
    return htmlError('This unsubscribe link is invalid.', 400);
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

  if (!supabaseUrl || !serviceRoleKey) {
    console.error(JSON.stringify({ level: 'error', event: 'missing_env', fn: 'unsubscribe' }));
    return htmlError('Something went wrong. Please try again later.', 500);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Look up the token.
  // deno-lint-ignore no-explicit-any
  const { data, error } = await (supabase as any)
    .from('waitlist')
    .select('id, unsubscribed_at')
    .eq('unsubscribe_token', token)
    .maybeSingle();

  if (error) {
    console.error(JSON.stringify({ level: 'error', event: 'token_lookup_failed', error: error.message }));
    return htmlError('Something went wrong. Please try again later.', 500);
  }

  if (!data) {
    return htmlError('This unsubscribe link is invalid.', 404);
  }

  if (data.unsubscribed_at) {
    // Deliberately NOT re-marked Removed here (#26). An admin may have undone
    // Removed on purpose (decision 2a); a second click on an old link must not
    // silently reverse that. Earlier unsubscribes are made Removed by the
    // migration backfill, and every send still checks unsubscribed_at.
    return htmlPage("You&#8217;re already unsubscribed.");
  }

  // Mark unsubscribed.
  // deno-lint-ignore no-explicit-any
  const { error: updateError } = await (supabase as any)
    .from('waitlist')
    .update({ unsubscribed_at: new Date().toISOString() })
    .eq('id', data.id);

  if (updateError) {
    console.error(JSON.stringify({ level: 'error', event: 'unsubscribe_update_failed', error: updateError.message }));
    return htmlError('Something went wrong. Please try again later.', 500);
  }

  console.log(JSON.stringify({ level: 'info', event: 'unsubscribed', userId: data.id }));

  // The opt-out is already recorded in unsubscribed_at, which every send checks,
  // so a failure here is logged and never turns the page into an error.
  await markRemoved(supabase, data.id);

  return htmlPage("You&#8217;ve been unsubscribed. You won&#8217;t hear from us again.");
});

// deno-lint-ignore no-explicit-any
declare const Deno: any;
