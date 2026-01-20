import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// ----------------------------------------------------------------------------
// CONFIGURATION
// ----------------------------------------------------------------------------

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = 'Lorem Curae <hello@loremcurae.com>';
const REDIRECT_URL = 'https://lorem-curae-waitlist.vercel.app/auth/callback';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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
  wants_tester_access: boolean;
  is_creator: boolean;
  wave_number: number | null;
  creator_wave_number: number | null;
  is_founding_member: boolean;
}

interface EmailTemplate {
  subject: string;
  html: string;
}

// ----------------------------------------------------------------------------
// EMAIL TEMPLATES (with {{MAGIC_LINK}} placeholder)
// ----------------------------------------------------------------------------

const templates: Record<string, EmailTemplate> = {
  // ---- Default/Fallback ----
  waitlist_signup: {
    subject: "You're on the Lorem Curae waitlist",
    html: `<p>Hi there,</p>
<p>Thanks for joining the Lorem Curae waitlist — your spot is saved.</p>
<p>We'll keep you updated as we roll out new features and open access to more users.</p>
<p><strong><a href="{{MAGIC_LINK}}">Click here to sign in securely</a></strong></p>
<p>Thanks for being part of this journey.</p>
<p>— Ethan Jones<br/>Founder, Lorem Curae</p>`,
  },
  non_tester_login: {
    subject: "Your secure sign-in link",
    html: `<p>Hi there,</p>
<p>Here's your secure magic link to sign in to Lorem Curae.</p>
<p><strong><a href="{{MAGIC_LINK}}">Click here to sign in</a></strong></p>
<p>Right now, your account is still on the waitlist, so you'll continue to see the waitlist page when you sign in. We'll notify you as soon as access opens for your account.</p>
<p>Thanks for your patience — we're building something special.</p>
<p>— Ethan Jones<br/>Founder, Lorem Curae</p>`,
  },

  // ---- Tester Creator ----
  tester_creator_signup: {
    subject: "You're on the creator tester list",
    html: `<p>Hi there,</p>
<p>You're officially on the creator tester list for Lorem Curae.</p>
<p>When tester access opens, you'll be among the first creators to test our marketplace tools — product listings, creator dashboard, and early analytics. Your feedback will shape how we build for creators.</p>
<p><strong><a href="{{MAGIC_LINK}}">Click here to sign in securely</a></strong></p>
<p>We'll notify you as soon as your access is ready.</p>
<p>— Ethan Jones<br/>Founder, Lorem Curae</p>`,
  },
  tester_creator_login: {
    subject: "Your secure sign-in link — Creator Tester",
    html: `<p>Hi there,</p>
<p>Here's your secure magic link to sign in to Lorem Curae.</p>
<p><strong><a href="{{MAGIC_LINK}}">Click here to sign in</a></strong></p>
<p>As a creator tester, you have access to the creator dashboard, product listings, and early marketplace tools. Your feedback helps us build better tools for creators.</p>
<p>Thanks for being part of this journey.</p>
<p>— Ethan Jones<br/>Founder, Lorem Curae</p>`,
  },

  // ---- Tester Consumer ----
  tester_consumer_signup: {
    subject: "You're on the tester access list",
    html: `<p>Hi there,</p>
<p>You're officially on the tester access list for Lorem Curae.</p>
<p>When tester access opens, you'll be able to test features and share feedback.</p>
<p><strong><a href="{{MAGIC_LINK}}">Click here to sign in securely</a></strong></p>
<p>We'll notify you as soon as your access is ready.</p>
<p>— Ethan Jones<br/>Founder, Lorem Curae</p>`,
  },
  tester_consumer_login: {
    subject: "Your secure sign-in link — Tester Access",
    html: `<p>Hi there,</p>
<p>Here's your secure magic link to sign in to Lorem Curae.</p>
<p><strong><a href="{{MAGIC_LINK}}">Click here to sign in</a></strong></p>
<p>As a tester, you have access to test features and share feedback.</p>
<p>Thanks for being part of this journey.</p>
<p>— Ethan Jones<br/>Founder, Lorem Curae</p>`,
  },

  // ---- Founding Member ----
  founding_member_signup: {
    subject: "Welcome to Lorem Curae — you're a Founding Member",
    html: `<p>Hi there,</p>
<p>Welcome to Lorem Curae — you're officially a Founding Member.</p>
<p>This means you'll have priority access to every feature we build, starting from day one. No waiting, no waves — you're in.</p>
<p><strong><a href="{{MAGIC_LINK}}">Click here to sign in securely</a></strong></p>
<p>Thank you for believing in what we're building.</p>
<p>— Ethan Jones<br/>Founder, Lorem Curae</p>`,
  },
  founding_member_login: {
    subject: "Your secure sign-in link — Founding Member",
    html: `<p>Hi there,</p>
<p>Here's your secure magic link to sign in to Lorem Curae.</p>
<p><strong><a href="{{MAGIC_LINK}}">Click here to sign in</a></strong></p>
<p>As a Founding Member, you have full access to Lorem Curae — explore everything we've built and everything that's coming.</p>
<p>Thanks for being here from the start.</p>
<p>— Ethan Jones<br/>Founder, Lorem Curae</p>`,
  },

  // ---- Founding Member Creator ----
  founding_member_creator_signup: {
    subject: "Welcome to Lorem Curae — you're a Founding Creator",
    html: `<p>Hi there,</p>
<p>Welcome to Lorem Curae — you're officially a Founding Creator.</p>
<p>This means you'll have priority access to every creator tool we build, starting from day one. Your creator dashboard, product listings, analytics, AI tools — no waiting, no waves. You're in.</p>
<p><strong><a href="{{MAGIC_LINK}}">Click here to sign in securely</a></strong></p>
<p>Thank you for believing in what we're building.</p>
<p>— Ethan Jones<br/>Founder, Lorem Curae</p>`,
  },
  founding_member_creator_login: {
    subject: "Your secure sign-in link — Founding Creator",
    html: `<p>Hi there,</p>
<p>Here's your secure magic link to sign in to Lorem Curae.</p>
<p><strong><a href="{{MAGIC_LINK}}">Click here to sign in</a></strong></p>
<p>As a Founding Creator, you have full access to Lorem Curae's creator tools — your dashboard, product listings, analytics, and everything we're building for creators.</p>
<p>Thanks for being here from the start.</p>
<p>— Ethan Jones<br/>Founder, Lorem Curae</p>`,
  },

  // ---- Founding Member Tester Creator ----
  founding_member_tester_creator_signup: {
    subject: "Welcome to Lorem Curae — you're a Founding Creator Tester",
    html: `<p>Hi there,</p>
<p>Welcome to Lorem Curae — you're officially a Founding Creator Tester.</p>
<p>This means you'll have priority access to test every creator tool we build, starting from day one. Plus early access to experimental features before anyone else.</p>
<p><strong><a href="{{MAGIC_LINK}}">Click here to sign in securely</a></strong></p>
<p>Thank you for believing in what we're building — and for helping us build it.</p>
<p>— Ethan Jones<br/>Founder, Lorem Curae</p>`,
  },
  founding_member_tester_creator_login: {
    subject: "Your secure sign-in link — Founding Creator Tester",
    html: `<p>Hi there,</p>
<p>Here's your secure magic link to sign in to Lorem Curae.</p>
<p><strong><a href="{{MAGIC_LINK}}">Click here to sign in</a></strong></p>
<p>As a Founding Creator Tester, you have full access plus experimental features first.</p>
<p>Thanks for being here from the start.</p>
<p>— Ethan Jones<br/>Founder, Lorem Curae</p>`,
  },

  // ---- Founding Member Tester Consumer ----
  founding_member_tester_consumer_signup: {
    subject: "Welcome to Lorem Curae — you're a Founding Member Tester",
    html: `<p>Hi there,</p>
<p>Welcome to Lorem Curae — you're officially a Founding Member Tester.</p>
<p>This means you'll have priority access to test every feature we build, starting from day one. Plus early access to experimental features before anyone else.</p>
<p><strong><a href="{{MAGIC_LINK}}">Click here to sign in securely</a></strong></p>
<p>Thank you for believing in what we're building — and for helping us build it.</p>
<p>— Ethan Jones<br/>Founder, Lorem Curae</p>`,
  },
  founding_member_tester_consumer_login: {
    subject: "Your secure sign-in link — Founding Member Tester",
    html: `<p>Hi there,</p>
<p>Here's your secure magic link to sign in to Lorem Curae.</p>
<p><strong><a href="{{MAGIC_LINK}}">Click here to sign in</a></strong></p>
<p>As a Founding Member Tester, you have full access plus experimental features first.</p>
<p>Thanks for being here from the start.</p>
<p>— Ethan Jones<br/>Founder, Lorem Curae</p>`,
  },

  // ---- Creator Waves ----
  creator_c1_signup: {
    subject: "You're on the Lorem Curae creator waitlist — Wave C1",
    html: `<p>Hi there,</p>
<p>Thanks for joining the Lorem Curae creator waitlist — you're in Wave C1, our first group of creators.</p>
<p>As a C1 creator, you'll be among the first to access the marketplace: product listings, your creator dashboard, and the tools to share and monetize your work.</p>
<p><strong><a href="{{MAGIC_LINK}}">Click here to sign in securely</a></strong></p>
<p>Thanks for being part of this journey from the start.</p>
<p>— Ethan Jones<br/>Founder, Lorem Curae</p>`,
  },
  creator_c1_login: {
    subject: "Your secure sign-in link — Wave C1 Creator",
    html: `<p>Hi there,</p>
<p>Here's your secure magic link to sign in to Lorem Curae.</p>
<p><strong><a href="{{MAGIC_LINK}}">Click here to sign in</a></strong></p>
<p>As a C1 creator, you're first in line. When we open creator access, you'll unlock your creator dashboard, product listing tools, and the marketplace.</p>
<p>— Ethan Jones<br/>Founder, Lorem Curae</p>`,
  },
  creator_c2_signup: {
    subject: "You're on the Lorem Curae creator waitlist — Wave C2",
    html: `<p>Hi there,</p>
<p>Thanks for joining the Lorem Curae creator waitlist — you're in Wave C2.</p>
<p>As a C2 creator, you'll unlock expanded marketplace tools: product analytics, promotional features, and new ways to grow your audience on Lorem Curae.</p>
<p><strong><a href="{{MAGIC_LINK}}">Click here to sign in securely</a></strong></p>
<p>Thanks for being part of this journey.</p>
<p>— Ethan Jones<br/>Founder, Lorem Curae</p>`,
  },
  creator_c2_login: {
    subject: "Your secure sign-in link — Wave C2 Creator",
    html: `<p>Hi there,</p>
<p>Here's your secure magic link to sign in to Lorem Curae.</p>
<p><strong><a href="{{MAGIC_LINK}}">Click here to sign in</a></strong></p>
<p>As a C2 creator, you'll unlock expanded marketplace tools when your wave opens.</p>
<p>— Ethan Jones<br/>Founder, Lorem Curae</p>`,
  },
  creator_c3_signup: {
    subject: "You're on the Lorem Curae creator waitlist — Wave C3",
    html: `<p>Hi there,</p>
<p>Thanks for joining the Lorem Curae creator waitlist — you're in Wave C3.</p>
<p>As a C3 creator, you'll unlock our most advanced creator tools: AI-assisted product creation, formulation tools, patch testing workflows, and deep analytics.</p>
<p><strong><a href="{{MAGIC_LINK}}">Click here to sign in securely</a></strong></p>
<p>Thanks for being part of this journey.</p>
<p>— Ethan Jones<br/>Founder, Lorem Curae</p>`,
  },
  creator_c3_login: {
    subject: "Your secure sign-in link — Wave C3 Creator",
    html: `<p>Hi there,</p>
<p>Here's your secure magic link to sign in to Lorem Curae.</p>
<p><strong><a href="{{MAGIC_LINK}}">Click here to sign in</a></strong></p>
<p>As a C3 creator, you'll unlock advanced creator tools when your wave opens.</p>
<p>— Ethan Jones<br/>Founder, Lorem Curae</p>`,
  },

  // ---- Consumer Waves 1-7 ----
  consumer_wave_1_signup: {
    subject: "You're on the Lorem Curae waitlist — Wave 1",
    html: `<p>Hi there,</p>
<p>Thanks for joining the Lorem Curae waitlist — you're in Wave 1, our very first group of users.</p>
<p>As a Wave 1 member, you'll be among the first to access the foundation of Lorem Curae: core discovery tools, personalized feeds, and the essentials we're building everything else on top of.</p>
<p><strong><a href="{{MAGIC_LINK}}">Click here to sign in securely</a></strong></p>
<p>Thanks for being part of this journey from the very beginning.</p>
<p>— Ethan Jones<br/>Founder, Lorem Curae</p>`,
  },
  consumer_wave_1_login: {
    subject: "Your secure sign-in link — Wave 1",
    html: `<p>Hi there,</p>
<p>Here's your secure magic link to sign in to Lorem Curae.</p>
<p><strong><a href="{{MAGIC_LINK}}">Click here to sign in</a></strong></p>
<p>As a Wave 1 member, you're first in line for access.</p>
<p>— Ethan Jones<br/>Founder, Lorem Curae</p>`,
  },
  consumer_wave_2_signup: {
    subject: "You're on the Lorem Curae waitlist — Wave 2",
    html: `<p>Hi there,</p>
<p>Thanks for joining the Lorem Curae waitlist — you're in Wave 2.</p>
<p>As a Wave 2 member, you'll unlock our engagement features: community interactions, saved collections, and tools that make Lorem Curae feel like more than just browsing.</p>
<p><strong><a href="{{MAGIC_LINK}}">Click here to sign in securely</a></strong></p>
<p>Thanks for being part of this journey.</p>
<p>— Ethan Jones<br/>Founder, Lorem Curae</p>`,
  },
  consumer_wave_2_login: {
    subject: "Your secure sign-in link — Wave 2",
    html: `<p>Hi there,</p>
<p>Here's your secure magic link to sign in to Lorem Curae.</p>
<p><strong><a href="{{MAGIC_LINK}}">Click here to sign in</a></strong></p>
<p>As a Wave 2 member, you'll unlock engagement features when your wave opens.</p>
<p>— Ethan Jones<br/>Founder, Lorem Curae</p>`,
  },
  consumer_wave_3_signup: {
    subject: "You're on the Lorem Curae waitlist — Wave 3",
    html: `<p>Hi there,</p>
<p>Thanks for joining the Lorem Curae waitlist — you're in Wave 3.</p>
<p>As a Wave 3 member, you'll unlock our growth features: sharing tools, invite capabilities, and expanded ways to discover content you'll love.</p>
<p><strong><a href="{{MAGIC_LINK}}">Click here to sign in securely</a></strong></p>
<p>Thanks for being part of this journey.</p>
<p>— Ethan Jones<br/>Founder, Lorem Curae</p>`,
  },
  consumer_wave_3_login: {
    subject: "Your secure sign-in link — Wave 3",
    html: `<p>Hi there,</p>
<p>Here's your secure magic link to sign in to Lorem Curae.</p>
<p><strong><a href="{{MAGIC_LINK}}">Click here to sign in</a></strong></p>
<p>As a Wave 3 member, you'll unlock growth features when your wave opens.</p>
<p>— Ethan Jones<br/>Founder, Lorem Curae</p>`,
  },
  consumer_wave_4_signup: {
    subject: "You're on the Lorem Curae waitlist — Wave 4",
    html: `<p>Hi there,</p>
<p>Thanks for joining the Lorem Curae waitlist — you're in Wave 4.</p>
<p>As a Wave 4 member, you'll unlock our marketplace features: secure transactions, verified profiles, and the ability to purchase content you believe in.</p>
<p><strong><a href="{{MAGIC_LINK}}">Click here to sign in securely</a></strong></p>
<p>Thanks for being part of this journey.</p>
<p>— Ethan Jones<br/>Founder, Lorem Curae</p>`,
  },
  consumer_wave_4_login: {
    subject: "Your secure sign-in link — Wave 4",
    html: `<p>Hi there,</p>
<p>Here's your secure magic link to sign in to Lorem Curae.</p>
<p><strong><a href="{{MAGIC_LINK}}">Click here to sign in</a></strong></p>
<p>As a Wave 4 member, you'll unlock marketplace features when your wave opens.</p>
<p>— Ethan Jones<br/>Founder, Lorem Curae</p>`,
  },
  consumer_wave_5_signup: {
    subject: "You're on the Lorem Curae waitlist — Wave 5",
    html: `<p>Hi there,</p>
<p>Thanks for joining the Lorem Curae waitlist — you're in Wave 5.</p>
<p>As a Wave 5 member, you'll unlock our intelligence features: smart recommendations, personalized discovery, and AI-powered tools that learn what you love.</p>
<p><strong><a href="{{MAGIC_LINK}}">Click here to sign in securely</a></strong></p>
<p>Thanks for being part of this journey.</p>
<p>— Ethan Jones<br/>Founder, Lorem Curae</p>`,
  },
  consumer_wave_5_login: {
    subject: "Your secure sign-in link — Wave 5",
    html: `<p>Hi there,</p>
<p>Here's your secure magic link to sign in to Lorem Curae.</p>
<p><strong><a href="{{MAGIC_LINK}}">Click here to sign in</a></strong></p>
<p>As a Wave 5 member, you'll unlock intelligence features when your wave opens.</p>
<p>— Ethan Jones<br/>Founder, Lorem Curae</p>`,
  },
  consumer_wave_6_signup: {
    subject: "You're on the Lorem Curae waitlist — Wave 6",
    html: `<p>Hi there,</p>
<p>Thanks for joining the Lorem Curae waitlist — you're in Wave 6.</p>
<p>As a Wave 6 member, you'll unlock our expansion features: new content categories, broader marketplace offerings, and a more complete Lorem Curae experience.</p>
<p><strong><a href="{{MAGIC_LINK}}">Click here to sign in securely</a></strong></p>
<p>Thanks for being part of this journey.</p>
<p>— Ethan Jones<br/>Founder, Lorem Curae</p>`,
  },
  consumer_wave_6_login: {
    subject: "Your secure sign-in link — Wave 6",
    html: `<p>Hi there,</p>
<p>Here's your secure magic link to sign in to Lorem Curae.</p>
<p><strong><a href="{{MAGIC_LINK}}">Click here to sign in</a></strong></p>
<p>As a Wave 6 member, you'll unlock expansion features when your wave opens.</p>
<p>— Ethan Jones<br/>Founder, Lorem Curae</p>`,
  },
  consumer_wave_7_signup: {
    subject: "You're on the Lorem Curae waitlist — Wave 7",
    html: `<p>Hi there,</p>
<p>Thanks for joining the Lorem Curae waitlist — you're in Wave 7.</p>
<p>As a Wave 7 member, you'll unlock our immersive features: augmented reality previews, interactive product exploration, and new ways to understand what fits your needs.</p>
<p><strong><a href="{{MAGIC_LINK}}">Click here to sign in securely</a></strong></p>
<p>Thanks for being part of this journey.</p>
<p>— Ethan Jones<br/>Founder, Lorem Curae</p>`,
  },
  consumer_wave_7_login: {
    subject: "Your secure sign-in link — Wave 7",
    html: `<p>Hi there,</p>
<p>Here's your secure magic link to sign in to Lorem Curae.</p>
<p><strong><a href="{{MAGIC_LINK}}">Click here to sign in</a></strong></p>
<p>As a Wave 7 member, you'll unlock immersive features when your wave opens.</p>
<p>— Ethan Jones<br/>Founder, Lorem Curae</p>`,
  },
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

async function fetchWaitlistRecord(email: string): Promise<WaitlistRecord | null> {
  const { data } = await supabase
    .from('waitlist')
    .select('wants_tester_access, is_creator, wave_number, creator_wave_number, is_founding_member')
    .eq('email', email)
    .maybeSingle();
  return data;
}

async function generateMagicLink(email: string): Promise<string> {
  console.log(`[MagicLink] Generating link for: ${email}`);

  const { data, error } = await supabase.auth.admin.generateLink({
    type: 'magiclink',
    email,
    options: {
      redirectTo: REDIRECT_URL,
    },
  });

  if (error) {
    console.error(`[MagicLink] Error generating link:`, error);
    throw error;
  }

  const magicLink = data.properties.action_link;
  console.log(`[MagicLink] Generated link: ${magicLink.substring(0, 50)}...`);

  return magicLink;
}

async function sendEmailWithMagicLink(
  to: string,
  templateKey: string,
  magicLink: string,
  role: UserRole
): Promise<void> {
  const template = templates[templateKey];
  if (!template) {
    throw new Error(`Unknown template: ${templateKey}`);
  }

  console.log(`[MagicLink] Sending custom email for role: ${role}, template: ${templateKey}`);

  const htmlWithLink = template.html.replace(/\{\{MAGIC_LINK\}\}/g, magicLink);

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: FROM_EMAIL,
      to,
      subject: template.subject,
      html: htmlWithLink,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[MagicLink] Failed to send email: ${response.statusText}`, errorText);
    throw new Error(`Failed to send email: ${response.statusText}`);
  }

  console.log(`[MagicLink] Email sent successfully to ${to}`);
}

// ----------------------------------------------------------------------------
// API HANDLER
// ----------------------------------------------------------------------------

export default async function handler(req: VercelRequest, res: VercelResponse) {
  console.log(`[request-magic-link] Received ${req.method} request`);

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, type } = req.body;
  console.log(`[request-magic-link] Request body:`, { email, type });

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  if (!type || !['signup', 'login'].includes(type)) {
    return res.status(400).json({ error: 'Type must be "signup" or "login"' });
  }

  const trimmedEmail = email.trim().toLowerCase();

  try {
    // For login, check if user is on waitlist first
    if (type === 'login') {
      const waitlist = await fetchWaitlistRecord(trimmedEmail);
      if (!waitlist) {
        console.log(`[request-magic-link] Email not on waitlist: ${trimmedEmail}`);
        return res.status(404).json({ error: 'not-on-waitlist' });
      }
    }

    // Generate magic link
    const magicLink = await generateMagicLink(trimmedEmail);

    // Fetch waitlist record for role determination
    const waitlist = await fetchWaitlistRecord(trimmedEmail);
    const role = waitlist ? determineUserRole(waitlist) : 'user';
    console.log(`[request-magic-link] Determined role: ${role}`);

    // Get appropriate template
    const templateKey = getTemplateKey(role, type, waitlist);
    console.log(`[request-magic-link] Using template: ${templateKey}`);

    // Send email with magic link
    await sendEmailWithMagicLink(trimmedEmail, templateKey, magicLink, role);

    console.log(`[request-magic-link] Successfully processed ${type} request for ${trimmedEmail}`);
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('[request-magic-link] Error:', error);
    return res.status(500).json({ error: 'Failed to process request' });
  }
}
