import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// ============================================================================
// GET /api/waitlist/wave-distribution
// ============================================================================
//
// Returns anonymized wave distribution data.
// This is a public, read-only endpoint (no authentication required).
// No personal data is exposed.
//
// Response:
//   {
//     wave_1: number,
//     wave_2: number,
//     wave_3: number,
//     fallback: number
//   }
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
      console.error('[waitlist/wave-distribution] Missing SUPABASE_URL');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceRoleKey) {
      console.error('[waitlist/wave-distribution] Missing SUPABASE_SERVICE_ROLE_KEY');
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
    // STEP: Run aggregate queries in parallel
    // -------------------------------------------------------------------------
    const [wave1Result, wave2Result, wave3Result, fallbackResult] = await Promise.all([
      // Wave 1
      supabase
        .from('waitlist')
        .select('*', { count: 'exact', head: true })
        .eq('wave_number', 1),

      // Wave 2
      supabase
        .from('waitlist')
        .select('*', { count: 'exact', head: true })
        .eq('wave_number', 2),

      // Wave 3
      supabase
        .from('waitlist')
        .select('*', { count: 'exact', head: true })
        .eq('wave_number', 3),

      // Fallback (waiting_for_next_wave)
      supabase
        .from('waitlist')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'waiting_for_next_wave'),
    ]);

    // Check for errors
    const errors = [
      wave1Result.error,
      wave2Result.error,
      wave3Result.error,
      fallbackResult.error,
    ].filter(Boolean);

    if (errors.length > 0) {
      console.error('[waitlist/wave-distribution] Query errors:', errors);
      return res.status(500).json({ error: 'Failed to fetch wave distribution' });
    }

    // -------------------------------------------------------------------------
    // STEP: Return wave distribution
    // -------------------------------------------------------------------------
    return res.status(200).json({
      wave_1: wave1Result.count ?? 0,
      wave_2: wave2Result.count ?? 0,
      wave_3: wave3Result.count ?? 0,
      fallback: fallbackResult.count ?? 0,
    });

  } catch (error: unknown) {
    console.error('[waitlist/wave-distribution] Unexpected error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
