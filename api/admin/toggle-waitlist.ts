import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// ============================================================================
// POST /api/admin/toggle-waitlist
// ============================================================================
//
// Toggles the waitlist open/closed by updating the feature_flags table.
// This is an admin-only endpoint.
//
// Headers:
//   Authorization: Bearer <ADMIN_SECRET>
//
// Body:
//   { open: boolean }
//
// Response:
//   { open: boolean }
//
// Behavior:
//   - open: true  → enabled_for = ['public'] (waitlist is OPEN)
//   - open: false → enabled_for = []         (waitlist is CLOSED)
//
// Environment variables required:
//   - ADMIN_SECRET
//   - SUPABASE_URL
//   - SUPABASE_SERVICE_ROLE_KEY
//
// ============================================================================

const FLAG_KEY = 'waitlist_open';

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
      console.error('[toggle-waitlist] Missing ADMIN_SECRET');
      return res.status(500).json({ error: 'Server misconfigured: missing ADMIN_SECRET' });
    }

    const supabaseUrl = process.env.SUPABASE_URL;
    if (!supabaseUrl) {
      console.error('[toggle-waitlist] Missing SUPABASE_URL');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceRoleKey) {
      console.error('[toggle-waitlist] Missing SUPABASE_SERVICE_ROLE_KEY');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    // -------------------------------------------------------------------------
    // STEP: Validate admin authorization
    // -------------------------------------------------------------------------
    const authHeader = req.headers.authorization;
    if (!authHeader || authHeader !== `Bearer ${adminSecret}`) {
      console.warn('[toggle-waitlist] Unauthorized request attempt');
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // -------------------------------------------------------------------------
    // STEP: Validate request body
    // -------------------------------------------------------------------------
    const body = req.body as { open?: unknown } | undefined;

    if (!body || typeof body !== 'object') {
      return res.status(400).json({ error: 'Request body is required' });
    }

    const { open } = body;

    if (open === undefined || open === null) {
      return res.status(400).json({ error: '"open" is required' });
    }

    if (typeof open !== 'boolean') {
      return res.status(400).json({ error: '"open" must be a boolean' });
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
    // STEP: Update the feature flag
    // -------------------------------------------------------------------------
    const newEnabledFor = open ? ['public'] : [];

    const { error: updateError } = await supabase
      .from('feature_flags')
      .update({ enabled_for: newEnabledFor })
      .eq('key', FLAG_KEY);

    if (updateError) {
      console.error('[toggle-waitlist] Update error:', updateError);
      return res.status(500).json({ error: 'Failed to update waitlist status' });
    }

    // -------------------------------------------------------------------------
    // STEP: Log the change
    // -------------------------------------------------------------------------
    console.log(JSON.stringify({
      level: 'info',
      event: 'waitlist_toggled',
      open,
      enabled_for: newEnabledFor,
      timestamp: new Date().toISOString(),
    }));

    // -------------------------------------------------------------------------
    // STEP: Return the new state
    // -------------------------------------------------------------------------
    return res.status(200).json({ open });

  } catch (error: unknown) {
    console.error('[toggle-waitlist] Unexpected error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
