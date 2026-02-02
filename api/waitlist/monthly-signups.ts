import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// ============================================================================
// GET /api/waitlist/monthly-signups
// ============================================================================
//
// Returns anonymized monthly signup totals for the waitlist.
// This is a public, read-only endpoint (no authentication required).
// No personal data is exposed.
//
// Response:
//   {
//     data: Array<{
//       month_start: string (YYYY-MM-DD, first day of the month),
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
 * Gets the first day of the month for a given date.
 * Returns YYYY-MM-DD format.
 */
function getMonthStart(isoTimestamp: string): string {
  const date = new Date(isoTimestamp);
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  return `${year}-${month}-01`;
}

/**
 * Aggregates timestamps into monthly counts.
 */
function aggregateByMonth(
  rows: Array<{ created_at: string }>
): Array<{ month_start: string; count: number }> {
  const counts = new Map<string, number>();

  for (const row of rows) {
    const monthStart = getMonthStart(row.created_at);
    counts.set(monthStart, (counts.get(monthStart) || 0) + 1);
  }

  // Convert to array and sort by month_start ascending
  return Array.from(counts.entries())
    .map(([month_start, count]) => ({ month_start, count }))
    .sort((a, b) => a.month_start.localeCompare(b.month_start));
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
      console.error('[waitlist/monthly-signups] Missing SUPABASE_URL');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceRoleKey) {
      console.error('[waitlist/monthly-signups] Missing SUPABASE_SERVICE_ROLE_KEY');
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
      console.error('[waitlist/monthly-signups] Query error:', error);
      return res.status(500).json({ error: 'Failed to fetch monthly signups' });
    }

    // -------------------------------------------------------------------------
    // STEP: Aggregate by month
    // -------------------------------------------------------------------------
    const aggregated = aggregateByMonth(data || []);

    // -------------------------------------------------------------------------
    // STEP: Return monthly signup counts
    // -------------------------------------------------------------------------
    return res.status(200).json({ data: aggregated });

  } catch (error: unknown) {
    console.error('[waitlist/monthly-signups] Unexpected error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
