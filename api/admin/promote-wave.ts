import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// ============================================================================
// POST /api/admin/promote-wave
// ============================================================================
//
// Manually promotes a batch of fallback users into a target wave.
// This is an admin-only endpoint.
//
// Headers:
//   Authorization: Bearer <ADMIN_SECRET>
//
// Body:
//   {
//     target_wave: 1 | 2 | 3,
//     limit: number (1-500)
//   }
//
// Response:
//   {
//     promoted_count: number,
//     promoted_users: Array<{
//       email: string,
//       wave_number: number,
//       status: string,
//       is_founding_member: boolean,
//       created_at: string
//     }>
//   }
//
// Safety:
//   - Maximum 500 users per call
//   - Only promotes fallback users (status = 'waiting_for_next_wave')
//   - Promotes oldest users first (FIFO)
//
// Environment variables required:
//   - ADMIN_SECRET
//   - SUPABASE_URL
//   - SUPABASE_SERVICE_ROLE_KEY
//
// ============================================================================

const VALID_WAVES = [1, 2, 3] as const;
const MAX_LIMIT = 500;
const MIN_LIMIT = 1;

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
      console.error('[promote-wave] Missing ADMIN_SECRET');
      return res.status(500).json({ error: 'Server misconfigured: missing ADMIN_SECRET' });
    }

    const supabaseUrl = process.env.SUPABASE_URL;
    if (!supabaseUrl) {
      console.error('[promote-wave] Missing SUPABASE_URL');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceRoleKey) {
      console.error('[promote-wave] Missing SUPABASE_SERVICE_ROLE_KEY');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    // -------------------------------------------------------------------------
    // STEP: Validate admin authorization
    // -------------------------------------------------------------------------
    const authHeader = req.headers.authorization;
    if (!authHeader || authHeader !== `Bearer ${adminSecret}`) {
      console.warn('[promote-wave] Unauthorized request attempt');
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // -------------------------------------------------------------------------
    // STEP: Validate request body
    // -------------------------------------------------------------------------
    const body = req.body as { target_wave?: unknown; limit?: unknown } | undefined;

    if (!body || typeof body !== 'object') {
      return res.status(400).json({ error: 'Request body is required' });
    }

    const { target_wave, limit } = body;

    // Validate target_wave
    if (target_wave === undefined || target_wave === null) {
      return res.status(400).json({ error: 'target_wave is required' });
    }

    if (typeof target_wave !== 'number' || !Number.isInteger(target_wave)) {
      return res.status(400).json({ error: 'target_wave must be an integer' });
    }

    if (!VALID_WAVES.includes(target_wave as typeof VALID_WAVES[number])) {
      return res.status(400).json({ error: `target_wave must be one of: ${VALID_WAVES.join(', ')}` });
    }

    // Validate limit
    if (limit === undefined || limit === null) {
      return res.status(400).json({ error: 'limit is required' });
    }

    if (typeof limit !== 'number' || !Number.isInteger(limit)) {
      return res.status(400).json({ error: 'limit must be an integer' });
    }

    if (limit < MIN_LIMIT || limit > MAX_LIMIT) {
      return res.status(400).json({ error: `limit must be between ${MIN_LIMIT} and ${MAX_LIMIT}` });
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
    // STEP: Select fallback users to promote (oldest first)
    // -------------------------------------------------------------------------
    const { data: fallbackUsers, error: selectError } = await supabase
      .from('waitlist')
      .select('email')
      .eq('status', 'waiting_for_next_wave')
      .order('created_at', { ascending: true })
      .limit(limit);

    if (selectError) {
      console.error('[promote-wave] Select error:', selectError);
      return res.status(500).json({ error: 'Failed to fetch fallback users' });
    }

    if (!fallbackUsers || fallbackUsers.length === 0) {
      return res.status(200).json({
        promoted_count: 0,
        promoted_users: [],
      });
    }

    const emailsToPromote = fallbackUsers.map((u) => u.email);

    // -------------------------------------------------------------------------
    // STEP: Update the selected users
    // -------------------------------------------------------------------------
    const { data: promotedUsers, error: updateError } = await supabase
      .from('waitlist')
      .update({
        wave_number: target_wave,
        status: 'active',
      })
      .in('email', emailsToPromote)
      .select('email, wave_number, status, is_founding_member, created_at');

    if (updateError) {
      console.error('[promote-wave] Update error:', updateError);
      return res.status(500).json({ error: 'Failed to promote users' });
    }

    // -------------------------------------------------------------------------
    // STEP: Log the promotion
    // -------------------------------------------------------------------------
    console.log(JSON.stringify({
      level: 'info',
      event: 'wave_promotion',
      target_wave,
      requested_limit: limit,
      promoted_count: promotedUsers?.length || 0,
      timestamp: new Date().toISOString(),
    }));

    // -------------------------------------------------------------------------
    // STEP: Return promoted users
    // -------------------------------------------------------------------------
    return res.status(200).json({
      promoted_count: promotedUsers?.length || 0,
      promoted_users: promotedUsers || [],
    });

  } catch (error: unknown) {
    console.error('[promote-wave] Unexpected error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
