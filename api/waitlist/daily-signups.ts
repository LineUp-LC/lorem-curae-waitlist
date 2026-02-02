import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// ============================================================================
// GET /api/waitlist/daily-signups
// ============================================================================
//
// Returns anonymized daily signup counts for the waitlist.
// This is a public, read-only endpoint (no authentication required).
// No personal data is exposed.
//
// Response:
//   {
//     data: Array<{
//       day: string (YYYY-MM-DD),
//       count: number
//     }>
//   }
//
// Environment variables required:
//   - SUPABASE_URL
//   - SUPABASE_SERVICE_ROLE_KEY
//
// ============================================================================

/**
 * Extracts YYYY-MM-DD from an ISO timestamp.
 */
function toDateString(isoTimestamp: string): string {
  return isoTimestamp.split('T')[0];
}

/**
 * Aggregates timestamps into daily counts.
 */
function aggregateByDay(
  rows: Array<{ created_at: string }>
): Array<{ day: string; count: number }> {
  const counts = new Map<string, number>();

  for (const row of rows) {
    const day = toDateString(row.created_at);
    counts.set(day, (counts.get(day) || 0) + 1);
  }

  // Convert to array and sort by day ascending
  return Array.from(counts.entries())
    .map(([day, count]) => ({ day, count }))
    .sort((a, b) => a.day.localeCompare(b.day));
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
      console.error('[waitlist/daily-signups] Missing SUPABASE_URL');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceRoleKey) {
      console.error('[waitlist/daily-signups] Missing SUPABASE_SERVICE_ROLE_KEY');
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
    // STEP: Query all created_at timestamps (minimal data)
    // -------------------------------------------------------------------------
    const { data, error } = await supabase
      .from('waitlist')
      .select('created_at')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('[waitlist/daily-signups] Query error:', error);
      return res.status(500).json({ error: 'Failed to fetch daily signups' });
    }

    // -------------------------------------------------------------------------
    // STEP: Aggregate by day
    // -------------------------------------------------------------------------
    const aggregated = aggregateByDay(data || []);

    // -------------------------------------------------------------------------
    // STEP: Return daily signup counts
    // -------------------------------------------------------------------------
    return res.status(200).json({ data: aggregated });

  } catch (error: unknown) {
    console.error('[waitlist/daily-signups] Unexpected error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
