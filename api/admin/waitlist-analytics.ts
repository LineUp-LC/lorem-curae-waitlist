import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// ============================================================================
// GET /api/admin/waitlist-analytics
// ============================================================================
//
// Returns consolidated analytics for the waitlist.
// This is an admin-only, read-only endpoint.
//
// Headers:
//   Authorization: Bearer <ADMIN_SECRET>
//
// Response:
//   {
//     total_signups: number,
//     signups_last_30_days: Array<{ day: string, count: number }>,
//     wave_distribution: Array<{ wave_number: number | null, count: number }>,
//     status_distribution: Array<{ status: string, count: number }>,
//     founding_member_count: number,
//     founding_member_creator_count: number
//   }
//
// Environment variables required:
//   - ADMIN_SECRET
//   - SUPABASE_URL
//   - SUPABASE_SERVICE_ROLE_KEY
//
// ============================================================================

interface DayCount {
  day: string;
  count: number;
}

interface WaveCount {
  wave_number: number | null;
  count: number;
}

interface StatusCount {
  status: string;
  count: number;
}

interface AnalyticsResponse {
  total_signups: number;
  signups_last_30_days: DayCount[];
  wave_distribution: WaveCount[];
  status_distribution: StatusCount[];
  founding_member_count: number;
  founding_member_creator_count: number;
}

// -----------------------------------------------------------------------------
// Helper Functions
// -----------------------------------------------------------------------------

function toDateString(isoTimestamp: string): string {
  return isoTimestamp.split('T')[0];
}

function getDateNDaysAgo(n: number): Date {
  const date = new Date();
  date.setUTCHours(0, 0, 0, 0);
  date.setUTCDate(date.getUTCDate() - n);
  return date;
}

function aggregateByDay(rows: Array<{ created_at: string }>): DayCount[] {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const day = toDateString(row.created_at);
    counts.set(day, (counts.get(day) || 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([day, count]) => ({ day, count }))
    .sort((a, b) => a.day.localeCompare(b.day));
}

function aggregateByWave(rows: Array<{ wave_number: number | null }>): WaveCount[] {
  const counts = new Map<number | null, number>();
  for (const row of rows) {
    const wave = row.wave_number;
    counts.set(wave, (counts.get(wave) || 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([wave_number, count]) => ({ wave_number, count }))
    .sort((a, b) => {
      // Sort nulls last, then by wave_number ascending
      if (a.wave_number === null && b.wave_number === null) return 0;
      if (a.wave_number === null) return 1;
      if (b.wave_number === null) return -1;
      return a.wave_number - b.wave_number;
    });
}

function aggregateByStatus(rows: Array<{ status: string }>): StatusCount[] {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const status = row.status || 'unknown';
    counts.set(status, (counts.get(status) || 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([status, count]) => ({ status, count }))
    .sort((a, b) => b.count - a.count);
}

// -----------------------------------------------------------------------------
// Handler
// -----------------------------------------------------------------------------

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
      console.error('[waitlist-analytics] Missing ADMIN_SECRET');
      return res.status(500).json({ error: 'Server misconfigured: missing ADMIN_SECRET' });
    }

    const supabaseUrl = process.env.SUPABASE_URL;
    if (!supabaseUrl) {
      console.error('[waitlist-analytics] Missing SUPABASE_URL');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceRoleKey) {
      console.error('[waitlist-analytics] Missing SUPABASE_SERVICE_ROLE_KEY');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    // -------------------------------------------------------------------------
    // STEP: Validate admin authorization
    // -------------------------------------------------------------------------
    const authHeader = req.headers.authorization;
    if (!authHeader || authHeader !== `Bearer ${adminSecret}`) {
      console.warn('[waitlist-analytics] Unauthorized request attempt');
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
    // STEP: Calculate date threshold for last 30 days
    // -------------------------------------------------------------------------
    const thirtyDaysAgo = getDateNDaysAgo(30).toISOString();

    // -------------------------------------------------------------------------
    // STEP: Run all queries in parallel
    // -------------------------------------------------------------------------
    const [
      totalResult,
      foundingResult,
      foundingCreatorResult,
      last30DaysResult,
      waveDistResult,
      statusDistResult,
    ] = await Promise.all([
      // 1. Total signups
      supabase
        .from('waitlist')
        .select('*', { count: 'exact', head: true }),

      // 2. Founding member count (general pool, cap 50)
      supabase
        .from('waitlist')
        .select('*', { count: 'exact', head: true })
        .eq('is_founding_member', true),

      // 3. Founding member creator count (creator pool, cap 20)
      supabase
        .from('waitlist')
        .select('*', { count: 'exact', head: true })
        .eq('is_founding_member_creator', true),

      // 4. Signups last 30 days (for daily breakdown)
      supabase
        .from('waitlist')
        .select('created_at')
        .gte('created_at', thirtyDaysAgo)
        .order('created_at', { ascending: true }),

      // 5. Wave distribution
      supabase
        .from('waitlist')
        .select('wave_number'),

      // 6. Status distribution
      supabase
        .from('waitlist')
        .select('status'),
    ]);

    // Check for critical errors
    if (totalResult.error) {
      console.error('[waitlist-analytics] Total query error:', totalResult.error);
      return res.status(500).json({ error: 'Failed to fetch analytics' });
    }

    if (foundingCreatorResult.error) {
      console.error('[waitlist-analytics] Founding creator query error:', foundingCreatorResult.error);
      return res.status(500).json({ error: 'Failed to fetch analytics' });
    }

    if (last30DaysResult.error) {
      console.error('[waitlist-analytics] Last 30 days query error:', last30DaysResult.error);
      return res.status(500).json({ error: 'Failed to fetch analytics' });
    }

    if (waveDistResult.error) {
      console.error('[waitlist-analytics] Wave distribution query error:', waveDistResult.error);
      return res.status(500).json({ error: 'Failed to fetch analytics' });
    }

    if (statusDistResult.error) {
      console.error('[waitlist-analytics] Status distribution query error:', statusDistResult.error);
      return res.status(500).json({ error: 'Failed to fetch analytics' });
    }

    // -------------------------------------------------------------------------
    // STEP: Build aggregations
    // -------------------------------------------------------------------------
    const signups_last_30_days = aggregateByDay(last30DaysResult.data || []);
    const wave_distribution = aggregateByWave(waveDistResult.data || []);
    const status_distribution = aggregateByStatus(statusDistResult.data || []);

    // -------------------------------------------------------------------------
    // STEP: Build response
    // -------------------------------------------------------------------------
    const response: AnalyticsResponse = {
      total_signups: totalResult.count ?? 0,
      signups_last_30_days,
      wave_distribution,
      status_distribution,
      founding_member_count: foundingResult.count ?? 0,
      founding_member_creator_count: foundingCreatorResult.count ?? 0,
    };

    return res.status(200).json(response);

  } catch (error: unknown) {
    console.error('[waitlist-analytics] Unexpected error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
