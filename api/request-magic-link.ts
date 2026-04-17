import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

console.log('[request-magic-link] Module loaded at', new Date().toISOString());

// ----------------------------------------------------------------------------
// CONFIGURATION
// ----------------------------------------------------------------------------

const FROM_EMAIL = 'Curae <hello@loremcurae.com>';
const DEFAULT_REDIRECT_URL = 'https://lorem-curae-waitlist.vercel.app/auth/callback';
const UNSUBSCRIBE_BASE = 'https://fskvzrobcfokezumadbb.supabase.co/functions/v1/unsubscribe';
const UNSUBSCRIBE_URL_FALLBACK = 'mailto:hello@loremcurae.com?subject=Unsubscribe';

function buildUnsubscribeUrl(token?: string | null): string {
  if (token) return `${UNSUBSCRIBE_BASE}?token=${token}`;
  return UNSUBSCRIBE_URL_FALLBACK;
}

// ----------------------------------------------------------------------------
// TYPES
// ----------------------------------------------------------------------------

type UserRole =
  | 'founding_member'
  | 'tester_creator'
  | 'tester_consumer'
  | 'creator_c1'
  | 'creator_c2'
  | 'creator_c3'
  | `consumer_wave_${1 | 2 | 3 | 4 | 5 | 6 | 7}`
  | 'user';

interface WaitlistRecord {
  email?: string;
  segment?: string;
  wave_number: number | null;
  creator_wave_number: number | null;
  status?: string;
  is_creator: boolean;
  is_founding_member: boolean;
  is_founding_member_creator?: boolean;
  wants_tester_access: boolean;
  unsubscribe_token?: string;
  created_at?: string;
  updated_at?: string | null;
}

interface EmailTemplate {
  subject: string;
  html: string;
}

// ----------------------------------------------------------------------------
// SHARED COPY PIECES
// ----------------------------------------------------------------------------

const SCAN_LINE =
  "Curae scans any product and tells you, ingredient by ingredient, whether it fits your skin.";

const FOOTER = `<p style="color:#888;font-size:12px;margin-top:32px;">Curae · <a href="{{UNSUBSCRIBE_URL}}" style="color:#888;">Unsubscribe</a> · <a href="https://loremcurae.com/privacy" style="color:#888;">Privacy</a></p>`;

const SIGN_OFF = `<p>— Ethan Jones<br/>Founder, Curae</p>`;

const LOGIN_SUBJECT = "Your Curae sign-in link";

function loginHtml(): string {
  return `<p>Hi there,</p>
<p>Here's your sign-in link.</p>
<p><strong><a href="{{MAGIC_LINK}}">Sign in to Curae</a></strong></p>
<p>It expires in 1 hour.</p>
${SIGN_OFF}
${FOOTER}`;
}

function signupHtml(opening: string, accessLine: string): string {
  return `<p>Hi there,</p>
<p>${opening}</p>
<p>${SCAN_LINE}</p>
<p>${accessLine}</p>
<p>Your founding rate is locked — you'll keep it for as long as you stay subscribed.</p>
<p><strong><a href="{{MAGIC_LINK}}">Confirm your email</a></strong></p>
${SIGN_OFF}
${FOOTER}`;
}

// ----------------------------------------------------------------------------
// EMAIL TEMPLATES
// ----------------------------------------------------------------------------

