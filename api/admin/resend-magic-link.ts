import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// ============================================================================
// POST /api/admin/resend-magic-link
// ============================================================================
//
// Manually resends a magic-link login email to a waitlist user.
// This is an admin-only endpoint.
//
// Headers:
//   Authorization: Bearer <ADMIN_SECRET>
//
// Body:
//   { email: string }
//
// Response:
//   { sent: true, email: string }
//
// Environment variables required:
//   - ADMIN_SECRET
//   - SUPABASE_URL
//   - SUPABASE_SERVICE_ROLE_KEY
//   - RESEND_API_KEY
//
// ============================================================================

const FROM_EMAIL = 'Lorem Curae <hello@loremcurae.com>';
const REDIRECT_URL = 'https://lorem-curae-waitlist.vercel.app/auth/callback';

const EMAIL_TEMPLATE = {
  subject: 'Your secure sign-in link',
  html: `<p>Hi there,</p>
<p>Here's your secure magic link to sign in to Lorem Curae.</p>
<p><strong><a href="{{MAGIC_LINK}}">Click here to sign in</a></strong></p>
<p>This link was sent by our support team. If you didn't request this, you can safely ignore this email.</p>
<p>— The Lorem Curae Team</p>`,
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // -------------------------------------------------------------------------
    // STEP: Validate request method
    // -------------------------------------------------------------------------
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    // -------------------------------------------------------------------------
    // STEP: Validate environment variables
    // -------------------------------------------------------------------------
    const adminSecret = process.env.ADMIN_SECRET;
    if (!adminSecret) {
      console.error('[resend-magic-link] Missing ADMIN_SECRET');
      return res.status(500).json({ error: 'Server misconfigured: missing ADMIN_SECRET' });
    }

    const supabaseUrl = process.env.SUPABASE_URL;
    if (!supabaseUrl) {
      console.error('[resend-magic-link] Missing SUPABASE_URL');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceRoleKey) {
      console.error('[resend-magic-link] Missing SUPABASE_SERVICE_ROLE_KEY');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    const resendApiKey = process.env.RESEND_API_KEY;
    if (!resendApiKey) {
      console.error('[resend-magic-link] Missing RESEND_API_KEY');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    // -------------------------------------------------------------------------
    // STEP: Validate admin authorization
    // -------------------------------------------------------------------------
    const authHeader = req.headers.authorization;
    if (!authHeader || authHeader !== `Bearer ${adminSecret}`) {
      console.warn('[resend-magic-link] Unauthorized request attempt');
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // -------------------------------------------------------------------------
    // STEP: Validate request body
    // -------------------------------------------------------------------------
    const body = req.body as { email?: unknown } | undefined;

    if (!body || typeof body !== 'object') {
      return res.status(400).json({ error: 'Request body is required' });
    }

    const { email } = body;

    if (email === undefined || email === null) {
      return res.status(400).json({ error: 'email is required' });
    }

    if (typeof email !== 'string') {
      return res.status(400).json({ error: 'email must be a string' });
    }

    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedEmail) {
      return res.status(400).json({ error: 'email cannot be empty' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // -------------------------------------------------------------------------
    // STEP: Create Supabase client
    // -------------------------------------------------------------------------
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // -------------------------------------------------------------------------
    // STEP: Check if user exists in waitlist
    // -------------------------------------------------------------------------
    const { data: waitlistUser, error: fetchError } = await supabase
      .from('waitlist')
      .select('email')
      .eq('email', trimmedEmail)
      .maybeSingle();

    if (fetchError) {
      console.error('[resend-magic-link] Fetch error:', fetchError);
      return res.status(500).json({ error: 'Failed to verify user' });
    }

    if (!waitlistUser) {
      return res.status(404).json({ error: 'User not found in waitlist' });
    }

    // -------------------------------------------------------------------------
    // STEP: Generate magic link
    // -------------------------------------------------------------------------
    const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: trimmedEmail,
      options: {
        redirectTo: REDIRECT_URL,
      },
    });

    if (linkError) {
      console.error('[resend-magic-link] Magic link generation failed:', linkError);
      return res.status(500).json({ error: 'Magic link generation failed' });
    }

    if (!linkData?.properties?.action_link) {
      console.error('[resend-magic-link] No action_link in response:', linkData);
      return res.status(500).json({ error: 'Magic link generation failed' });
    }

    const magicLink = linkData.properties.action_link;

    // -------------------------------------------------------------------------
    // STEP: Send email via Resend
    // -------------------------------------------------------------------------
    const htmlWithLink = EMAIL_TEMPLATE.html.replace(/\{\{MAGIC_LINK\}\}/g, magicLink);

    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: trimmedEmail,
        subject: EMAIL_TEMPLATE.subject,
        html: htmlWithLink,
      }),
    });

    if (!emailResponse.ok) {
      const errorText = await emailResponse.text();
      console.error('[resend-magic-link] Email sending failed:', emailResponse.status, errorText);
      return res.status(500).json({ error: 'Email sending failed' });
    }

    // -------------------------------------------------------------------------
    // STEP: Log the action
    // -------------------------------------------------------------------------
    console.log(JSON.stringify({
      level: 'info',
      event: 'admin_magic_link_resent',
      email: trimmedEmail,
      timestamp: new Date().toISOString(),
    }));

    // -------------------------------------------------------------------------
    // STEP: Return success
    // -------------------------------------------------------------------------
    return res.status(200).json({
      sent: true,
      email: trimmedEmail,
    });

  } catch (error: unknown) {
    console.error('[resend-magic-link] Unexpected error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
