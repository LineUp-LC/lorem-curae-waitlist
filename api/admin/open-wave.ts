import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// ============================================================================
// POST /api/admin/open-wave
// ============================================================================
//
// Opens a new wave by moving all fallback users into the specified wave.
// This is an admin-only endpoint protected by ADMIN_SECRET.
//
// Headers:
//   Authorization: Bearer <ADMIN_SECRET>
//
// Body:
//   { "wave_number": 4 | 5 | 6 | 7 | 8 | ... }
//
// Response:
//   { success: true, wave_number: number, users_moved: number }
//
// Environment variables required:
//   - ADMIN_SECRET (for authentication)
//   - SUPABASE_URL
//   - SUPABASE_SERVICE_ROLE_KEY
//
// ============================================================================

export default async function handler(req: VercelRequest, res: VercelResponse) {
  console.log('[open-wave] Request received');

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
      console.error('[open-wave] Missing ADMIN_SECRET environment variable');
      return res.status(500).json({ error: 'Server misconfigured: missing ADMIN_SECRET' });
    }

    const supabaseUrl = process.env.SUPABASE_URL;
    if (!supabaseUrl) {
      console.error('[open-wave] Missing SUPABASE_URL environment variable');
      return res.status(500).json({ error: 'Server misconfigured: missing SUPABASE_URL' });
    }

    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceRoleKey) {
      console.error('[open-wave] Missing SUPABASE_SERVICE_ROLE_KEY environment variable');
      return res.status(500).json({ error: 'Server misconfigured: missing SUPABASE_SERVICE_ROLE_KEY' });
    }

    // -------------------------------------------------------------------------
    // STEP: Validate admin authorization
    // -------------------------------------------------------------------------
    const authHeader = req.headers.authorization;
    if (!authHeader || authHeader !== `Bearer ${adminSecret}`) {
      console.warn('[open-wave] Unauthorized request attempt');
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // -------------------------------------------------------------------------
    // STEP: Validate request body
    // -------------------------------------------------------------------------
    const { wave_number } = req.body || {};

    if (wave_number === undefined || wave_number === null) {
      return res.status(400).json({ error: 'Missing required field: wave_number' });
    }

    if (typeof wave_number !== 'number' || !Number.isInteger(wave_number)) {
      return res.status(400).json({ error: 'wave_number must be an integer' });
    }

    if (wave_number < 4) {
      return res.status(400).json({ error: 'wave_number must be >= 4 (waves 1-3 are managed automatically)' });
    }

    console.log(`[open-wave] Authorization validated, opening wave ${wave_number}...`);

    // -------------------------------------------------------------------------
    // STEP: Create Supabase admin client
    // -------------------------------------------------------------------------
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // -------------------------------------------------------------------------
    // STEP: Update all fallback users to the new wave
    // -------------------------------------------------------------------------
    const { data, error } = await supabase
      .from('waitlist')
      .update({
        wave_number: wave_number,
        status: 'active',
      })
      .eq('status', 'waiting_for_next_wave')
      .select('id');

    if (error) {
      console.error('[open-wave] Update error:', error);
      return res.status(500).json({ error: 'Failed to open wave' });
    }

    const usersMoved = data?.length || 0;

    console.log(JSON.stringify({
      level: 'info',
      event: 'wave_opened',
      wave_number,
      users_moved: usersMoved,
      timestamp: new Date().toISOString(),
    }));

    // -------------------------------------------------------------------------
    // STEP: Return success response
    // -------------------------------------------------------------------------
    return res.status(200).json({
      success: true,
      wave_number,
      users_moved: usersMoved,
    });

  } catch (error) {
    console.error('[open-wave] Unexpected error:', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
}
