// ============================================================================
// DRIP SCHEDULER — Supabase Edge Function
// ============================================================================
// Invoked daily by pg_cron (see migration 20260414_create_drip_send_log.sql).
// Queries waitlist for signups whose created_at falls exactly on day-3, -7,
// -14, or -30 cohorts (date-truncated to day), and sends the matching drip
// template. Idempotent via drip_send_log (unique on user_id + drip_event).
//
// Template copy mirrors src/lib/email/dripTemplates.ts. The app runs in
// Node/Vite; Edge Functions run in Deno. Rather than share a module across
// runtimes, copy is duplicated here — update both when editing drip copy.
// ============================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

// ----------------------------------------------------------------------------
// CONFIG
// ----------------------------------------------------------------------------

const FROM_EMAIL = 'Curae <hello@loremcurae.com>';
const REDIRECT_URL = 'https://lorem-curae-waitlist.vercel.app/auth/callback';
const UNSUBSCRIBE_BASE = 'https://fskvzrobcfokezumadbb.supabase.co/functions/v1/unsubscribe';
const UNSUBSCRIBE_URL_FALLBACK = 'mailto:hello@loremcurae.com?subject=Unsubscribe';

// DRIP EMAILS DO NOT CARRY A SIGN-IN LINK.
// auth.admin.generateLink CREATES the auth user when none exists, so generating one per
// recipient minted real accounts as a side effect of sending marketing email. A drip
// points at the public site. Only the waitlist app's type='login' path, where an account
// IS the intent, still generates a link.
const DRIP_CTA_URL = 'https://loremcurae.com';

type DripEventType =
  | 'welcome'
  | 'scan_walkthrough'
  | 'scan_deep_dive'
  | 're_engagement';

// ALL THREE TIME-BASED DRIPS ARE RETIRED (2026-09-18, founder decision).
//
// They toured features of an app nobody can access yet. Someone who signed up in
// April receiving a scanning walkthrough today, with no app to scan in, reads as a
// sequence running on autopilot, which is what it was.
//
// The waitlist sequence is now STATUS-CHANGE, not cadence: signup confirms position,
// and everything after it fires when something actually changes (tester selected,
// wave assigned, wave opened). Those live in src/lib/email/followupTemplates.ts, are
// event-driven, and are recorded in followup_send_log.
//
// re_engagement was retired with the other two rather than repurposed as a holding
// note. A holding note needs something to say, and every state that can change now
// has its own email, so it would have been no-news on a schedule. That is worse than
// silence.
//
// THE MAP IS EMPTIED RATHER THAN THE FUNCTION DELETED. The cohort query, the
// idempotency check and the unsubscribe guard are the working parts of any future
// scheduled send, and the pg_cron job now simply finds nothing to do. Re-add an entry
// here to bring one back. The templates below are kept for reference; nothing reads
// them while this map is empty.
const DAY_OFFSET_TO_EVENT: Record<number, DripEventType> = {};

// ----------------------------------------------------------------------------
// TEMPLATES (mirrors src/lib/email/dripTemplates.ts — keep in sync)
// ----------------------------------------------------------------------------

const FOOTER = `<p style="color:#888;font-size:12px;margin-top:32px;">Curae · <a href="{{UNSUBSCRIBE_URL}}" style="color:#888;">Unsubscribe</a> · <a href="https://loremcurae.com/privacy" style="color:#888;">Privacy</a></p>`;
const SIGN_OFF = `<p>— Ethan Jones<br/>Founder, Curae</p>`;

interface DripTemplate {
  subject: string;
  html: string;
}