const templates: Record<string, EmailTemplate> = {
  // ---- Default waitlist ----
  waitlist_signup: {
    subject: "You're on the Curae waitlist",
    html: signupHtml(
      "You're on the Curae waitlist.",
      "We'll email you when access opens for your wave.",
    ),
  },
  non_tester_login: { subject: LOGIN_SUBJECT, html: loginHtml() },

  // ---- Tester Creator ----
  tester_creator_signup: {
    subject: "You're on the creator tester list",
    html: signupHtml(
      "You're on the creator tester list.",
      "When tester access opens, you'll be among the first creators in — your feedback will shape the tools we ship.",
    ),
  },
  tester_creator_login: { subject: LOGIN_SUBJECT, html: loginHtml() },

  // ---- Tester Consumer ----
  tester_consumer_signup: {
    subject: "You're on the tester list",
    html: signupHtml(
      "You're on the tester list.",
      "When tester access opens, you'll be able to scan products and try features before anyone else.",
    ),
  },
  tester_consumer_login: { subject: LOGIN_SUBJECT, html: loginHtml() },

  // ---- Founding Member ----
  founding_member_signup: {
    subject: "Welcome to Curae — founding member",
    html: signupHtml(
      "You're a founding member of Curae.",
      "You have priority access from day one — no waves, no waiting.",
    ),
  },
  founding_member_login: { subject: LOGIN_SUBJECT, html: loginHtml() },

  // ---- Founding Member Creator ----
  founding_member_creator_signup: {
    subject: "Welcome to Curae — founding creator",
    html: signupHtml(
      "You're a founding creator on Curae.",
      "You have priority access to every creator tool from day one — dashboard, listings, analytics.",
    ),
  },
  founding_member_creator_login: { subject: LOGIN_SUBJECT, html: loginHtml() },

  // ---- Founding Member Tester Creator ----
  founding_member_tester_creator_signup: {
    subject: "Welcome — founding creator tester",
    html: signupHtml(
      "You're a founding creator tester on Curae.",
      "You have priority access to every creator tool plus experimental features before anyone else.",
    ),
  },
  founding_member_tester_creator_login: { subject: LOGIN_SUBJECT, html: loginHtml() },

  // ---- Founding Member Tester Consumer ----
  founding_member_tester_consumer_signup: {
    subject: "Welcome — founding tester",
    html: signupHtml(
      "You're a founding tester on Curae.",
      "You have priority access from day one plus experimental features before anyone else.",
    ),
  },
  founding_member_tester_consumer_login: { subject: LOGIN_SUBJECT, html: loginHtml() },

  // ---- Creator Waves (wave number is access timing only) ----
  creator_c1_signup: {
    subject: "You're on the Curae creator waitlist",
    html: signupHtml(
      "You're on the Curae creator waitlist — Wave C1.",
      "C1 is the first creator wave in. We'll email you when access opens.",
    ),
  },
  creator_c1_login: { subject: LOGIN_SUBJECT, html: loginHtml() },
  creator_c2_signup: {
    subject: "You're on the Curae creator waitlist",
    html: signupHtml(
      "You're on the Curae creator waitlist — Wave C2.",
      "We'll email you when Wave C2 access opens.",
    ),
  },
  creator_c2_login: { subject: LOGIN_SUBJECT, html: loginHtml() },
  creator_c3_signup: {
    subject: "You're on the Curae creator waitlist",
    html: signupHtml(
      "You're on the Curae creator waitlist — Wave C3.",
      "We'll email you when Wave C3 access opens.",
    ),
  },
  creator_c3_login: { subject: LOGIN_SUBJECT, html: loginHtml() },

  // ---- Founder text opt-in offer (sent via api/text-opt-in.ts cascade + api/signup.ts trigger) ----
  text_opt_in_offer: {
    subject: "A personal note from Ethan — you're in the first 1,000",
    html: `<p>Hi there,</p>
<p>You're one of our first 1,000 founding members on Curae.</p>
<p>I personally text the first 1,000 — it's the fastest way to tell me what's working, what isn't, and what you want built next.</p>
<p><strong><a href="{{CLAIM_URL}}">Claim your spot</a></strong></p>
<p>This offer expires in 48 hours. If you'd rather not, no worries — just ignore this email.</p>
${SIGN_OFF}
${FOOTER}`,
  },

  // ---- Consumer Waves (wave number is access timing only) ----
  consumer_wave_1_signup: {
    subject: "You're on the Curae waitlist",
    html: signupHtml(
      "You're on the Curae waitlist — Wave 1.",
      "Wave 1 is the first group in. We'll email you when access opens.",
    ),
  },
  consumer_wave_1_login: { subject: LOGIN_SUBJECT, html: loginHtml() },
  consumer_wave_2_signup: {
    subject: "You're on the Curae waitlist",
    html: signupHtml(
      "You're on the Curae waitlist — Wave 2.",
      "We'll email you when Wave 2 access opens.",
    ),
  },
  consumer_wave_2_login: { subject: LOGIN_SUBJECT, html: loginHtml() },
  consumer_wave_3_signup: {
    subject: "You're on the Curae waitlist",
    html: signupHtml(
      "You're on the Curae waitlist — Wave 3.",
      "We'll email you when Wave 3 access opens.",
    ),
  },
  consumer_wave_3_login: { subject: LOGIN_SUBJECT, html: loginHtml() },
  consumer_wave_4_signup: {
    subject: "You're on the Curae waitlist",
    html: signupHtml(
      "You're on the Curae waitlist — Wave 4.",
      "We'll email you when Wave 4 access opens.",
    ),
  },
  consumer_wave_4_login: { subject: LOGIN_SUBJECT, html: loginHtml() },
  consumer_wave_5_signup: {
    subject: "You're on the Curae waitlist",
    html: signupHtml(
      "You're on the Curae waitlist — Wave 5.",
      "We'll email you when Wave 5 access opens.",
    ),
  },
  consumer_wave_5_login: { subject: LOGIN_SUBJECT, html: loginHtml() },
  consumer_wave_6_signup: {
    subject: "You're on the Curae waitlist",
    html: signupHtml(
      "You're on the Curae waitlist — Wave 6.",
      "We'll email you when Wave 6 access opens.",
    ),
  },
  consumer_wave_6_login: { subject: LOGIN_SUBJECT, html: loginHtml() },
  consumer_wave_7_signup: {
    subject: "You're on the Curae waitlist",
    html: signupHtml(
      "You're on the Curae waitlist — Wave 7.",
      "We'll email you when Wave 7 access opens.",
    ),
  },
  consumer_wave_7_login: { subject: LOGIN_SUBJECT, html: loginHtml() },
};

