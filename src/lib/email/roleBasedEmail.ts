// ============================================================================
// LOREM CURAE - ROLE-BASED EMAIL SENDING
// ============================================================================

import { createClient } from "@supabase/supabase-js";
import { determineUserRole, UserRole, WaitlistRecord } from "../auth/roleAssignment";

// ----------------------------------------------------------------------------
// CONFIGURATION
// ----------------------------------------------------------------------------

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = "Lorem Curae <hello@loremcurae.com>";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ----------------------------------------------------------------------------
// EMAIL TEMPLATES
// ----------------------------------------------------------------------------

interface EmailTemplate {
  subject: string;
  html: string;
}

const templates: Record<string, EmailTemplate> = {
  // ---- Existing templates ----
  waitlist_signup: {
    subject: "You're on the Lorem Curae waitlist",
    html: `<p>Hi there,</p>
<p>Thanks for joining the Lorem Curae waitlist — your spot is saved.</p>
<p>We'll keep you updated as we roll out new features and open access to more users. When you're ready to sign in, just return to the waitlist page and request a secure magic link. We'll send it to your email instantly.</p>
<p>Thanks for being part of this journey.</p>
<p>— Ethan Jones<br/>Founder, Lorem Curae</p>`,
  },
  tester_creator_signup: {
    subject: "You're on the creator tester list",
    html: `<p>Hi there,</p>
<p>You're officially on the creator tester list for Lorem Curae.</p>
<p>When tester access opens, you'll be among the first creators to test our marketplace tools — product listings, creator dashboard, and early analytics. Your feedback will shape how we build for creators.</p>
<p>We'll notify you as soon as your access is ready.</p>
<p>— Ethan Jones<br/>Founder, Lorem Curae</p>`,
  },
  tester_creator_login: {
    subject: "Your creator tester access is now open",
    html: `<p>Hi there,</p>
<p>Great news — your creator tester access to Lorem Curae is now open.</p>
<p>You can sign in to access the creator dashboard, test product listings, and explore early marketplace tools. Your feedback helps us build better tools for creators.</p>
<p>Thanks for being part of this journey.</p>
<p>— Ethan Jones<br/>Founder, Lorem Curae</p>`,
  },
  tester_consumer_signup: {
    subject: "You're on the tester access list",
    html: `<p>Hi there,</p>
<p>You're officially on the tester access list for Lorem Curae.</p>
<p>When tester access opens, you'll be able to sign in by requesting a secure magic link from the waitlist page. That link will take you directly to the tester experience where you can test features and share feedback.</p>
<p>We'll notify you as soon as your access is ready.</p>
<p>— Ethan Jones<br/>Founder, Lorem Curae</p>`,
  },
  non_tester_login: {
    subject: "You're signed in — here's what that means",
    html: `<p>Hi there,</p>
<p>You just signed in using your secure magic link. This confirms your email and gives you access to your account.</p>
<p>Right now, your account is still on the waitlist, so you'll continue to see the waitlist page when you sign in. We'll notify you as soon as tester access opens for your account.</p>
<p>Thanks for your patience — we're building something special.</p>
<p>— Ethan Jones<br/>Founder, Lorem Curae</p>`,
  },
  tester_consumer_login: {
    subject: "Great news — your tester access is now open",
    html: `<p>Hi there,</p>
<p>Great news — your tester access to Lorem Curae is now open.</p>
<p>You can sign in using your email to access the tester experience and test features.</p>
<p>Thanks for being part of this journey.</p>
<p>— Ethan Jones<br/>Founder, Lorem Curae</p>`,
  },

  // ---- New templates: Founding Member ----
  founding_member_signup: {
    subject: "Welcome to Lorem Curae — you're a Founding Member",
    html: `<p>Hi there,</p>
<p>Welcome to Lorem Curae — you're officially a Founding Member.</p>
<p>This means you'll have priority access to every feature we build, starting from day one. No waiting, no waves — you're in.</p>
<p>When you're ready to sign in, just return to the waitlist page and request a secure magic link. We'll send it to your email instantly.</p>
<p>Thank you for believing in what we're building.</p>
<p>— Ethan Jones<br/>Founder, Lorem Curae</p>`,
  },
  founding_member_login: {
    subject: "Welcome back, Founding Member",
    html: `<p>Hi there,</p>
<p>You just signed in as a Founding Member.</p>
<p>You have full access to Lorem Curae — explore everything we've built and everything that's coming. Your feedback shapes what we build next.</p>
<p>Thanks for being here from the start.</p>
<p>— Ethan Jones<br/>Founder, Lorem Curae</p>`,
  },

  // ---- New templates: Creator Waves ----
  creator_c1_signup: {
    subject: "You're on the Lorem Curae creator waitlist — Wave C1",
    html: `<p>Hi there,</p>
<p>Thanks for joining the Lorem Curae creator waitlist — you're in Wave C1, our first group of creators.</p>
<p>As a C1 creator, you'll be among the first to access the marketplace: product listings, your creator dashboard, and the tools to share and monetize your work.</p>
<p>We're opening creator access soon, and you'll be first in line. When you're ready to sign in, just return to the waitlist page and request a secure magic link. We'll send it to your email instantly.</p>
<p>Thanks for being part of this journey from the start.</p>
<p>— Ethan Jones<br/>Founder, Lorem Curae</p>`,
  },
  creator_c1_login: {
    subject: "You're signed in — Wave C1 creator access is coming first",
    html: `<p>Hi there,</p>
<p>You just signed in using your secure magic link. This confirms your email and gives you access to your account.</p>
<p>As a C1 creator, you're first in line. When we open creator access, you'll unlock your creator dashboard, product listing tools, and the marketplace.</p>
<p>We're almost ready. Thanks for your patience.</p>
<p>— Ethan Jones<br/>Founder, Lorem Curae</p>`,
  },
  creator_c2_signup: {
    subject: "You're on the Lorem Curae creator waitlist — Wave C2",
    html: `<p>Hi there,</p>
<p>Thanks for joining the Lorem Curae creator waitlist — you're in Wave C2.</p>
<p>As a C2 creator, you'll unlock expanded marketplace tools: product analytics, promotional features, and new ways to grow your audience on Lorem Curae.</p>
<p>Your wave is coming up — we'll notify you when it's your turn. When you're ready to sign in, just return to the waitlist page and request a secure magic link. We'll send it to your email instantly.</p>
<p>Thanks for being part of this journey.</p>
<p>— Ethan Jones<br/>Founder, Lorem Curae</p>`,
  },
  creator_c2_login: {
    subject: "You're signed in — Wave C2 creator access is on the way",
    html: `<p>Hi there,</p>
<p>You just signed in using your secure magic link. This confirms your email and gives you access to your account.</p>
<p>As a C2 creator, you'll unlock expanded marketplace tools when your wave opens — product analytics, promotional features, and new ways to grow your audience.</p>
<p>Your wave is coming up. We'll notify you when it's your turn.</p>
<p>— Ethan Jones<br/>Founder, Lorem Curae</p>`,
  },
  creator_c3_signup: {
    subject: "You're on the Lorem Curae creator waitlist — Wave C3",
    html: `<p>Hi there,</p>
<p>Thanks for joining the Lorem Curae creator waitlist — you're in Wave C3.</p>
<p>As a C3 creator, you'll unlock our most advanced creator tools: AI-assisted product creation, formulation tools, patch testing workflows, and deep analytics to optimize your listings.</p>
<p>Your wave is coming up — we'll notify you when it's your turn. When you're ready to sign in, just return to the waitlist page and request a secure magic link. We'll send it to your email instantly.</p>
<p>Thanks for being part of this journey.</p>
<p>— Ethan Jones<br/>Founder, Lorem Curae</p>`,
  },
  creator_c3_login: {
    subject: "You're signed in — Wave C3 creator access is on the way",
    html: `<p>Hi there,</p>
<p>You just signed in using your secure magic link. This confirms your email and gives you access to your account.</p>
<p>As a C3 creator, you'll unlock advanced creator tools when your wave opens — AI-assisted product creation, formulation tools, patch testing workflows, and deep analytics.</p>
<p>Your wave is coming up. We'll notify you when it's your turn.</p>
<p>— Ethan Jones<br/>Founder, Lorem Curae</p>`,
  },

  // ---- New templates: Founding Member Creator ----
  founding_member_creator_signup: {
    subject: "Welcome to Lorem Curae — you're a Founding Creator",
    html: `<p>Hi there,</p>
<p>Welcome to Lorem Curae — you're officially a Founding Creator.</p>
<p>This means you'll have priority access to every creator tool we build, starting from day one. Your creator dashboard, product listings, analytics, AI tools — no waiting, no waves. You're in.</p>
<p>When you're ready to sign in, just return to the waitlist page and request a secure magic link. We'll send it to your email instantly.</p>
<p>Thank you for believing in what we're building.</p>
<p>— Ethan Jones<br/>Founder, Lorem Curae</p>`,
  },
  founding_member_creator_login: {
    subject: "Welcome back, Founding Creator",
    html: `<p>Hi there,</p>
<p>You just signed in as a Founding Creator.</p>
<p>You have full access to Lorem Curae's creator tools — your dashboard, product listings, analytics, and everything we're building for creators. Your feedback shapes what we build next.</p>
<p>Thanks for being here from the start.</p>
<p>— Ethan Jones<br/>Founder, Lorem Curae</p>`,
  },

  // ---- New templates: Founding Member Tester (Creator) ----
  founding_member_tester_creator_signup: {
    subject: "Welcome to Lorem Curae — you're a Founding Creator Tester",
    html: `<p>Hi there,</p>
<p>Welcome to Lorem Curae — you're officially a Founding Creator Tester.</p>
<p>This means you'll have priority access to test every creator tool we build, starting from day one. Your creator dashboard, product listings, analytics, AI tools — plus early access to experimental features before anyone else.</p>
<p>Your feedback as a tester will directly shape how we build for creators. When you're ready to sign in, just return to the waitlist page and request a secure magic link. We'll send it to your email instantly.</p>
<p>Thank you for believing in what we're building — and for helping us build it.</p>
<p>— Ethan Jones<br/>Founder, Lorem Curae</p>`,
  },
  founding_member_tester_creator_login: {
    subject: "Welcome back, Founding Creator Tester",
    html: `<p>Hi there,</p>
<p>You just signed in as a Founding Creator Tester.</p>
<p>You have full access to Lorem Curae's creator tools — your dashboard, product listings, analytics, and everything we're building. Plus, you'll see experimental features first and help us refine them.</p>
<p>Your feedback shapes what we build next. Thanks for being here from the start.</p>
<p>— Ethan Jones<br/>Founder, Lorem Curae</p>`,
  },

  // ---- New templates: Founding Member Tester (Consumer) ----
  founding_member_tester_consumer_signup: {
    subject: "Welcome to Lorem Curae — you're a Founding Member Tester",
    html: `<p>Hi there,</p>
<p>Welcome to Lorem Curae — you're officially a Founding Member Tester.</p>
<p>This means you'll have priority access to test every feature we build, starting from day one. No waiting, no waves — plus early access to experimental features before anyone else.</p>
<p>Your feedback as a tester will directly shape how we build Lorem Curae. When you're ready to sign in, just return to the waitlist page and request a secure magic link. We'll send it to your email instantly.</p>
<p>Thank you for believing in what we're building — and for helping us build it.</p>
<p>— Ethan Jones<br/>Founder, Lorem Curae</p>`,
  },
  founding_member_tester_consumer_login: {
    subject: "Welcome back, Founding Member Tester",
    html: `<p>Hi there,</p>
<p>You just signed in as a Founding Member Tester.</p>
<p>You have full access to Lorem Curae — explore everything we've built and everything that's coming. Plus, you'll see experimental features first and help us refine them.</p>
<p>Your feedback shapes what we build next. Thanks for being here from the start.</p>
<p>— Ethan Jones<br/>Founder, Lorem Curae</p>`,
  },

  // ---- New templates: Consumer Waves ----
  consumer_wave_1_signup: {
    subject: "You're on the Lorem Curae waitlist — Wave 1",
    html: `<p>Hi there,</p>
<p>Thanks for joining the Lorem Curae waitlist — you're in Wave 1, our very first group of users.</p>
<p>As a Wave 1 member, you'll be among the first to access the foundation of Lorem Curae: core discovery tools, personalized feeds, and the essentials we're building everything else on top of.</p>
<p>We're opening access soon, and you'll be first in line. When you're ready to sign in, just return to the waitlist page and request a secure magic link. We'll send it to your email instantly.</p>
<p>Thanks for being part of this journey from the very beginning.</p>
<p>— Ethan Jones<br/>Founder, Lorem Curae</p>`,
  },
  consumer_wave_1_login: {
    subject: "You're signed in — Wave 1 access is coming first",
    html: `<p>Hi there,</p>
<p>You just signed in using your secure magic link. This confirms your email and gives you access to your account.</p>
<p>As a Wave 1 member, you're first in line. When we open access, you'll unlock the foundation of Lorem Curae — core discovery, personalized feeds, and the tools everything else builds on.</p>
<p>We're almost ready. Thanks for your patience.</p>
<p>— Ethan Jones<br/>Founder, Lorem Curae</p>`,
  },
  consumer_wave_2_signup: {
    subject: "You're on the Lorem Curae waitlist — Wave 2",
    html: `<p>Hi there,</p>
<p>Thanks for joining the Lorem Curae waitlist — you're in Wave 2.</p>
<p>As a Wave 2 member, you'll unlock our engagement features: community interactions, saved collections, and tools that make Lorem Curae feel like more than just browsing.</p>
<p>We're opening access in waves, and yours is coming soon. When you're ready to sign in, just return to the waitlist page and request a secure magic link. We'll send it to your email instantly.</p>
<p>Thanks for being part of this journey.</p>
<p>— Ethan Jones<br/>Founder, Lorem Curae</p>`,
  },
  consumer_wave_2_login: {
    subject: "You're signed in — Wave 2 access is coming soon",
    html: `<p>Hi there,</p>
<p>You just signed in using your secure magic link. This confirms your email and gives you access to your account.</p>
<p>As a Wave 2 member, you'll unlock engagement features when your wave opens — community interactions, saved collections, and the tools that bring Lorem Curae to life.</p>
<p>Your wave is coming soon. We'll notify you the moment it's ready.</p>
<p>— Ethan Jones<br/>Founder, Lorem Curae</p>`,
  },
  consumer_wave_3_signup: {
    subject: "You're on the Lorem Curae waitlist — Wave 3",
    html: `<p>Hi there,</p>
<p>Thanks for joining the Lorem Curae waitlist — you're in Wave 3.</p>
<p>As a Wave 3 member, you'll unlock our growth features: sharing tools, invite capabilities, and expanded ways to discover content you'll love.</p>
<p>Your wave is coming up — we'll notify you when it's your turn. When you're ready to sign in, just return to the waitlist page and request a secure magic link. We'll send it to your email instantly.</p>
<p>Thanks for being part of this journey.</p>
<p>— Ethan Jones<br/>Founder, Lorem Curae</p>`,
  },
  consumer_wave_3_login: {
    subject: "You're signed in — Wave 3 access is on the way",
    html: `<p>Hi there,</p>
<p>You just signed in using your secure magic link. This confirms your email and gives you access to your account.</p>
<p>As a Wave 3 member, you'll unlock growth features when your wave opens — sharing tools, invite capabilities, and expanded ways to discover content.</p>
<p>Your wave is coming up. We'll notify you when it's your turn.</p>
<p>— Ethan Jones<br/>Founder, Lorem Curae</p>`,
  },
  consumer_wave_4_signup: {
    subject: "You're on the Lorem Curae waitlist — Wave 4",
    html: `<p>Hi there,</p>
<p>Thanks for joining the Lorem Curae waitlist — you're in Wave 4.</p>
<p>As a Wave 4 member, you'll unlock our marketplace features: secure transactions, verified profiles, and the ability to purchase content you believe in.</p>
<p>Your wave is coming up — we'll notify you when it's your turn. When you're ready to sign in, just return to the waitlist page and request a secure magic link. We'll send it to your email instantly.</p>
<p>Thanks for being part of this journey.</p>
<p>— Ethan Jones<br/>Founder, Lorem Curae</p>`,
  },
  consumer_wave_4_login: {
    subject: "You're signed in — Wave 4 access is on the way",
    html: `<p>Hi there,</p>
<p>You just signed in using your secure magic link. This confirms your email and gives you access to your account.</p>
<p>As a Wave 4 member, you'll unlock marketplace features when your wave opens — secure transactions, verified profiles, and new ways to access premium content.</p>
<p>Your wave is coming up. We'll notify you when it's your turn.</p>
<p>— Ethan Jones<br/>Founder, Lorem Curae</p>`,
  },
  consumer_wave_5_signup: {
    subject: "You're on the Lorem Curae waitlist — Wave 5",
    html: `<p>Hi there,</p>
<p>Thanks for joining the Lorem Curae waitlist — you're in Wave 5.</p>
<p>As a Wave 5 member, you'll unlock our intelligence features: smart recommendations, personalized discovery, and AI-powered tools that learn what you love.</p>
<p>We're building toward your wave — stay tuned. When you're ready to sign in, just return to the waitlist page and request a secure magic link. We'll send it to your email instantly.</p>
<p>Thanks for being part of this journey.</p>
<p>— Ethan Jones<br/>Founder, Lorem Curae</p>`,
  },
  consumer_wave_5_login: {
    subject: "You're signed in — Wave 5 access is ahead",
    html: `<p>Hi there,</p>
<p>You just signed in using your secure magic link. This confirms your email and gives you access to your account.</p>
<p>As a Wave 5 member, you'll unlock intelligence features when your wave opens — smart recommendations, personalized discovery, and AI-powered tools tailored to you.</p>
<p>We're building toward your wave. Stay tuned — we'll notify you when it's ready.</p>
<p>— Ethan Jones<br/>Founder, Lorem Curae</p>`,
  },
  consumer_wave_6_signup: {
    subject: "You're on the Lorem Curae waitlist — Wave 6",
    html: `<p>Hi there,</p>
<p>Thanks for joining the Lorem Curae waitlist — you're in Wave 6.</p>
<p>As a Wave 6 member, you'll unlock our expansion features: new content categories, broader marketplace offerings, and a more complete Lorem Curae experience.</p>
<p>We're building toward your wave — stay tuned. When you're ready to sign in, just return to the waitlist page and request a secure magic link. We'll send it to your email instantly.</p>
<p>Thanks for being part of this journey.</p>
<p>— Ethan Jones<br/>Founder, Lorem Curae</p>`,
  },
  consumer_wave_6_login: {
    subject: "You're signed in — Wave 6 access is ahead",
    html: `<p>Hi there,</p>
<p>You just signed in using your secure magic link. This confirms your email and gives you access to your account.</p>
<p>As a Wave 6 member, you'll unlock expansion features when your wave opens — new content categories, broader marketplace offerings, and a more complete experience.</p>
<p>We're building toward your wave. Stay tuned — we'll notify you when it's ready.</p>
<p>— Ethan Jones<br/>Founder, Lorem Curae</p>`,
  },
  consumer_wave_7_signup: {
    subject: "You're on the Lorem Curae waitlist — Wave 7",
    html: `<p>Hi there,</p>
<p>Thanks for joining the Lorem Curae waitlist — you're in Wave 7.</p>
<p>As a Wave 7 member, you'll unlock our immersive features: augmented reality previews, interactive product exploration, and new ways to understand what fits your needs.</p>
<p>Your wave is coming up — we'll notify you when it's your turn. When you're ready to sign in, just return to the waitlist page and request a secure magic link. We'll send it to your email instantly.</p>
<p>Thanks for being part of this journey.</p>
<p>— Ethan Jones<br/>Founder, Lorem Curae</p>`,
  },
  consumer_wave_7_login: {
    subject: "You're signed in — Wave 7 access is on the way",
    html: `<p>Hi there,</p>
<p>You just signed in using your secure magic link. This confirms your email and gives you access to your account.</p>
<p>As a Wave 7 member, you'll unlock immersive features when your wave opens — augmented reality previews, interactive product exploration, and new ways to understand what fits your needs.</p>
<p>Your wave is coming up. We'll notify you when it's your turn.</p>
<p>— Ethan Jones<br/>Founder, Lorem Curae</p>`,
  },
};