const dripTemplates: Record<DripEventType, DripTemplate> = {
  welcome: {
    subject: "Here's how Curae works",
    html: `<p>Hi there,</p>
<p>Curae starts with a scan.</p>
<p>Point your camera at any product. We identify it, then read the ingredient list and check every ingredient against your skin profile. You get back an ingredient-by-ingredient breakdown, what we know about each one, and where to buy. Conflict detection and the compatible products list are included free. Premium adds the recommended action for resolving a conflict.</p>
<p>You set up your skin profile once, when you join. After that it is scan, read, decide.</p>
<p><strong><a href="${DRIP_CTA_URL}">See what we are building</a></strong></p>
${SIGN_OFF}
${FOOTER}`,
  },
  scan_walkthrough: {
    subject: 'What happens when you scan a product',
    html: `<p>Hi there,</p>
<p>Here's what a scan does:</p>
<p><strong>1. Identifies the product.</strong> Point the camera at the label or the barcode. If the label is hard to read, we ask you to confirm the name rather than guess it.</p>
<p><strong>2. Checks every ingredient against your skin profile.</strong> Each one is marked safe, caution or avoid, with the reason. Where we do not have research behind an ingredient yet, we say so instead of guessing. Fragrance you've flagged as a trigger? An ingredient that clashes with something already on your shelf? You see it free. Premium adds the recommended action for resolving it.</p>
<p><strong>3. Surfaces where to buy.</strong> Retailer options, so you can see who stocks it and at what price.</p>
<p>No guessing at INCI lists. No copying names into Google.</p>
<p><strong><a href="${DRIP_CTA_URL}">See what we are building</a></strong></p>
${SIGN_OFF}
${FOOTER}`,
  },
  scan_deep_dive: {
    subject: 'What a scan actually unlocks',
    html: `<p>Hi there,</p>
<p>A scan isn't just a verdict on one product. Here's what it opens up:</p>
<p><strong>Compatible products.</strong> Once we know what's in your current product, we can surface alternatives that actually fit — same function, ingredients your skin tolerates.</p>
<p><strong>Where to buy.</strong> You see who stocks it and at what price, in one place instead of five tabs.</p>
<p><strong>Ask Curae, which knows your skin profile and your shelf.</strong> Ask it whether a new product fits alongside what you already use. It answers in context, not generic advice.</p>
<p><strong>Your Shelf.</strong> Add any product you scan to your shelf, then check compatibility across your whole routine in one view.</p>
<p>Each one is something the scan opens up. No scan, no context — that's why the scan is the whole point.</p>
<p><strong><a href="${DRIP_CTA_URL}">See what we are building</a></strong></p>
${SIGN_OFF}
${FOOTER}`,
  },
  re_engagement: {
    subject: 'Still holding your spot',
    html: `<p>Hi there,</p>
<p>Your Curae spot is still held. You signed up to scan products and see which ingredients actually work for your skin — that's still what we're building.</p>
<p>If you'd like to stay on the list, no action needed. If you'd rather let your spot go, the unsubscribe link below does it in one click.</p>
<p><strong><a href="${DRIP_CTA_URL}">See what we are building</a></strong></p>
${SIGN_OFF}
${FOOTER}`,
  },
};

// ----------------------------------------------------------------------------
// HELPERS
// ----------------------------------------------------------------------------

interface SupabaseAdminClient {
  // deno-lint-ignore no-explicit-any
  from: (t: string) => any;
}

interface SignupRow {
  id: string;
  email: string;
  unsubscribed_at: string | null;
  unsubscribe_token: string;
}

async function fetchCohort(
  supabase: SupabaseAdminClient,
  dayOffset: number,
): Promise<SignupRow[]> {
  // Target range: created_at between (now - (offset+1) days) and (now - offset days)
  // Using date_trunc semantics via explicit UTC date boundaries.
  const now = new Date();
  const start = new Date(now);
  start.setUTCDate(start.getUTCDate() - dayOffset);
  start.setUTCHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);

  const { data, error } = await supabase
    .from('waitlist')
    .select('id, email, unsubscribed_at, unsubscribe_token')
    .gte('created_at', start.toISOString())
    .lt('created_at', end.toISOString());

  if (error) {
    throw new Error(`Failed to fetch day-${dayOffset} cohort: ${error.message || error}`);
  }
  return (data as SignupRow[]) ?? [];
}


async function fetchSlotsRemaining(
  supabase: SupabaseAdminClient,
): Promise<string> {
  // View `founding_member_slots` exposes column `slots_remaining` (integer).
  // Any failure (missing view, null result, network error) falls back to a
  // neutral phrase so a broken counter never blocks the email send.
  try {
    // deno-lint-ignore no-explicit-any
    const { data, error } = await (supabase as any)
      .from('founding_member_slots')
      .select('slots_remaining')
      .single();
    if (error || data?.slots_remaining == null) return 'A limited number of';
    return String(data.slots_remaining);
  } catch {
    return 'A limited number of';
  }
}

