// ============================================================================
// LOREM CURAE - FOLLOW-UP EMAIL TEMPLATES & SENDING
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

const FROM_EMAIL = 'Lorem Curae <hello@loremcurae.com>';
const REDIRECT_URL = process.env.NEXT_PUBLIC_SITE_URL
  ? `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`
  : 'https://lorem-curae-waitlist.vercel.app/auth/callback';

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
// FOLLOW-UP EMAIL TEMPLATES (with {{MAGIC_LINK}} placeholder)
// ----------------------------------------------------------------------------

export const followupTemplates: Record<string, EmailTemplate> = {
  // ---- Tester Access Opened ----
  tester_creator_access_opened: {
    subject: "Your creator tester access is now open",
    html: `<p>Hi there,</p>
<p>Great news: your creator tester access is now live.</p>
<p>You can now explore the creator dashboard, set up product listings, and test our early marketplace tools. Your feedback will directly shape what we build next.</p>
<p><strong><a href="{{MAGIC_LINK}}">Click here to access your creator tools</a></strong></p>
<p>We're excited to have you testing with us.</p>
<p>Best,<br/>Ethan Jones<br/>Founder, Lorem Curae</p>`,
  },
  tester_consumer_access_opened: {
    subject: "Your tester access is now open",
    html: `<p>Hi there,</p>
<p>Great news: your tester access is now live.</p>
<p>You can now explore Lorem Curae and test new features before anyone else. Your feedback will help us build something great.</p>
<p><strong><a href="{{MAGIC_LINK}}">Click here to start testing</a></strong></p>
<p>We're excited to have you testing with us.</p>
<p>Best,<br/>Ethan Jones<br/>Founder, Lorem Curae</p>`,
  },

  // ---- Creator Tools Opened ----
  creator_c1_tools_opened: {
    subject: "Your Wave C1 creator tools are now open",
    html: `<p>Hi there,</p>
<p>Great news: your Wave C1 creator access is now live.</p>
<p>As one of our first creators, you now have access to the marketplace: product listings, your creator dashboard, and the tools to share and monetize your work.</p>
<p><strong><a href="{{MAGIC_LINK}}">Click here to access your creator dashboard</a></strong></p>
<p>Thanks for being part of this from the start.</p>
<p>Best,<br/>Ethan Jones<br/>Founder, Lorem Curae</p>`,
  },
  creator_c2_tools_opened: {
    subject: "Your Wave C2 creator tools are now open",
    html: `<p>Hi there,</p>
<p>Great news: your Wave C2 creator access is now live.</p>
<p>You now have access to expanded marketplace tools: product analytics, promotional features, and new ways to grow your audience on Lorem Curae.</p>
<p><strong><a href="{{MAGIC_LINK}}">Click here to access your creator dashboard</a></strong></p>
<p>Thanks for being part of this journey.</p>
<p>Best,<br/>Ethan Jones<br/>Founder, Lorem Curae</p>`,
  },
  creator_c3_tools_opened: {
    subject: "Your Wave C3 creator tools are now open",
    html: `<p>Hi there,</p>
<p>Great news: your Wave C3 creator access is now live.</p>
<p>You now have access to our most advanced creator tools: AI-assisted product creation, formulation tools, patch testing workflows, and deep analytics.</p>
<p><strong><a href="{{MAGIC_LINK}}">Click here to access your creator dashboard</a></strong></p>
<p>Thanks for being part of this journey.</p>
<p>Best,<br/>Ethan Jones<br/>Founder, Lorem Curae</p>`,
  },
  founding_member_creator_tools_opened: {
    subject: "Your Founding Creator tools are ready",
    html: `<p>Hi there,</p>
<p>Your Founding Creator tools are now fully available.</p>
<p>As a Founding Creator, you have priority access to everything we're building: your creator dashboard, product listings, analytics, AI tools, and every feature as it launches.</p>
<p><strong><a href="{{MAGIC_LINK}}">Click here to access your creator dashboard</a></strong></p>
<p>Thanks for believing in what we're building.</p>
<p>Best,<br/>Ethan Jones<br/>Founder, Lorem Curae</p>`,
  },
  founding_member_tester_creator_tools_opened: {
    subject: "Your Founding Creator Tester tools are ready",
    html: `<p>Hi there,</p>
<p>Your Founding Creator Tester tools are now fully available.</p>
<p>As a Founding Creator Tester, you have priority access to every creator tool plus early experimental features before anyone else. Your feedback shapes what we build.</p>
<p><strong><a href="{{MAGIC_LINK}}">Click here to access your creator dashboard</a></strong></p>
<p>Thanks for believing in what we're building, and for helping us build it.</p>
<p>Best,<br/>Ethan Jones<br/>Founder, Lorem Curae</p>`,
  },

  // ---- Consumer Waves Opened ----
  consumer_wave_1_opened: {
    subject: "Your Wave 1 access is now open",
    html: `<p>Hi there,</p>
<p>Great news: your Wave 1 access is now live.</p>
<p>As a Wave 1 member, you're among the first to access the foundation of Lorem Curae: core discovery tools, personalized feeds, and the essentials we're building everything else on top of.</p>
<p><strong><a href="{{MAGIC_LINK}}">Click here to explore Lorem Curae</a></strong></p>
<p>Thanks for being part of this from the very beginning.</p>
<p>Best,<br/>Ethan Jones<br/>Founder, Lorem Curae</p>`,
  },
  consumer_wave_2_opened: {
    subject: "Your Wave 2 access is now open",
    html: `<p>Hi there,</p>
<p>Great news: your Wave 2 access is now live.</p>
<p>You now have access to our engagement features: community interactions, saved collections, and tools that make Lorem Curae feel like more than just browsing.</p>
<p><strong><a href="{{MAGIC_LINK}}">Click here to explore Lorem Curae</a></strong></p>
<p>Thanks for being part of this journey.</p>
<p>Best,<br/>Ethan Jones<br/>Founder, Lorem Curae</p>`,
  },
  consumer_wave_3_opened: {
    subject: "Your Wave 3 access is now open",
    html: `<p>Hi there,</p>
<p>Great news: your Wave 3 access is now live.</p>
<p>You now have access to our growth features: sharing tools, invite capabilities, and expanded ways to discover content you'll love.</p>
<p><strong><a href="{{MAGIC_LINK}}">Click here to explore Lorem Curae</a></strong></p>
<p>Thanks for being part of this journey.</p>
<p>Best,<br/>Ethan Jones<br/>Founder, Lorem Curae</p>`,
  },
  consumer_wave_4_opened: {
    subject: "Your Wave 4 access is now open",
    html: `<p>Hi there,</p>
<p>Great news: your Wave 4 access is now live.</p>
<p>You now have access to our marketplace features: secure transactions, verified profiles, and the ability to purchase content you believe in.</p>
<p><strong><a href="{{MAGIC_LINK}}">Click here to explore Lorem Curae</a></strong></p>
<p>Thanks for being part of this journey.</p>
<p>Best,<br/>Ethan Jones<br/>Founder, Lorem Curae</p>`,
  },
  consumer_wave_5_opened: {
    subject: "Your Wave 5 access is now open",
    html: `<p>Hi there,</p>
<p>Great news: your Wave 5 access is now live.</p>
<p>You now have access to our intelligence features: smart recommendations, personalized discovery, and AI-powered tools that learn what you love.</p>
<p><strong><a href="{{MAGIC_LINK}}">Click here to explore Lorem Curae</a></strong></p>
<p>Thanks for being part of this journey.</p>
<p>Best,<br/>Ethan Jones<br/>Founder, Lorem Curae</p>`,
  },
  consumer_wave_6_opened: {
    subject: "Your Wave 6 access is now open",
    html: `<p>Hi there,</p>
<p>Great news: your Wave 6 access is now live.</p>
<p>You now have access to our expansion features: new content categories, broader marketplace offerings, and a more complete Lorem Curae experience.</p>
<p><strong><a href="{{MAGIC_LINK}}">Click here to explore Lorem Curae</a></strong></p>
<p>Thanks for being part of this journey.</p>
<p>Best,<br/>Ethan Jones<br/>Founder, Lorem Curae</p>`,
  },
  consumer_wave_7_opened: {
    subject: "Your Wave 7 access is now open",
    html: `<p>Hi there,</p>
<p>Great news: your Wave 7 access is now live.</p>
<p>You now have access to our immersive features: augmented reality previews, interactive product exploration, and new ways to understand what fits your needs.</p>
<p><strong><a href="{{MAGIC_LINK}}">Click here to explore Lorem Curae</a></strong></p>
<p>Thanks for being part of this journey.</p>
<p>Best,<br/>Ethan Jones<br/>Founder, Lorem Curae</p>`,
  },

  // ---- Role Upgrades (NON-FOUNDING ONLY) ----
  role_upgraded_to_tester_creator: {
    subject: "You've been upgraded to Creator Tester",
    html: `<p>Hi there,</p>
<p>Your access has been upgraded to Creator Tester.</p>
<p>You now have access to test our creator tools: the creator dashboard, product listings, and early marketplace features. Your feedback will help shape what we build for creators.</p>
<p>Thanks for being part of this early group. Your feedback helps us build something better.</p>
<p><strong><a href="{{MAGIC_LINK}}">Click here to access your creator tools</a></strong></p>
<p>Thanks for being part of this journey.</p>
<p>Best,<br/>Ethan Jones<br/>Founder, Lorem Curae</p>`,
  },
  role_upgraded_to_tester_consumer: {
    subject: "You've been upgraded to Tester",
    html: `<p>Hi there,</p>
<p>Your access has been upgraded to Tester.</p>
<p>You now have access to test new features before they roll out to everyone. Your feedback will help us build something great.</p>
<p>Thanks for being part of this early group. Your feedback helps us build something better.</p>
<p><strong><a href="{{MAGIC_LINK}}">Click here to start your testing</a></strong></p>
<p>Thanks for being part of this journey.</p>
<p>Best,<br/>Ethan Jones<br/>Founder, Lorem Curae</p>`,
  },
  role_upgraded_generic: {
    subject: "Your Lorem Curae access has been upgraded",
    html: `<p>Hi there,</p>
<p>Your access has been upgraded.</p>
<p>You now have access to new features and tools. Sign in to explore what's available.</p>
<p>Thanks for being part of this early group. Your feedback helps us build something better.</p>
<p><strong><a href="{{MAGIC_LINK}}">Click here to explore your new access</a></strong></p>
<p>Thanks for being part of this journey.</p>
<p>Best,<br/>Ethan Jones<br/>Founder, Lorem Curae</p>`,
  },

  // ---- Role Downgrades ----
  role_downgraded_generic: {
    subject: "Your Lorem Curae access has changed",
    html: `<p>Hi there,</p>
<p>We wanted to let you know that your Lorem Curae access level has changed.</p>
<p>You can still sign in and use the features available to your current access level.</p>
<p>Thanks for being part of this early group. Your feedback helps us build something better.</p>
<p><strong><a href="{{MAGIC_LINK}}">Click here to access your account</a></strong></p>
<p>If you have questions about this change, please reach out to us.</p>
<p>Best,<br/>Ethan Jones<br/>Founder, Lorem Curae</p>`,
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

  // Replace placeholder
  const htmlWithLink = template.html.replace(/\{\{MAGIC_LINK\}\}/g, magicLink);

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
      html: htmlWithLink,
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