// ----------------------------------------------------------------------------
// ROLE-TO-TEMPLATE MAPPINGS
// ----------------------------------------------------------------------------

const waitlistSignupTemplates: Record<UserRole, string> = {
  founding_member: "founding_member_signup",
  tester_creator: "tester_creator_signup",
  tester_consumer: "tester_consumer_signup",
  creator_c1: "creator_c1_signup",
  creator_c2: "creator_c2_signup",
  creator_c3: "creator_c3_signup",
  consumer_wave_1: "consumer_wave_1_signup",
  consumer_wave_2: "consumer_wave_2_signup",
  consumer_wave_3: "consumer_wave_3_signup",
  consumer_wave_4: "consumer_wave_4_signup",
  consumer_wave_5: "consumer_wave_5_signup",
  consumer_wave_6: "consumer_wave_6_signup",
  consumer_wave_7: "consumer_wave_7_signup",
  user: "waitlist_signup",
};

const magicLinkTemplates: Record<UserRole, string> = {
  founding_member: "founding_member_login",
  tester_creator: "tester_creator_login",
  tester_consumer: "tester_consumer_login",
  creator_c1: "creator_c1_login",
  creator_c2: "creator_c2_login",
  creator_c3: "creator_c3_login",
  consumer_wave_1: "consumer_wave_1_login",
  consumer_wave_2: "consumer_wave_2_login",
  consumer_wave_3: "consumer_wave_3_login",
  consumer_wave_4: "consumer_wave_4_login",
  consumer_wave_5: "consumer_wave_5_login",
  consumer_wave_6: "consumer_wave_6_login",
  consumer_wave_7: "consumer_wave_7_login",
  user: "non_tester_login",
};

