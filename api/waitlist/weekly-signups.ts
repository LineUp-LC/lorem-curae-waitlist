import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// ============================================================================
// GET /api/waitlist/weekly-signups
// ============================================================================
//
// Returns anonymized weekly signup totals for the waitlist.
// This is a public, read-only endpoint (no authentication required).
// No personal data is exposed.
//
// Response:
//   {
//     data: Array<{
//       week_start: string (YYYY-MM-DD, Monday of the week),
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
 * Gets the Monday of the week for a given date (week start).
 * Returns YYYY-MM-DD format.
 */
function getWeekStart(isoTimestamp: string): string {
  const date = new Date(isoTimestamp);
  const day = date.getUTCDay();
  // Adjust to Monday (day 0 = Sunday, so Monday = 1)
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(date);
  monday.setUTCDate(date.getUTCDate() + diff);
  return monday.toISOString().split('T')[0];
}

/**
 * Aggregates timestamps into weekly counts.
 */
function aggregateByWeek(
  rows: Array<{ created_at: string }>
): Array<{ week_start: string; count: number }> {
  const counts = new Map<string, number>();

  for (const row of rows) {
    const weekStart = getWeekStart(row.created_at);
    counts.set(weekStart, (counts.get(weekStart) || 0) + 1);
  }

  // Convert to array and sort by week_start ascending
  return Array.from(counts.entries())
    .map(([week_start, count]) => ({ week_start, count }))
    .sort((a, b) => a.week_start.localeCompare(b.week_start));
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
      console.error('[waitlist/weekly-signups] Missing SUPABASE_URL');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceRoleKey) {
      console.error('[waitlist/weekly-signups] Missing SUPABASE_SERVICE_ROLE_KEY');
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
      console.error('[waitlist/weekly-signups] Query error:', error);
      return res.status(500).json({ error: 'Failed to fetch weekly signups' });
    }

    // -------------------------------------------------------------------------
    // STEP: Aggregate by week
    // -------------------------------------------------------------------------
    const aggregated = aggregateByWeek(data || []);

    // -------------------------------------------------------------------------
    // STEP: Return weekly signup counts
    // -------------------------------------------------------------------------
    return res.status(200).json({ data: aggregated });

  } catch (error: unknown) {
    console.error('[waitlist/weekly-signups] Unexpected error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
