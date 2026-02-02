import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// ============================================================================
// GET /api/waitlist/is-open
// ============================================================================
//
// Returns whether the waitlist is currently open.
// This is a public, read-only endpoint (no authentication required).
//
// Response:
//   { open: true }  - waitlist is accepting signups
//   { open: false } - waitlist is closed
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
      console.error('[waitlist/is-open] Missing SUPABASE_URL');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceRoleKey) {
      console.error('[waitlist/is-open] Missing SUPABASE_SERVICE_ROLE_KEY');
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
    // STEP: Query feature flag
    // -------------------------------------------------------------------------
    const { data, error } = await supabase
      .from('feature_flags')
      .select('enabled_for')
      .eq('key', 'waitlist_open')
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('[waitlist/is-open] Query error:', error);
      return res.status(500).json({ error: 'Failed to check waitlist status' });
    }

    // -------------------------------------------------------------------------
    // STEP: Determine if waitlist is open
    // -------------------------------------------------------------------------
    // Open if enabled_for has at least one value
    // Closed if flag doesn't exist or enabled_for is empty
    const isOpen = Array.isArray(data?.enabled_for) && data.enabled_for.length > 0;

    return res.status(200).json({ open: isOpen });

  } catch (error: unknown) {
    console.error('[waitlist/is-open] Unexpected error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