async function sendDripEmail(
  to: string,
  dripEvent: DripEventType,
  slotsRemaining: string,
  unsubscribeUrl: string,
  resendApiKey: string,
): Promise<void> {
  const template = dripTemplates[dripEvent];
  if (!template) throw new Error(`Unknown drip event: ${dripEvent}`);

  const html = template.html
    .replace(/\{\{UNSUBSCRIBE_URL\}\}/g, unsubscribeUrl)
    .replace(/\{\{SLOTS_REMAINING\}\}/g, slotsRemaining);

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: FROM_EMAIL,
      to,
      subject: template.subject,
      html,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Resend ${res.status}: ${text}`);
  }
}

// ----------------------------------------------------------------------------
// HANDLER
// ----------------------------------------------------------------------------

interface SchedulerResult {
  processed: number;
  sent: number;
  failed: number;
  skipped: number;
  byEvent: Record<string, { sent: number; failed: number; skipped: number }>;
}

serve(async (_req: Request) => {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const resendApiKey = Deno.env.get('RESEND_API_KEY') ?? '';

    if (!supabaseUrl || !serviceRoleKey || !resendApiKey) {
      return new Response(
        JSON.stringify({ error: 'Missing required env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, RESEND_API_KEY' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } },
      );
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    }) as unknown as SupabaseAdminClient;

    // Fetched once per run — slot count is fine to be a few minutes stale
    // across a single scheduler invocation.
    const slotsRemaining = await fetchSlotsRemaining(supabase);

    const result: SchedulerResult = {
      processed: 0,
      sent: 0,
      failed: 0,
      skipped: 0,
      byEvent: {},
    };

    for (const [offsetStr, dripEvent] of Object.entries(DAY_OFFSET_TO_EVENT)) {
      const dayOffset = Number(offsetStr);
      result.byEvent[dripEvent] = { sent: 0, failed: 0, skipped: 0 };

      let cohort: SignupRow[];
      try {
        cohort = await fetchCohort(supabase, dayOffset);
      } catch (err) {
        console.error(JSON.stringify({
          level: 'error',
          event: 'cohort_fetch_failed',
          dayOffset,
          dripEvent,
          error: (err as Error).message,
        }));
        continue;
      }

      for (const user of cohort) {
        result.processed += 1;

        // Unsubscribe guard: never send to users who have opted out.
        if (user.unsubscribed_at) {
          result.skipped += 1;
          result.byEvent[dripEvent].skipped += 1;
          console.log(JSON.stringify({
            level: 'info',
            event: 'drip_skipped_unsubscribed',
            userId: user.id,
            dripEvent,
          }));
          continue;
        }

        // Idempotency: skip if already logged for this user+event.
        // deno-lint-ignore no-explicit-any
        const { data: existing, error: existingErr } = await (supabase as any)
          .from('drip_send_log')
          .select('id')
          .eq('user_id', user.id)
          .eq('drip_event', dripEvent)
          .maybeSingle();

        if (existingErr) {
          console.error(JSON.stringify({
            level: 'error',
            event: 'log_lookup_failed',
            userId: user.id,
            dripEvent,
            error: existingErr.message,
          }));
          // Treat lookup failure as a failure — do NOT send, to avoid duplicates.
          result.failed += 1;
          result.byEvent[dripEvent].failed += 1;
          continue;
        }

        if (existing) {
          result.skipped += 1;
          result.byEvent[dripEvent].skipped += 1;
          continue;
        }

        // Attempt send.
        let sendError: string | null = null;
        try {
          const unsubscribeUrl = `${UNSUBSCRIBE_BASE}?token=${user.unsubscribe_token}`;
          await sendDripEmail(user.email, dripEvent, slotsRemaining, unsubscribeUrl, resendApiKey);
        } catch (err) {
          sendError = (err as Error).message;
        }

        // Log outcome (fire-and-forget; we already moved on on error).
        // deno-lint-ignore no-explicit-any
        const { error: logErr } = await (supabase as any)
          .from('drip_send_log')
          .insert({
            user_id: user.id,
            drip_event: dripEvent,
            status: sendError ? 'failed' : 'sent',
            error_text: sendError,
          });

        if (logErr) {
          console.error(JSON.stringify({
            level: 'error',
            event: 'log_insert_failed',
            userId: user.id,
            dripEvent,
            error: logErr.message,
          }));
        }

        if (sendError) {
          result.failed += 1;
          result.byEvent[dripEvent].failed += 1;
          console.error(JSON.stringify({
            level: 'error',
            event: 'drip_send_failed',
            userId: user.id,
            dripEvent,
            error: sendError,
          }));
        } else {
          result.sent += 1;
          result.byEvent[dripEvent].sent += 1;
          console.log(JSON.stringify({
            level: 'info',
            event: 'drip_send_succeeded',
            userId: user.id,
            dripEvent,
          }));
        }
      }
    }

    return new Response(JSON.stringify({ ok: true, result }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error(JSON.stringify({
      level: 'error',
      event: 'scheduler_fatal',
      error: (err as Error).message,
      stack: (err as Error).stack,
    }));
    return new Response(
      JSON.stringify({ error: 'Internal error', detail: (err as Error).message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
});

// deno-lint-ignore no-explicit-any
declare const Deno: any;