// ----------------------------------------------------------------------------
// ROLE-TO-TEMPLATE MAPPINGS
// ----------------------------------------------------------------------------

const signupTemplates: Record<UserRole, string> = {
  founding_member: 'founding_member_signup',
  tester_creator: 'tester_creator_signup',
  tester_consumer: 'tester_consumer_signup',
  creator_c1: 'creator_c1_signup',
  creator_c2: 'creator_c2_signup',
  creator_c3: 'creator_c3_signup',
  consumer_wave_1: 'consumer_wave_1_signup',
  consumer_wave_2: 'consumer_wave_2_signup',
  consumer_wave_3: 'consumer_wave_3_signup',
  consumer_wave_4: 'consumer_wave_4_signup',
  consumer_wave_5: 'consumer_wave_5_signup',
  consumer_wave_6: 'consumer_wave_6_signup',
  consumer_wave_7: 'consumer_wave_7_signup',
  user: 'waitlist_signup',
};

const loginTemplates: Record<UserRole, string> = {
  founding_member: 'founding_member_login',
  tester_creator: 'tester_creator_login',
  tester_consumer: 'tester_consumer_login',
  creator_c1: 'creator_c1_login',
  creator_c2: 'creator_c2_login',
  creator_c3: 'creator_c3_login',
  consumer_wave_1: 'consumer_wave_1_login',
  consumer_wave_2: 'consumer_wave_2_login',
  consumer_wave_3: 'consumer_wave_3_login',
  consumer_wave_4: 'consumer_wave_4_login',
  consumer_wave_5: 'consumer_wave_5_login',
  consumer_wave_6: 'consumer_wave_6_login',
  consumer_wave_7: 'consumer_wave_7_login',
  user: 'non_tester_login',
};

// ----------------------------------------------------------------------------
// HELPER FUNCTIONS
// ----------------------------------------------------------------------------

function determineUserRole(waitlist: WaitlistRecord): UserRole {
  if (waitlist.is_founding_member) {
    return 'founding_member';
  }
  if (waitlist.wants_tester_access) {
    return waitlist.is_creator ? 'tester_creator' : 'tester_consumer';
  }
  if (waitlist.is_creator && waitlist.creator_wave_number) {
    switch (waitlist.creator_wave_number) {
      case 1: return 'creator_c1';
      case 2: return 'creator_c2';
      case 3: return 'creator_c3';
    }
  }
  if (waitlist.wave_number) {
    return `consumer_wave_${waitlist.wave_number}` as UserRole;
  }
  return 'user';
}

