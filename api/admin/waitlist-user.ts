import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// ============================================================================
// GET /api/admin/waitlist-user?email=<email>
// ============================================================================
//
// Returns the full waitlist record for a single user.
// This is an admin-only, read-only endpoint.
//
// Headers:
//   Authorization: Bearer <ADMIN_SECRET>
//
// Query parameters:
//   email (required): The user's email address
//
// Response:
//   {
//     email: string,
//     wave_number: number | null,
//     status: string,
//     is_founding_member: boolean,
//     created_at: string
//   }
//
// Environment variables required:
//   - ADMIN_SECRET
//   - SUPABASE_URL
//   - SUPABASE_SERVICE_ROLE_KEY
//
// ============================================================================

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // -------------------------------------------------------------------------
    // STEP: Validate request method
    // -------------------------------------------------------------------------
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    // -------------------------------------------------------------------------
    // STEP: Validate environment variables
    // -------------------------------------------------------------------------
    const adminSecret = process.env.ADMIN_SECRET;
    if (!adminSecret) {
      console.error('[waitlist-user] Missing ADMIN_SECRET');
      return res.status(500).json({ error: 'Server misconfigured: missing ADMIN_SECRET' });
    }

    const supabaseUrl = process.env.SUPABASE_URL;
    if (!supabaseUrl) {
      console.error('[waitlist-user] Missing SUPABASE_URL');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceRoleKey) {
      console.error('[waitlist-user] Missing SUPABASE_SERVICE_ROLE_KEY');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    // -------------------------------------------------------------------------
    // STEP: Validate admin authorization
    // -------------------------------------------------------------------------
    const authHeader = req.headers.authorization;
    if (!authHeader || authHeader !== `Bearer ${adminSecret}`) {
      console.warn('[waitlist-user] Unauthorized request attempt');
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // -------------------------------------------------------------------------
    // STEP: Validate query parameter
    // -------------------------------------------------------------------------
    const { email } = req.query;

    if (!email || typeof email !== 'string') {
      return res.status(400).json({ error: 'email query parameter is required' });
    }

    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedEmail) {
      return res.status(400).json({ error: 'email cannot be empty' });
    }

    // Basic email format validation
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
    // STEP: Query waitlist
    // -------------------------------------------------------------------------
    const { data, error } = await supabase
      .from('waitlist')
      .select('email, wave_number, status, is_founding_member, created_at')
      .eq('email', trimmedEmail)
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('[waitlist-user] Query error:', error);
      return res.status(500).json({ error: 'Failed to fetch user' });
    }

    if (!data) {
      return res.status(404).json({ error: 'User not found' });
    }

    // -------------------------------------------------------------------------
    // STEP: Return user record
    // -------------------------------------------------------------------------
    return res.status(200).json({
      email: data.email,
      wave_number: data.wave_number,
      status: data.status,
      is_founding_member: data.is_founding_member,
      created_at: data.created_at,
    });

  } catch (error: unknown) {
    console.error('[waitlist-user] Unexpected error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
