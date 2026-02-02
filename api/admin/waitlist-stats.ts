import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// ============================================================================
// GET /api/admin/waitlist-stats
// ============================================================================
//
// Returns aggregated waitlist statistics.
// This is an admin-only, read-only endpoint.
//
// Headers:
//   Authorization: Bearer <ADMIN_SECRET>
//
// Response:
//   {
//     total_users: number,
//     total_founding_members: number,
//     total_founding_member_creators: number,
//     wave_counts: { wave_1: number, wave_2: number, wave_3: number },
//     fallback_count: number
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
      console.error('[waitlist-stats] Missing ADMIN_SECRET');
      return res.status(500).json({ error: 'Server misconfigured: missing ADMIN_SECRET' });
    }

    const supabaseUrl = process.env.SUPABASE_URL;
    if (!supabaseUrl) {
      console.error('[waitlist-stats] Missing SUPABASE_URL');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceRoleKey) {
      console.error('[waitlist-stats] Missing SUPABASE_SERVICE_ROLE_KEY');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    // -------------------------------------------------------------------------
    // STEP: Validate admin authorization
    // -------------------------------------------------------------------------
    const authHeader = req.headers.authorization;
    if (!authHeader || authHeader !== `Bearer ${adminSecret}`) {
      console.warn('[waitlist-stats] Unauthorized request attempt');
      return res.status(401).json({ error: 'Unauthorized' });
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
    const [
      totalResult,
      foundingResult,
      foundingCreatorResult,
      wave1Result,
      wave2Result,
      wave3Result,
      fallbackResult,
    ] = await Promise.all([
      // Total users
      supabase
        .from('waitlist')
        .select('*', { count: 'exact', head: true }),

      // Founding members (general pool, cap 50)
      supabase
        .from('waitlist')
        .select('*', { count: 'exact', head: true })
        .eq('is_founding_member', true),

      // Founding member creators (creator pool, cap 20)
      supabase
        .from('waitlist')
        .select('*', { count: 'exact', head: true })
        .eq('is_founding_member_creator', true),

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
      totalResult.error,
      foundingResult.error,
      foundingCreatorResult.error,
      wave1Result.error,
      wave2Result.error,
      wave3Result.error,
      fallbackResult.error,
    ].filter(Boolean);

    if (errors.length > 0) {
      console.error('[waitlist-stats] Query errors:', errors);
      return res.status(500).json({ error: 'Failed to fetch statistics' });
    }

    // -------------------------------------------------------------------------
    // STEP: Return aggregated statistics
    // -------------------------------------------------------------------------
    return res.status(200).json({
      total_users: totalResult.count ?? 0,
      total_founding_members: foundingResult.count ?? 0,
      total_founding_member_creators: foundingCreatorResult.count ?? 0,
      wave_counts: {
        wave_1: wave1Result.count ?? 0,
        wave_2: wave2Result.count ?? 0,
        wave_3: wave3Result.count ?? 0,
      },
      fallback_count: fallbackResult.count ?? 0,
    });

  } catch (error: unknown) {
    console.error('[waitlist-stats] Unexpected error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
