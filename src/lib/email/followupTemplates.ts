// ============================================================================
// CURAE — FOLLOW-UP EMAIL TEMPLATES & SENDING
// ============================================================================
//
// This file contains:
//   - Type definitions for roles and follow-up events
//   - All follow-up email templates (organized by role + eventType)
//   - sendFollowupEmail() function for sending role-specific follow-ups
//
// CRITICAL: Founding Member roles are NEVER assigned automatically.
// They are terminal roles assigned only by an admin.
//
// Environment variables required:
//   - SUPABASE_URL
//   - SUPABASE_SERVICE_ROLE_KEY
//   - RESEND_API_KEY
//
// ============================================================================

import { createClient } from '@supabase/supabase-js';

// ----------------------------------------------------------------------------
// CONFIGURATION (from environment)
// ----------------------------------------------------------------------------

const FROM_EMAIL = 'Curae <hello@loremcurae.com>';
const UNSUBSCRIBE_BASE = 'https://fskvzrobcfokezumadbb.supabase.co/functions/v1/unsubscribe';

// FOLLOW-UP EMAILS DO NOT CARRY A SIGN-IN LINK.
// auth.admin.generateLink CREATES the auth user when none exists. This mailer fires on
// wave-open / tester-access / creator-tools, which are PER COHORT and IN BULK, so a single
// wave opening would have minted an account for every member of it. Access being granted
// is not consent to an account: the person creates one deliberately, at the app.
const FOLLOWUP_CTA_URL = 'https://loremcurae.com';
const UNSUBSCRIBE_URL_FALLBACK = 'mailto:hello@loremcurae.com?subject=Unsubscribe';

// ----------------------------------------------------------------------------
// TYPE DEFINITIONS
// ----------------------------------------------------------------------------

/** All valid user roles in the system */
export type UserRole =
  | 'founding_member'
  | 'founding_member_creator'
  | 'founding_member_tester_creator'
  | 'founding_member_tester_consumer'
  | 'tester_creator'
  | 'tester_consumer'
  | 'creator_c1'
  | 'creator_c2'
  | 'creator_c3'
  | 'consumer_wave_1'
  | 'consumer_wave_2'
  | 'consumer_wave_3'
  | 'consumer_wave_4'
  | 'consumer_wave_5'
  | 'consumer_wave_6'
  | 'consumer_wave_7'
  | 'user';

/** Founding roles that can NEVER be auto-assigned */
export const FOUNDING_ROLES: readonly UserRole[] = [
  'founding_member',
  'founding_member_creator',
  'founding_member_tester_creator',
  'founding_member_tester_consumer',
] as const;

/** Follow-up event types */
export type FollowupEventType =
  | 'tester_access_opened'
  | 'creator_tools_opened'
  | 'consumer_wave_opened'
  | 'role_upgraded'
  | 'role_downgraded';

/** Email template structure */
interface EmailTemplate {
  subject: string;
  html: string;
}

/** User object for follow-up emails */
export interface FollowupUser {
  email: string;
  role: UserRole;
}

// ----------------------------------------------------------------------------
// SHARED COPY PIECES
// ----------------------------------------------------------------------------

const SCAN_LINE =
  "Curae scans any product and tells you, ingredient by ingredient, whether it fits your skin.";

const FOOTER = `<p style="color:#888;font-size:12px;margin-top:32px;">Curae · <a href="{{UNSUBSCRIBE_URL}}" style="color:#888;">Unsubscribe</a> · <a href="https://loremcurae.com/privacy" style="color:#888;">Privacy</a></p>`;

const SIGN_OFF = `<p>— Ethan Jones<br/>Founder, Curae</p>`;

function accessOpenedHtml(bodyLine: string, ctaLabel = "Sign in and scan"): string {
  return `<p>Hi there,</p>
<p>${bodyLine}</p>
<p>${SCAN_LINE}</p>
<p><strong><a href="${FOLLOWUP_CTA_URL}">${ctaLabel}</a></strong></p>
${SIGN_OFF}
${FOOTER}`;
}

// ----------------------------------------------------------------------------
// FOLLOW-UP EMAIL TEMPLATES (CTAs point at FOLLOWUP_CTA_URL; no magic link, see above)
// ----------------------------------------------------------------------------

