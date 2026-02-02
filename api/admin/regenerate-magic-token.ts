import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// ============================================================================
// POST /api/admin/regenerate-magic-token
// ============================================================================
//
// Regenerates a magic-link token for a waitlist user WITHOUT sending an email.
// This is an admin-only endpoint for debugging, support, and internal testing.
//
// Headers:
//   Authorization: Bearer <ADMIN_SECRET>
//
// Body:
//   { email: string }
//
// Response:
//   {
//     regenerated: true,
//     email: string,
//     token: string
//   }
//
// Safety:
//   - Does NOT send any email
//   - Does NOT modify any database records
//   - Does NOT create a login session
//   - Only generates the token for admin use
//   - Requires admin authentication
//
// Environment variables required:
//   - ADMIN_SECRET
//   - SUPABASE_URL
//   - SUPABASE_SERVICE_ROLE_KEY
//
// ============================================================================

// Simple email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Extracts the token from a Supabase magic link URL.
 * Magic links have the format:
 * https://project.supabase.co/auth/v1/verify?token=TOKEN&type=magiclink&redirect_to=...
 */
function extractTokenFromMagicLink(magicLink: string): string | null {
  try {
    const url = new URL(magicLink);
    return url.searchParams.get('token');
  } catch {
    return null;
  }
}

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
      console.error('[regenerate-magic-token] Missing ADMIN_SECRET');
      return res.status(500).json({ error: 'Server misconfigured: missing ADMIN_SECRET' });
    }

    const supabaseUrl = process.env.SUPABASE_URL;
    if (!supabaseUrl) {
      console.error('[regenerate-magic-token] Missing SUPABASE_URL');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceRoleKey) {
      console.error('[regenerate-magic-token] Missing SUPABASE_SERVICE_ROLE_KEY');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    // -------------------------------------------------------------------------
    // STEP: Validate admin authorization
    // -------------------------------------------------------------------------
    const authHeader = req.headers.authorization;
    if (!authHeader || authHeader !== `Bearer ${adminSecret}`) {
      console.warn('[regenerate-magic-token] Unauthorized request attempt');
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

    // Validate email is present and is a string
    if (email === undefined || email === null) {
      return res.status(400).json({ error: 'email is required' });
    }

    if (typeof email !== 'string') {
      return res.status(400).json({ error: 'email must be a string' });
    }

    const trimmedEmail = email.trim().toLowerCase();

    // Reject empty email
    if (!trimmedEmail) {
      return res.status(400).json({ error: 'email cannot be empty' });
    }

    // Basic email format validation
    if (!EMAIL_REGEX.test(trimmedEmail)) {
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
      console.error('[regenerate-magic-token] Fetch error:', fetchError);
      return res.status(500).json({ error: 'Failed to verify user' });
    }

    if (!waitlistUser) {
      return res.status(404).json({ error: 'User not found in waitlist' });
    }

    // -------------------------------------------------------------------------
    // STEP: Generate magic link (token only, no email sent)
    // -------------------------------------------------------------------------
    const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: trimmedEmail,
    });

    if (linkError) {
      console.error('[regenerate-magic-token] Magic link generation failed:', linkError);
      return res.status(500).json({ error: 'Token generation failed' });
    }

    if (!linkData?.properties?.action_link) {
      console.error('[regenerate-magic-token] No action_link in response:', linkData);
      return res.status(500).json({ error: 'Token generation failed' });
    }

    // Extract just the token from the magic link URL
    const token = extractTokenFromMagicLink(linkData.properties.action_link);

    if (!token) {
      console.error('[regenerate-magic-token] Failed to extract token from magic link');
      return res.status(500).json({ error: 'Token extraction failed' });
    }

    // -------------------------------------------------------------------------
    // STEP: Log the action (without exposing the token in logs)
    // -------------------------------------------------------------------------
    console.log(JSON.stringify({
      level: 'info',
      event: 'admin_magic_token_regenerated',
      email: trimmedEmail,
      token_length: token.length,
      timestamp: new Date().toISOString(),
    }));

    // -------------------------------------------------------------------------
    // STEP: Return the token (NO email sent, NO database modified)
    // -------------------------------------------------------------------------
    return res.status(200).json({
      regenerated: true,
      email: trimmedEmail,
      token: token,
    });

  } catch (error: unknown) {
    console.error('[regenerate-magic-token] Unexpected error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
