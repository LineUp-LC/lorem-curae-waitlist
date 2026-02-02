import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// ============================================================================
// GET /api/waitlist/geography
// ============================================================================
//
// Returns anonymized geographic distribution data for the waitlist.
// This is a public, read-only endpoint (no authentication required).
// No personal data is exposed.
//
// Response:
//   {
//     countries: Array<{ name: string, count: number }>,
//     states: Array<{ name: string, count: number }>,
//     cities: Array<{ name: string, count: number }>
//   }
//
// If geographic fields do not exist, returns empty arrays.
//
// Environment variables required:
//   - SUPABASE_URL
//   - SUPABASE_SERVICE_ROLE_KEY
//
// ============================================================================

interface GeoCount {
  name: string;
  count: number;
}

/**
 * Aggregates a geographic field into counts.
 * Returns empty array if field doesn't exist or query fails.
 */
async function aggregateGeoField(
  supabase: SupabaseClient,
  field: string
): Promise<GeoCount[]> {
  try {
    const { data, error } = await supabase
      .from('waitlist')
      .select(field);

    // If column doesn't exist, Supabase returns an error
    if (error) {
      console.log(`[waitlist/geography] Field "${field}" not available: ${error.message}`);
      return [];
    }

    if (!data || data.length === 0) {
      return [];
    }

    // Aggregate counts in memory
    const counts = new Map<string, number>();

    for (const row of data) {
      const value = row[field];
      if (value && typeof value === 'string' && value.trim()) {
        const normalized = value.trim();
        counts.set(normalized, (counts.get(normalized) || 0) + 1);
      }
    }

    // Convert to array and sort by count descending
    return Array.from(counts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

  } catch (err) {
    console.log(`[waitlist/geography] Error querying "${field}":`, err);
    return [];
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
      console.error('[waitlist/geography] Missing SUPABASE_URL');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceRoleKey) {
      console.error('[waitlist/geography] Missing SUPABASE_SERVICE_ROLE_KEY');
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
    // STEP: Query geographic fields in parallel
    // -------------------------------------------------------------------------
    const [countries, states, cities] = await Promise.all([
      aggregateGeoField(supabase, 'country'),
      aggregateGeoField(supabase, 'state'),
      aggregateGeoField(supabase, 'city'),
    ]);

    // -------------------------------------------------------------------------
    // STEP: Return geographic distribution
    // -------------------------------------------------------------------------
    return res.status(200).json({
      countries,
      states,
      cities,
    });

  } catch (error: unknown) {
    console.error('[waitlist/geography] Unexpected error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