export const followupTemplates: Record<string, EmailTemplate> = {
  // ---- Tester Access Opened ----
  tester_creator_access_opened: {
    subject: "Your creator tester access is open",
    html: accessOpenedHtml(
      "Your creator tester access is live. Dashboard, listings, and early marketplace tools are open — your feedback shapes what we ship next.",
      "Open the creator dashboard",
    ),
  },
  tester_consumer_access_opened: {
    subject: "Your tester access is open",
    html: accessOpenedHtml(
      "Your tester access is live. You can scan products and try features before anyone else.",
    ),
  },

  // ---- Creator Tools Opened ----
  creator_c1_tools_opened: {
    subject: "Your Wave C1 creator tools are ready",
    html: accessOpenedHtml(
      "Your Wave C1 creator access is live. Dashboard, listings, and marketplace tools are open.",
      "Open the creator dashboard",
    ),
  },
  creator_c2_tools_opened: {
    subject: "Your Wave C2 creator tools are ready",
    html: accessOpenedHtml(
      "Your Wave C2 creator access is live.",
      "Open the creator dashboard",
    ),
  },
  creator_c3_tools_opened: {
    subject: "Your Wave C3 creator tools are ready",
    html: accessOpenedHtml(
      "Your Wave C3 creator access is live.",
      "Open the creator dashboard",
    ),
  },
  founding_member_creator_tools_opened: {
    subject: "Your founding creator tools are ready",
    html: accessOpenedHtml(
      "Your founding creator tools are live. You have priority access to everything we're building for creators.",
      "Open the creator dashboard",
    ),
  },
  founding_member_tester_creator_tools_opened: {
    subject: "Your founding creator tester tools are ready",
    html: accessOpenedHtml(
      "Your founding creator tester tools are live — full access plus experimental features first.",
      "Open the creator dashboard",
    ),
  },

  // ---- Consumer Waves Opened ----
  consumer_wave_1_opened: {
    subject: "Your Wave 1 access is open",
    html: accessOpenedHtml("Your Wave 1 access is live."),
  },
  consumer_wave_2_opened: {
    subject: "Your Wave 2 access is open",
    html: accessOpenedHtml("Your Wave 2 access is live."),
  },
  consumer_wave_3_opened: {
    subject: "Your Wave 3 access is open",
    html: accessOpenedHtml("Your Wave 3 access is live."),
  },
  consumer_wave_4_opened: {
    subject: "Your Wave 4 access is open",
    html: accessOpenedHtml("Your Wave 4 access is live."),
  },
  consumer_wave_5_opened: {
    subject: "Your Wave 5 access is open",
    html: accessOpenedHtml("Your Wave 5 access is live."),
  },
  consumer_wave_6_opened: {
    subject: "Your Wave 6 access is open",
    html: accessOpenedHtml("Your Wave 6 access is live."),
  },
  consumer_wave_7_opened: {
    subject: "Your Wave 7 access is open",
    html: accessOpenedHtml("Your Wave 7 access is live."),
  },

  // ---- Role Upgrades (NON-FOUNDING ONLY) ----
  role_upgraded_to_tester_creator: {
    subject: "You're now a creator tester",
    html: `<p>Hi there,</p>
<p>Your access has been upgraded to creator tester. Dashboard, listings, and early marketplace tools are open.</p>
<p>${SCAN_LINE}</p>
<p><strong><a href="${FOLLOWUP_CTA_URL}">Open the creator dashboard</a></strong></p>
${SIGN_OFF}
${FOOTER}`,
  },
  role_upgraded_to_tester_consumer: {
    subject: "You're now a tester",
    html: `<p>Hi there,</p>
<p>Your access has been upgraded to tester. You can scan products and try features before anyone else.</p>
<p>${SCAN_LINE}</p>
<p><strong><a href="${FOLLOWUP_CTA_URL}">Sign in and scan</a></strong></p>
${SIGN_OFF}
${FOOTER}`,
  },
  role_upgraded_generic: {
    subject: "Your Curae access changed",
    html: `<p>Hi there,</p>
<p>Your Curae access has been upgraded. Sign in to see what's available.</p>
<p><strong><a href="${FOLLOWUP_CTA_URL}">Sign in</a></strong></p>
${SIGN_OFF}
${FOOTER}`,
  },

  // ---- Role Downgrades ----
  role_downgraded_generic: {
    subject: "Your Curae access changed",
    html: `<p>Hi there,</p>
<p>Your Curae access level has changed. You can still sign in and use the features available at your current level.</p>
<p><strong><a href="${FOLLOWUP_CTA_URL}">Sign in</a></strong></p>
<p>If you have questions about this change, reply to this email.</p>
${SIGN_OFF}
${FOOTER}`,
  },
};

// ----------------------------------------------------------------------------
// TEMPLATE KEY RESOLVER
// ----------------------------------------------------------------------------

/**
 * Resolves the correct template key based on role and event type.
 * Returns null if no matching template exists.
 */
