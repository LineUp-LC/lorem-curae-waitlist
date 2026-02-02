import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// ============================================================================
// GET /api/waitlist/device-stats
// ============================================================================
//
// Returns anonymized device and platform statistics for the waitlist.
// This is a public, read-only endpoint (no authentication required).
// No personal data is exposed.
//
// Response:
//   {
//     device_types: Array<{ type: string, count: number }>,
//     platforms: Array<{ name: string, count: number }>
//   }
//
// If fields do not exist, returns empty arrays.
//
// Environment variables required:
//   - SUPABASE_URL
//   - SUPABASE_SERVICE_ROLE_KEY
//
// ============================================================================

/**
 * Aggregates a field into counts.
 * Returns empty array if field doesn't exist or query fails.
 */
async function aggregateField(
  supabase: SupabaseClient,
  field: string
): Promise<Map<string, number>> {
  try {
    const { data, error } = await supabase
      .from('waitlist')
      .select(field);

    if (error) {
      console.log(`[waitlist/device-stats] Field "${field}" not available: ${error.message}`);
      return new Map();
    }

    if (!data || data.length === 0) {
      return new Map();
    }

    const counts = new Map<string, number>();

    for (const row of data) {
      const value = row[field];
      if (value && typeof value === 'string' && value.trim()) {
        const normalized = value.trim().toLowerCase();
        counts.set(normalized, (counts.get(normalized) || 0) + 1);
      }
    }

    return counts;

  } catch (err) {
    console.log(`[waitlist/device-stats] Error querying "${field}":`, err);
    return new Map();
  }
}

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
      console.error('[waitlist/device-stats] Missing SUPABASE_URL');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceRoleKey) {
      console.error('[waitlist/device-stats] Missing SUPABASE_SERVICE_ROLE_KEY');
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
    // STEP: Query fields in parallel
    // -------------------------------------------------------------------------
    const [deviceTypeCounts, platformCounts] = await Promise.all([
      aggregateField(supabase, 'device_type'),
      aggregateField(supabase, 'platform'),
    ]);

    // -------------------------------------------------------------------------
    // STEP: Format response
    // -------------------------------------------------------------------------
    const device_types = Array.from(deviceTypeCounts.entries())
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count);

    const platforms = Array.from(platformCounts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    // -------------------------------------------------------------------------
    // STEP: Return device statistics
    // -------------------------------------------------------------------------
    return res.status(200).json({
      device_types,
      platforms,
    });

  } catch (error: unknown) {
    console.error('[waitlist/device-stats] Unexpected error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