// ----------------------------------------------------------------------------
// HELPER FUNCTIONS
// ----------------------------------------------------------------------------

async function sendEmail(to: string, templateKey: string): Promise<void> {
  const template = templates[templateKey];
  if (!template) {
    throw new Error(`Unknown template: ${templateKey}`);
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: FROM_EMAIL,
      to,
      subject: template.subject,
      html: template.html,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to send email: ${response.statusText}`);
  }
}

async function fetchWaitlistRecord(email: string): Promise<WaitlistRecord | null> {
  const { data } = await supabase
    .from("waitlist")
    .select(
      "wants_tester_access, is_creator, wave_number, creator_wave_number, is_founding_member"
    )
    .eq("email", email)
    .maybeSingle();

  return data;
}

// ----------------------------------------------------------------------------
// PUBLIC API
// ----------------------------------------------------------------------------

export async function sendWaitlistSignupEmail(email: string): Promise<void> {
  const waitlist = await fetchWaitlistRecord(email);

  if (!waitlist) {
    await sendEmail(email, "waitlist_signup");
    return;
  }

  const role = determineUserRole(waitlist);

  // Founding members have special handling based on tester status and creator status
  if (role === "founding_member") {
    if (waitlist.wants_tester_access && waitlist.is_creator) {
      await sendEmail(email, "founding_member_tester_creator_signup");
      return;
    }
    if (waitlist.wants_tester_access && !waitlist.is_creator) {
      await sendEmail(email, "founding_member_tester_consumer_signup");
      return;
    }
    if (waitlist.is_creator) {
      await sendEmail(email, "founding_member_creator_signup");
      return;
    }
  }

  const templateKey = waitlistSignupTemplates[role];
  await sendEmail(email, templateKey);
}

export async function sendMagicLinkEmail(email: string): Promise<void> {
  const waitlist = await fetchWaitlistRecord(email);

  if (!waitlist) {
    await sendEmail(email, "non_tester_login");
    return;
  }

  const role = determineUserRole(waitlist);

  // Founding members have special handling based on tester status and creator status
  if (role === "founding_member") {
    if (waitlist.wants_tester_access && waitlist.is_creator) {
      await sendEmail(email, "founding_member_tester_creator_login");
      return;
    }
    if (waitlist.wants_tester_access && !waitlist.is_creator) {
      await sendEmail(email, "founding_member_tester_consumer_login");
      return;
    }
    if (waitlist.is_creator) {
      await sendEmail(email, "founding_member_creator_login");
      return;
    }
  }

  const templateKey = magicLinkTemplates[role];
  await sendEmail(email, templateKey);
}