export function getFollowupTemplateKey(
  role: UserRole,
  eventType: FollowupEventType
): string | null {
  // Tester access opened
  if (eventType === 'tester_access_opened') {
    if (role === 'tester_creator') return 'tester_creator_access_opened';
    if (role === 'tester_consumer') return 'tester_consumer_access_opened';
    return null;
  }

  // Creator tools opened
  if (eventType === 'creator_tools_opened') {
    if (role === 'creator_c1') return 'creator_c1_tools_opened';
    if (role === 'creator_c2') return 'creator_c2_tools_opened';
    if (role === 'creator_c3') return 'creator_c3_tools_opened';
    if (role === 'founding_member_creator') return 'founding_member_creator_tools_opened';
    if (role === 'founding_member_tester_creator') return 'founding_member_tester_creator_tools_opened';
    return null;
  }

  // Consumer wave opened
  if (eventType === 'consumer_wave_opened') {
    if (role === 'consumer_wave_1') return 'consumer_wave_1_opened';
    if (role === 'consumer_wave_2') return 'consumer_wave_2_opened';
    if (role === 'consumer_wave_3') return 'consumer_wave_3_opened';
    if (role === 'consumer_wave_4') return 'consumer_wave_4_opened';
    if (role === 'consumer_wave_5') return 'consumer_wave_5_opened';
    if (role === 'consumer_wave_6') return 'consumer_wave_6_opened';
    if (role === 'consumer_wave_7') return 'consumer_wave_7_opened';
    return null;
  }

  // Role upgraded (NEVER to founding roles)
  if (eventType === 'role_upgraded') {
    if (role === 'tester_creator') return 'role_upgraded_to_tester_creator';
    if (role === 'tester_consumer') return 'role_upgraded_to_tester_consumer';
    // For other non-founding upgrades, use generic
    if (!FOUNDING_ROLES.includes(role)) return 'role_upgraded_generic';
    return null;
  }

  // Role downgraded
  if (eventType === 'role_downgraded') {
    return 'role_downgraded_generic';
  }

  return null;
}

// ----------------------------------------------------------------------------
// ENVIRONMENT VALIDATION
// ----------------------------------------------------------------------------

function getRequiredEnvVars() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const resendApiKey = process.env.RESEND_API_KEY;

  if (!supabaseUrl) {
    throw new Error('[followupTemplates] Missing required environment variable: SUPABASE_URL');
  }
  if (!supabaseServiceRoleKey) {
    throw new Error('[followupTemplates] Missing required environment variable: SUPABASE_SERVICE_ROLE_KEY');
  }
  if (!resendApiKey) {
    throw new Error('[followupTemplates] Missing required environment variable: RESEND_API_KEY');
  }

  return { supabaseUrl, supabaseServiceRoleKey, resendApiKey };
}

// ----------------------------------------------------------------------------
// SEND FOLLOW-UP EMAIL
// ----------------------------------------------------------------------------

export interface SendFollowupEmailResult {
  success: boolean;
  templateKey: string;
  emailId?: string;
  error?: string;
  /** True when a log row already existed for this user+template, so nothing was sent. */
  skipped?: boolean;
  /** Why it was skipped. Present only alongside `skipped`. */
  skippedReason?: string;
}

/**
 * Sends a follow-up email based on role and event type.
 * Sends the email. Generates NO magic link and creates NO auth account (see
 * FOLLOWUP_CTA_URL above); only the unsubscribe token is looked up.
 *
 * @throws Error if template is missing or email fails to send
 */
