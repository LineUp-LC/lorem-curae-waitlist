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

type DripEventType =
  | 'welcome'
  | 'scan_walkthrough'
  | 'founding_rate_urgency'
  | 'scan_deep_dive'
  | 're_engagement';

// Day offset (in days since created_at) → drip event.
// welcome is handled by the signup flow, not the scheduler.
const DAY_OFFSET_TO_EVENT: Record<number, DripEventType> = {
  3: 'scan_walkthrough',
  7: 'founding_rate_urgency',
  14: 'scan_deep_dive',
  30: 're_engagement',
};

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
<p>Point your camera at any product. We identify it, then score every ingredient against your skin profile, verified across multiple sources. You get back a safety rating, an ingredient-by-ingredient breakdown, and where to buy. Conflict detection and the compatible products list are included free. Premium adds the recommended action for resolving a conflict.</p>
<p>That's it. No questionnaires, no advisor chats — scan, read, decide.</p>
<p><strong><a href="{{MAGIC_LINK}}">Scan your first product when we launch</a></strong></p>
${SIGN_OFF}
${FOOTER}`,
  },
  scan_walkthrough: {
    subject: 'What happens when you scan a product',
    html: `<p>Hi there,</p>
<p>A scan takes about three seconds. Here's what it does:</p>
<p><strong>1. Identifies the product.</strong> Camera reads the label or barcode. You don't type anything.</p>
<p><strong>2. Scores every ingredient against your skin profile.</strong> Each one is marked safe, caution, or avoid — with the specific reason. Fragrance you've flagged as a trigger? An ingredient that clashes with something already on your shelf? You see it free. Premium adds the recommended action for resolving it.</p>
<p><strong>3. Surfaces where to buy.</strong> Retailer options appear immediately, each with a trust score so you know who's legit.</p>
<p>No guessing at INCI lists. No copying names into Google.</p>
<p><strong><a href="{{MAGIC_LINK}}">Sign in</a></strong></p>
${SIGN_OFF}
${FOOTER}`,
  },
  founding_rate_urgency: {
    subject: 'Your founding rate is still locked',
    html: `<p>Hi there,</p>
<p>Your spot on the Curae waitlist is still held, and your founding rate is still locked.</p>
<p>Founding members keep the founding rate for as long as they stay subscribed — it doesn't renew at the standard price later.</p>
<p>{{SLOTS_REMAINING}} founding spots remain.</p>
<p><strong><a href="{{MAGIC_LINK}}">Sign in</a></strong></p>
${SIGN_OFF}
${FOOTER}`,
  },
  scan_deep_dive: {
    subject: 'What a scan actually unlocks',
    html: `<p>Hi there,</p>
<p>A scan isn't just a safety rating. Here's what it opens up:</p>
<p><strong>Compatible products.</strong> Once we know what's in your current product, we can surface alternatives that actually fit — same function, ingredients your skin tolerates.</p>
<p><strong>Where to buy, with retailer trust scores.</strong> You see who stocks it, at what price, and whether they're a legit source for that brand. No counterfeit roulette.</p>
<p><strong>Ask Curae, trained on your skin profile and routine.</strong> Ask it whether a new product fits alongside what you already use. It answers in context — not generic advice.</p>
<p><strong>Your Shelf.</strong> Every product you scan is saved. Check compatibility across your whole routine in one view.</p>
<p>Each one is something the scan opens up. No scan, no context — that's why the scan is the whole point.</p>
<p><strong><a href="{{MAGIC_LINK}}">Sign in</a></strong></p>
${SIGN_OFF}
${FOOTER}`,
  },
  re_engagement: {
    subject: 'Still holding your spot',
    html: `<p>Hi there,</p>
<p>Your Curae spot is still held. You signed up to scan products and see which ingredients actually work for your skin — that's still what we're building.</p>
<p>If you'd like to stay on the list, no action needed. If you'd rather let your spot go, the unsubscribe link below does it in one click.</p>
<p><strong><a href="{{MAGIC_LINK}}">Sign in</a></strong></p>
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
  auth: {
    admin: {
      generateLink: (opts: {
        type: 'magiclink';
        email: string;
        options?: { redirectTo?: string };
      }) => Promise<{
        data: { properties?: { action_link?: string } } | null;
        error: { message?: string } | null;
      }>;
    };
  };
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

async function generateMagicLink(
  supabase: SupabaseAdminClient,
  email: string,
): Promise<string> {
  const { data, error } = await supabase.auth.admin.generateLink({
    type: 'magiclink',
    email: email.trim().toLowerCase(),
    options: { redirectTo: REDIRECT_URL },
  });
  if (error || !data?.properties?.action_link) {
    throw new Error(`generateLink failed: ${error?.message || 'no action_link'}`);
  }
  return data.properties.action_link;
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
  magicLink: string,
  slotsRemaining: string,
  unsubscribeUrl: string,
  resendApiKey: string,
): Promise<void> {
  const template = dripTemplates[dripEvent];
  if (!template) throw new Error(`Unknown drip event: ${dripEvent}`);

  const html = template.html
    .replace(/\{\{MAGIC_LINK\}\}/g, magicLink)
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
          const magicLink = await generateMagicLink(supabase, user.email);
          const unsubscribeUrl = `${UNSUBSCRIBE_BASE}?token=${user.unsubscribe_token}`;
          await sendDripEmail(user.email, dripEvent, magicLink, slotsRemaining, unsubscribeUrl, resendApiKey);
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
