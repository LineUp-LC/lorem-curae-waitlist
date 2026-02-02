import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// ============================================================================
// GET /api/waitlist/count
// ============================================================================
//
// Returns the total number of users on the waitlist.
// This is a public, read-only endpoint (no authentication required).
// No personal data is exposed.
//
// Response:
//   { total: number }
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
      console.error('[waitlist/count] Missing SUPABASE_URL');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceRoleKey) {
      console.error('[waitlist/count] Missing SUPABASE_SERVICE_ROLE_KEY');
      return res.status(500).json({ error: 'Server configuration error' });
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
    // STEP: Query total count
    // -------------------------------------------------------------------------
    const { count, error } = await supabase
      .from('waitlist')
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.error('[waitlist/count] Query error:', error);
      return res.status(500).json({ error: 'Failed to fetch waitlist count' });
    }

    // -------------------------------------------------------------------------
    // STEP: Return total count
    // -------------------------------------------------------------------------
    return res.status(200).json({ total: count ?? 0 });

  } catch (error: unknown) {
    console.error('[waitlist/count] Unexpected error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