function getTemplateKey(
  role: UserRole,
  type: 'signup' | 'login',
  waitlist: WaitlistRecord | null
): string {
  // Founding members have special handling
  if (role === 'founding_member' && waitlist) {
    if (waitlist.wants_tester_access && waitlist.is_creator) {
      return type === 'signup' ? 'founding_member_tester_creator_signup' : 'founding_member_tester_creator_login';
    }
    if (waitlist.wants_tester_access && !waitlist.is_creator) {
      return type === 'signup' ? 'founding_member_tester_consumer_signup' : 'founding_member_tester_consumer_login';
    }
    if (waitlist.is_creator) {
      return type === 'signup' ? 'founding_member_creator_signup' : 'founding_member_creator_login';
    }
  }
  return type === 'signup' ? signupTemplates[role] : loginTemplates[role];
}

// ----------------------------------------------------------------------------
// API HANDLER
// ----------------------------------------------------------------------------

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Wrap EVERYTHING in try/catch to ensure JSON response
  try {
    console.log(`[request-magic-link] ========== REQUEST START ==========`);
    console.log(`[request-magic-link] Method: ${req.method}`);
    console.log(`[request-magic-link] Body: ${JSON.stringify(req.body)}`);

    // -------------------------------------------------------------------------
    // STEP: Validate environment variables
    // -------------------------------------------------------------------------
    console.log(`[request-magic-link] Validating environment variables...`);

    const supabaseUrl = process.env.SUPABASE_URL;
    if (!supabaseUrl) {
      console.error(`[request-magic-link] Missing environment variable: SUPABASE_URL`);
      return res.status(500).json({ error: 'Missing environment variable: SUPABASE_URL' });
    }

    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceRoleKey) {
      console.error(`[request-magic-link] Missing environment variable: SUPABASE_SERVICE_ROLE_KEY`);
      return res.status(500).json({ error: 'Missing environment variable: SUPABASE_SERVICE_ROLE_KEY' });
    }

    const resendApiKey = process.env.RESEND_API_KEY;
    if (!resendApiKey) {
      console.error(`[request-magic-link] Missing environment variable: RESEND_API_KEY`);
      return res.status(500).json({ error: 'Missing environment variable: RESEND_API_KEY' });
    }

    console.log(`[request-magic-link] Environment variables validated`);

    // -------------------------------------------------------------------------
    // STEP: Validate request method
    // -------------------------------------------------------------------------
    if (req.method !== 'POST') {
      console.log(`[request-magic-link] Rejecting non-POST request`);
      return res.status(405).json({ error: 'Method not allowed' });
    }

    // -------------------------------------------------------------------------
    // STEP: Validate request body
    // -------------------------------------------------------------------------
    console.log(`[request-magic-link] Validating request body...`);

    const { email, type, redirectTo } = req.body || {};

    if (!email) {
      console.log(`[request-magic-link] Missing email`);
      return res.status(400).json({ error: 'Email is required' });
    }

    if (!type || !['signup', 'login'].includes(type)) {
      console.log(`[request-magic-link] Invalid type: "${type}"`);
      return res.status(400).json({ error: 'Type must be "signup" or "login"' });
    }

    const trimmedEmail = email.trim().toLowerCase();
    console.log(`[request-magic-link] Processing ${type} request for: ${trimmedEmail}`);

    // -------------------------------------------------------------------------
    // STEP: Create Supabase admin client
    // -------------------------------------------------------------------------
    console.log(`[request-magic-link] Creating Supabase admin client...`);

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    console.log(`[request-magic-link] Supabase admin client created`);

    // -------------------------------------------------------------------------
    // STEP: Fetch waitlist record
    // -------------------------------------------------------------------------
    console.log(`[request-magic-link] Fetching waitlist record...`);

    const { data: waitlist, error: waitlistError } = await supabase
      .from('waitlist')
      .select('wants_tester_access, is_creator, wave_number, creator_wave_number, is_founding_member, unsubscribe_token')
      .eq('email', trimmedEmail)
      .maybeSingle();

    if (waitlistError) {
      console.error(`[request-magic-link] Waitlist fetch error:`, waitlistError);
      return res.status(500).json({ error: 'Failed to fetch waitlist record' });
    }

    console.log(`[request-magic-link] Waitlist record:`, waitlist);

    // For login, require waitlist membership unless the email is an admin
    const adminEmails = process.env.SUPABASE_ADMIN_EMAILS
      ? process.env.SUPABASE_ADMIN_EMAILS.split(',').map((e) => e.trim().toLowerCase())
      : [];
    const isAdminEmail = adminEmails.includes(trimmedEmail);

    if (type === 'login' && !waitlist && !isAdminEmail) {
      console.log(`[request-magic-link] Email not on waitlist (login rejected)`);
      return res.status(404).json({ error: 'not-on-waitlist' });
    }

    // -------------------------------------------------------------------------
    // STEP: Generate magic link
    // -------------------------------------------------------------------------
    console.log(`[request-magic-link] Generating magic link...`);

    // Only allow redirectTo values that originate from this app (same Origin as
    // the browser request). Falls back to the default callback URL for direct
    // API calls or cross-origin attempts that could enable open-redirect attacks.
    const requestOrigin =
      typeof req.headers['origin'] === 'string' ? req.headers['origin'] : null;
    const resolvedRedirectTo =
      typeof redirectTo === 'string' &&
      redirectTo.length > 0 &&
      requestOrigin !== null &&
      redirectTo.startsWith(requestOrigin)
        ? redirectTo
        : DEFAULT_REDIRECT_URL;

    console.log('[request-magic-link] redirectTo being passed:', resolvedRedirectTo);

    const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: trimmedEmail,
      options: {
        redirectTo: resolvedRedirectTo,
      },
    });

    if (linkError) {
      console.error(`[request-magic-link] Magic link generation failed:`, linkError);
      return res.status(500).json({ error: 'Magic link generation failed' });
    }

    if (!linkData?.properties?.action_link) {
      console.error(`[request-magic-link] No action_link in response:`, linkData);
      return res.status(500).json({ error: 'Magic link generation failed' });
    }

    const magicLink = linkData.properties.action_link;
    console.log(`[request-magic-link] Magic link generated: ${magicLink.substring(0, 60)}...`);

    // Supabase ignores the redirectTo option in generateLink and instead appends
    // the project's Site URL as redirect_to. Rewrite it to the correct value.
    const rewrittenUrl = new URL(magicLink);
    rewrittenUrl.searchParams.set('redirect_to', resolvedRedirectTo);
    const finalMagicLink = rewrittenUrl.toString();
    console.log(`[request-magic-link] finalMagicLink redirect_to: ${resolvedRedirectTo}`);

    // -------------------------------------------------------------------------
    // STEP: Select email template
    // -------------------------------------------------------------------------
    const role: UserRole = waitlist ? determineUserRole(waitlist) : 'user';
    const templateKey = getTemplateKey(role, type as 'signup' | 'login', waitlist);
    console.log(`[request-magic-link] Selected template: ${templateKey} (role: ${role})`);

    const template = templates[templateKey];
    if (!template) {
      console.error(`[request-magic-link] Unknown template: ${templateKey}`);
      return res.status(500).json({ error: 'Email template not found' });
    }

    // -------------------------------------------------------------------------
    // STEP: Send email
    // -------------------------------------------------------------------------
    console.log(`[request-magic-link] Sending email for role: ${role}...`);

    const htmlWithSubstitutions = template.html
      .replace(/\{\{MAGIC_LINK\}\}/g, finalMagicLink)
      .replace(/\{\{UNSUBSCRIBE_URL\}\}/g, buildUnsubscribeUrl(waitlist?.unsubscribe_token));

    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: trimmedEmail,
        subject: template.subject,
        html: htmlWithSubstitutions,
      }),
    });

    if (!emailResponse.ok) {
      const errorText = await emailResponse.text();
      console.error(`[request-magic-link] Email sending failed: ${emailResponse.status}`, errorText);
      return res.status(500).json({ error: 'Email sending failed' });
    }

    const emailResult = await emailResponse.json();
    console.log(`[request-magic-link] Email sent successfully:`, emailResult);

    // -------------------------------------------------------------------------
    // STEP: Return success
    // -------------------------------------------------------------------------
    console.log(`[request-magic-link] ========== REQUEST SUCCESS ==========`);
    return res.status(200).json({ success: true });

  } catch (error: unknown) {
    console.error(`[request-magic-link] ========== REQUEST FAILED ==========`);
    console.error(`[request-magic-link] Error:`, error);

    if (error instanceof Error) {
      console.error(`[request-magic-link] Error stack:`, error.stack);
    }

    return res.status(500).json({ error: 'Internal server error' });
  }
}
