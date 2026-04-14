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
const REDIRECT_URL = process.env.NEXT_PUBLIC_SITE_URL
  ? `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`
  : 'https://lorem-curae-waitlist.vercel.app/auth/callback';
const UNSUBSCRIBE_BASE = 'https://fskvzrobcfokezumadbb.supabase.co/functions/v1/unsubscribe';
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
<p><strong><a href="{{MAGIC_LINK}}">${ctaLabel}</a></strong></p>
${SIGN_OFF}
${FOOTER}`;
}

// ----------------------------------------------------------------------------
// FOLLOW-UP EMAIL TEMPLATES (with {{MAGIC_LINK}} placeholder)
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
<p><strong><a href="{{MAGIC_LINK}}">Open the creator dashboard</a></strong></p>
${SIGN_OFF}
${FOOTER}`,
  },
  role_upgraded_to_tester_consumer: {
    subject: "You're now a tester",
    html: `<p>Hi there,</p>
<p>Your access has been upgraded to tester. You can scan products and try features before anyone else.</p>
<p>${SCAN_LINE}</p>
<p><strong><a href="{{MAGIC_LINK}}">Sign in and scan</a></strong></p>
${SIGN_OFF}
${FOOTER}`,
  },
  role_upgraded_generic: {
    subject: "Your Curae access changed",
    html: `<p>Hi there,</p>
<p>Your Curae access has been upgraded. Sign in to see what's available.</p>
<p><strong><a href="{{MAGIC_LINK}}">Sign in</a></strong></p>
${SIGN_OFF}
${FOOTER}`,
  },

  // ---- Role Downgrades ----
  role_downgraded_generic: {
    subject: "Your Curae access changed",
    html: `<p>Hi there,</p>
<p>Your Curae access level has changed. You can still sign in and use the features available at your current level.</p>
<p><strong><a href="{{MAGIC_LINK}}">Sign in</a></strong></p>
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
}

/**
 * Sends a follow-up email based on role and event type.
 * Generates a magic link and replaces the {{MAGIC_LINK}} placeholder.
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

  // Generate magic link
  const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
    type: 'magiclink',
    email: email.trim().toLowerCase(),
    options: {
      redirectTo: REDIRECT_URL,
    },
  });

  if (linkError || !linkData?.properties?.action_link) {
    throw new Error(
      `[followupTemplates] Failed to generate magic link for ${email}: ${linkError?.message || 'No action_link returned'}`
    );
  }

  const magicLink = linkData.properties.action_link;

  // Fetch unsubscribe token for this user. Falls back to mailto if missing.
  const { data: waitlistRow, error: tokenErr } = await supabase
    .from('waitlist')
    .select('unsubscribe_token')
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

  const unsubscribeUrl = waitlistRow?.unsubscribe_token
    ? `${UNSUBSCRIBE_BASE}?token=${waitlistRow.unsubscribe_token}`
    : UNSUBSCRIBE_URL_FALLBACK;

  // Replace placeholders
  const htmlWithSubstitutions = template.html
    .replace(/\{\{MAGIC_LINK\}\}/g, magicLink)
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

  if (!emailResponse.ok) {
    const errorText = await emailResponse.text();
    throw new Error(
      `[followupTemplates] Failed to send follow-up email to ${email}: ${emailResponse.status} ${errorText}`
    );
  }

  const emailResult = await emailResponse.json();

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