export async function sendFollowupEmail(
  email: string,
  role: UserRole,
  eventType: FollowupEventType
): Promise<SendFollowupEmailResult> {
  const { supabaseUrl, supabaseServiceRoleKey, resendApiKey } = getRequiredEnvVars();

  // Resolve template key
  const templateKey = getFollowupTemplateKey(role, eventType);
  if (!templateKey) {
    throw new Error(
      `[followupTemplates] No follow-up template found for role="${role}" and eventType="${eventType}". ` +
      `Ensure this combination is supported or add a new template.`
    );
  }

  const template = followupTemplates[templateKey];
  if (!template) {
    throw new Error(
      `[followupTemplates] Template key "${templateKey}" resolved but template not found. ` +
      `This is a bug. Please add the template to followupTemplates.`
    );
  }

  // Create Supabase admin client
  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  // Fetch the id + unsubscribe token for this user. Falls back to mailto if missing.
  const { data: waitlistRow, error: tokenErr } = await supabase
    .from('waitlist')
    .select('id, unsubscribe_token')
    .eq('email', email.trim().toLowerCase())
    .maybeSingle();

  if (tokenErr) {
    console.warn(JSON.stringify({
      level: 'warn',
      event: 'unsubscribe_token_lookup_failed',
      email: email.substring(0, 3) + '***',
      error: tokenErr.message,
    }));
  }

  // ---------------------------------------------------------------------------
  // DEDUPE. Without this, running onConsumerWaveOpenedBatch twice emails every
  // recipient twice, and nothing records that the first run happened -- "your
  // access is open" arriving twice reads as a system that does not know what it
  // has told you.
  //
  // Keyed on template_key, not event_type: 'consumer_wave_opened' fires once per
  // wave a person is in, so someone moved from wave 2 to wave 1 must still be
  // told that wave 1 opened.
  //
  // A FAILED LOOKUP DOES NOT SEND. The drip scheduler takes the same position
  // for the same reason: if we cannot tell whether this was already sent, the
  // safe answer is to stop, because the cost of a duplicate is higher than the
  // cost of a retry. It throws rather than returning, so the batch counts it as
  // a failure and surfaces it instead of silently skipping.
  // ---------------------------------------------------------------------------
  const userId = (waitlistRow as { id?: string } | null)?.id;
  if (!userId) {
    throw new Error(
      `[followupTemplates] No waitlist row for ${email.substring(0, 3)}***, so the send cannot be logged. Not sending.`
    );
  }

  const { data: priorSend, error: logLookupErr } = await supabase
    .from('followup_send_log')
    .select('id, status')
    .eq('user_id', userId)
    .eq('template_key', templateKey)
    .maybeSingle();

  if (logLookupErr) {
    throw new Error(
      `[followupTemplates] Could not read followup_send_log for ${templateKey}: ${logLookupErr.message}. Not sending.`
    );
  }

  if (priorSend && (priorSend as { status: string }).status === 'sent') {
    console.log(JSON.stringify({
      level: 'info',
      event: 'followup_email_skipped_already_sent',
      email: email.substring(0, 3) + '***',
      templateKey,
    }));
    return { success: true, templateKey, skipped: true, skippedReason: 'already_sent' };
  }

  const unsubscribeUrl = waitlistRow?.unsubscribe_token
    ? `${UNSUBSCRIBE_BASE}?token=${waitlistRow.unsubscribe_token}`
    : UNSUBSCRIBE_URL_FALLBACK;

  // Replace placeholders
  const htmlWithSubstitutions = template.html
    .replace(/\{\{UNSUBSCRIBE_URL\}\}/g, unsubscribeUrl);

  // Send email via Resend
  const emailResponse = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: FROM_EMAIL,
      to: email.trim().toLowerCase(),
      subject: template.subject,
      html: htmlWithSubstitutions,
    }),
  });

  // SEND FIRST, THEN WRITE THE LOG -- never the other way round. Logging before
  // the send would, on a failure, leave a row claiming we told them something we
  // did not. UPSERT rather than insert: a previous attempt may have left a
  // `failed` row on the same (user_id, template_key), and a retry has to be able
  // to overwrite it.
  const recordSend = async (status: 'sent' | 'failed', errorText: string | null) => {
    const { error: logErr } = await supabase
      .from('followup_send_log')
      .upsert(
        {
          user_id: userId,
          event_type: eventType,
          template_key: templateKey,
          status,
          error_text: errorText,
          sent_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,template_key' },
      );
    if (logErr) {
      // Announced, never swallowed. A send that happened but was not recorded is
      // the state that produces a duplicate on the next run, so it must be
      // visible even though it is too late to prevent.
      console.error(JSON.stringify({
        level: 'error',
        event: 'followup_log_write_failed',
        email: email.substring(0, 3) + '***',
        templateKey,
        status,
        error: logErr.message,
      }));
    }
  };

  if (!emailResponse.ok) {
    const errorText = await emailResponse.text();
    await recordSend('failed', `Resend ${emailResponse.status}: ${errorText}`);
    throw new Error(
      `[followupTemplates] Failed to send follow-up email to ${email}: ${emailResponse.status} ${errorText}`
    );
  }

  const emailResult = await emailResponse.json();
  await recordSend('sent', null);

  // Log success (structured for Vercel logs)
  console.log(JSON.stringify({
    level: 'info',
    event: 'followup_email_sent',
    email: email.substring(0, 3) + '***',
    role,
    eventType,
    templateKey,
    emailId: emailResult.id,
    timestamp: new Date().toISOString(),
  }));

  return {
    success: true,
    templateKey,
    emailId: emailResult.id,
  };
}
