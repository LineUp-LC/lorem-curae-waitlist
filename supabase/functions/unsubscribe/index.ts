// ============================================================================
// UNSUBSCRIBE: Supabase Edge Function
// ============================================================================
// The unsubscribe link in every Curae email points here:
//   GET  /functions/v1/unsubscribe?token=<unsubscribe_token>
//
// GET CHANGES NOTHING (#26, decision 2a). Mail scanners and link previewers open
// links by themselves, so a GET only redirects to the confirmation page on the
// website (/unsubscribe?token=...). That page's "Yes, unsubscribe me" button
// sends:
//   POST /functions/v1/unsubscribe?token=<unsubscribe_token>
// and only the POST checks the token, sets unsubscribed_at and marks the person
// Removed. A POST with the token in the URL is also what a mail client's
// one-click unsubscribe (RFC 8058) sends, if List-Unsubscribe headers are added
// later.
//
// The page lives on the website because this function's default supabase.co
// domain serves HTML as plain text (checked live: the old HTML page arrived as
// text/plain), so a button here would show as raw markup.
//
// POST answers JSON: { result: 'unsubscribed' | 'already_unsubscribed' } or
// { error }.
// ============================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const CONFIRM_PAGE = 'https://lorem-curae-waitlist.vercel.app/unsubscribe';

// The confirmation page is served from these origins.
const ALLOWED_ORIGINS = new Set([
  'https://lorem-curae-waitlist.vercel.app',
  'https://loremcurae.com',
  'https://www.loremcurae.com',
]);

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function corsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get('origin') ?? '';
  // Vary on every response, so a cache never serves one origin's answer to another.
  if (!ALLOWED_ORIGINS.has(origin)) return { Vary: 'Origin' };
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'content-type',
    Vary: 'Origin',
  };
}

function json(req: Request, body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders(req) },
  });
}

// Token from the URL first (the page and RFC 8058 both put it there), then a
// JSON or form body.
async function readToken(req: Request): Promise<string> {
  const fromUrl = new URL(req.url).searchParams.get('token');
  if (fromUrl) return fromUrl.trim();
  const type = req.headers.get('content-type') ?? '';
  try {
    if (type.includes('application/json')) {
      const body = await req.json();
      return typeof body?.token === 'string' ? body.token.trim() : '';
    }
    if (type.includes('application/x-www-form-urlencoded') || type.includes('multipart/form-data')) {
      const form = await req.formData();
      const t = form.get('token');
      return typeof t === 'string' ? t.trim() : '';
    }
  } catch {
    return '';
  }
  return '';
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

// Finishes a half-done unsubscribe: Removed only when the outreach row is not
// already Removed AND an admin has never undone Removed for this person.
// deno-lint-ignore no-explicit-any
async function repairRemovedIfNeverUndone(supabase: any, waitlistId: string): Promise<void> {
  const { data: row, error } = await supabase
    .from('waitlist_outreach')
    .select('outreach_status, removed_cleared_at')
    .eq('waitlist_id', waitlistId)
    .maybeSingle();
  if (error) {
    console.error(JSON.stringify({ level: 'error', event: 'outreach_read_failed', userId: waitlistId, error: error.message }));
    return;
  }
  if (row && (row.outreach_status === 'removed' || row.removed_cleared_at)) return;
  await markRemoved(supabase, waitlistId);
}

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
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders(req) });
  }

  // GET changes nothing: send the person to the confirmation page.
  if (req.method === 'GET') {
    const token = new URL(req.url).searchParams.get('token') ?? '';
    const target = UUID_RE.test(token)
      ? `${CONFIRM_PAGE}?token=${encodeURIComponent(token)}`
      : CONFIRM_PAGE;
    return new Response(null, { status: 302, headers: { Location: target } });
  }

  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  const token = await readToken(req);
  if (!UUID_RE.test(token)) {
    return json(req, { error: 'invalid_link' }, 400);
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

  if (!supabaseUrl || !serviceRoleKey) {
    console.error(JSON.stringify({ level: 'error', event: 'missing_env', fn: 'unsubscribe' }));
    return json(req, { error: 'server_error' }, 500);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Token check.
  // deno-lint-ignore no-explicit-any
  const { data, error } = await (supabase as any)
    .from('waitlist')
    .select('id, unsubscribed_at')
    .eq('unsubscribe_token', token)
    .maybeSingle();

  if (error) {
    console.error(JSON.stringify({ level: 'error', event: 'token_lookup_failed', error: error.message }));
    return json(req, { error: 'server_error' }, 500);
  }

  if (!data) {
    return json(req, { error: 'invalid_link' }, 404);
  }

  if (data.unsubscribed_at) {
    // REPAIR, NEVER REVERSE (#26). If an earlier unsubscribe recorded the
    // opt-out but its Removed step failed, finish it now. But if an admin has
    // ever undone Removed (removed_cleared_at set), leave it: a second confirm
    // on an old link must not reverse that decision (2a).
    await repairRemovedIfNeverUndone(supabase, data.id);
    return json(req, { result: 'already_unsubscribed' });
  }

  // Mark unsubscribed. Conditional, so a double submit cannot move the date.
  // deno-lint-ignore no-explicit-any
  const { data: marked, error: updateError } = await (supabase as any)
    .from('waitlist')
    .update({ unsubscribed_at: new Date().toISOString() })
    .eq('id', data.id)
    .is('unsubscribed_at', null)
    .select('id');

  if (updateError) {
    console.error(JSON.stringify({ level: 'error', event: 'unsubscribe_update_failed', error: updateError.message }));
    return json(req, { error: 'server_error' }, 500);
  }
  if (!marked || marked.length === 0) {
    // Another request got there first.
    return json(req, { result: 'already_unsubscribed' });
  }

  console.log(JSON.stringify({ level: 'info', event: 'unsubscribed', userId: data.id }));

  // The opt-out is already recorded in unsubscribed_at, which every send checks,
  // so a failure here is logged and never turns the answer into an error.
  await markRemoved(supabase, data.id);

  return json(req, { result: 'unsubscribed' });
});

// deno-lint-ignore no-explicit-any
declare const Deno: any;
