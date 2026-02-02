import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// ============================================================================
// GET /api/waitlist/founding-member?email=<email>
// ============================================================================
//
// Returns whether a user is a Founding Member.
// This is a read-only endpoint that does NOT modify any data.
//
// Query parameters:
//   email (required): The user's email address
//
// Response:
//   200: { email, is_founding_member }
//   400: { error: 'Email is required' }
//   404: { error: 'Not found' }
//   500: { error: '...' }
//
// Environment variables required:
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
    const supabaseUrl = process.env.SUPABASE_URL;
    if (!supabaseUrl) {
      console.error('[waitlist/founding-member] Missing SUPABASE_URL');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceRoleKey) {
      console.error('[waitlist/founding-member] Missing SUPABASE_SERVICE_ROLE_KEY');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    // -------------------------------------------------------------------------
    // STEP: Validate query parameters
    // -------------------------------------------------------------------------
    const { email } = req.query;

    if (!email || typeof email !== 'string') {
      return res.status(400).json({ error: 'Email is required' });
    }

    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedEmail) {
      return res.status(400).json({ error: 'Email is required' });
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
      .select('email, is_founding_member')
      .eq('email', trimmedEmail)
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('[waitlist/founding-member] Query error:', error);
      return res.status(500).json({ error: 'Failed to fetch founding member status' });
    }

    if (!data) {
      return res.status(404).json({ error: 'Not found' });
    }

    // -------------------------------------------------------------------------
    // STEP: Return founding member status
    // -------------------------------------------------------------------------
    return res.status(200).json({
      email: data.email,
      is_founding_member: data.is_founding_member,
    });

  } catch (error: unknown) {
    console.error('[waitlist/founding-member] Unexpected error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
