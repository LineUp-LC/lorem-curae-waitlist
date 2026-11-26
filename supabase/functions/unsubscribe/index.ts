// ============================================================================
// UNSUBSCRIBE: Supabase Edge Function
// ============================================================================
// The unsubscribe link in every Curae email points here:
//   GET  /functions/v1/unsubscribe?token=<unsubscribe_token>
//
// GET CHANGES NOTHING (#26, decision 2a). Mail scanners and link previewers open
// links by themselves, so a GET only redirects to the confirmation page on the
// website (https://loremcurae.com/unsubscribe?token=...). That page reads the
// token, removes it from its address bar at once, and its "Yes, unsubscribe me"
// button sends:
//   POST /functions/v1/unsubscribe   body { "token": "<unsubscribe_token>" }
// with the token in the BODY, not the URL (waitlist issue 33 item 1). Only the
// POST checks the token, sets unsubscribed_at and marks the person Removed.
// A POST with ?token= in the URL is still accepted, for a page already open in
// someone's browser from before this change and for a mail client's one-click
// unsubscribe (RFC 8058), if List-Unsubscribe headers are added later. The GET
// link format in emails already sent is unchanged.
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
import { sendTextOfferEmail } from '../_shared/textOfferEmail.ts';
import { TEXT_OFFERS_ENABLED } from '../_shared/textOffers.ts';
import { greetingHtml } from '../_shared/greeting.ts';

// The real domain (choice A1, Ethan 2026-11-24).
const CONFIRM_PAGE = 'https://loremcurae.com/unsubscribe';

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

// Token from a JSON or form body first (the page sends it there, waitlist issue
// 33 item 1), then the old ?token= in the URL (an already-open older page, and
// RFC 8058 one-click).
async function readToken(req: Request): Promise<string> {
  const type = req.headers.get('content-type') ?? '';
  let fromBody = '';
  try {
    if (type.includes('application/json')) {
      const body = await req.json();
      fromBody = typeof body?.token === 'string' ? body.token.trim() : '';
    } else if (type.includes('application/x-www-form-urlencoded') || type.includes('multipart/form-data')) {
      const form = await req.formData();
      const t = form.get('token');
      fromBody = typeof t === 'string' ? t.trim() : '';
    }
  } catch {
    fromBody = '';
  }
  if (fromBody) return fromBody;
  return (new URL(req.url).searchParams.get('token') ?? '').trim();
}

// ----------------------------------------------------------------------------
// REMOVED ON UNSUBSCRIBE (#26, decision 6a)
// ----------------------------------------------------------------------------
// Unsubscribing also marks the signup Removed through mark_waitlist_removed
// (migration 20261124194749_add_waitlist_outreach.sql), which clears the phone number
// and text opt-in and gives back a held text spot (decision 5a). If a spot or an
// open offer was freed, it is passed to the next person: claim_next_text_offer
// picks and stamps them (the same database function api/_textOffer.ts uses),
// and the offer email is sent here.
//
// The offer email (sender, subject, body, timeout) has ONE copy, shared with
// api/_textOffer.ts: ../_shared/textOfferEmail.ts.

// Finishes a half-done unsubscribe: Removed only when the outreach row is not
// already Removed AND an admin has never undone Removed for this person.
// deno-lint-ignore no-explicit-any
async function repairRemovedIfNeverUndone(supabase: any, waitlistId: string): Promise<boolean> {
  const { data: row, error } = await supabase
    .from('waitlist_outreach')
    .select('outreach_status, removed_cleared_at')
    .eq('waitlist_id', waitlistId)
    .maybeSingle();
  if (error) {
    console.error(JSON.stringify({ level: 'error', event: 'outreach_read_failed', userId: waitlistId, error: error.message }));
    return false;
  }
  if (row && (row.outreach_status === 'removed' || row.removed_cleared_at)) return true;
  return await markRemoved(supabase, waitlistId);
}

// Returns whether the Removed mark itself succeeded. A failed pass-on of a
// freed text spot after a successful mark is logged and still counts as true.
// deno-lint-ignore no-explicit-any
async function markRemoved(supabase: any, waitlistId: string): Promise<boolean> {
  const { data: marked, error: markErr } = await supabase.rpc('mark_waitlist_removed', {
    p_waitlist_id: waitlistId,
  });
  if (markErr) {
    console.error(JSON.stringify({ level: 'error', event: 'mark_removed_failed', userId: waitlistId, error: markErr.message }));
    return false;
  }

  const row = Array.isArray(marked) ? marked[0] : marked;
  const passOnAfter: string | null = row?.pass_on_after ?? null;
  if (!passOnAfter) return true;

  // Off behind TEXT_OFFERS_ENABLED (../_shared/textOffers.ts): the Removed
  // mark above still happens; the freed spot is passed to nobody.
  if (!TEXT_OFFERS_ENABLED) return true;

  // Check the key BEFORE claiming: a claim stamps the next person's offer, and
  // a stamped offer with no email would strand them.
  const resendApiKey = Deno.env.get('RESEND_API_KEY') ?? '';
  if (!resendApiKey) {
    console.error(JSON.stringify({ level: 'error', event: 'text_offer_pass_on_skipped', reason: 'missing RESEND_API_KEY' }));
    return true;
  }

  const { data: claimed, error: claimErr } = await supabase.rpc('claim_next_text_offer', { p_after: passOnAfter });
  if (claimErr) {
    console.error(JSON.stringify({ level: 'error', event: 'text_offer_claim_failed', error: claimErr.message }));
    return true;
  }
  const next = Array.isArray(claimed) ? claimed[0] : claimed;
  if (!next?.email) return true;

  // The greeting's first name (#40). claim_next_text_offer returns only the
  // email, so it is read here by email. A failed read still sends, with
  // "Hi there,": the claim already stamped this person's offer, and an unsent
  // offer would strand them. Logged without the name.
  const { data: nameRow, error: nameErr } = await supabase
    .from('waitlist')
    .select('first_name, unsubscribe_token')
    .eq('email', next.email)
    .maybeSingle();
  if (nameErr) {
    console.error(JSON.stringify({ level: 'error', event: 'text_offer_name_read_failed', error: nameErr.message }));
  }

  // Bounded (the shared send has the timeout): the unsubscribe page waits on
  // this. A timeout is logged like any other failed send.
  const sent = await sendTextOfferEmail(resendApiKey, next.email, greetingHtml(nameRow?.first_name), nameRow?.unsubscribe_token ?? null);
  if (!sent.ok) {
    console.error(JSON.stringify({ level: 'error', event: 'text_offer_email_failed', status: sent.status, error: sent.error }));
  }
  return true;
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
    // A failed repair is not reported as done: the page asks them to try again.
    if (!(await repairRemovedIfNeverUndone(supabase, data.id))) {
      console.error(JSON.stringify({ level: 'error', event: 'unsubscribe_remove_failed', userId: data.id, path: 'repair' }));
      return json(req, { error: 'server_error' }, 500);
    }
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

  // The opt-out is recorded in unsubscribed_at, but if the Removed step fails
  // the person still holds their phone number and text spot (decision 5a), so
  // the answer is an error and the page asks them to try again. A retry takes
  // the already-unsubscribed path above, which finishes the Removed step.
  if (!(await markRemoved(supabase, data.id))) {
    console.error(JSON.stringify({ level: 'error', event: 'unsubscribe_remove_failed', userId: data.id, path: 'first' }));
    return json(req, { error: 'server_error' }, 500);
  }

  return json(req, { result: 'unsubscribed' });
});

// deno-lint-ignore no-explicit-any
declare const Deno: any;
