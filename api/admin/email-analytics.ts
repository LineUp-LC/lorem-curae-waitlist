import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// ============================================================================
// GET /api/admin/email-analytics
// ============================================================================
//
// Returns aggregated email deliverability analytics.
// This is an admin-only, read-only endpoint.
//
// Headers:
//   Authorization: Bearer <ADMIN_SECRET>
//
// Response:
//   {
//     total_emails: number,
//     emails_per_template: Array<{ template: string, count: number }>,
//     status_distribution: Array<{ status: string, count: number }>,
//     bounce_count: number,
//     engagement: {
//       total_opens: number | null,
//       total_clicks: number | null
//     },
//     daily_volume_last_30_days: Array<{ day: string, count: number }>
//   }
//
// Environment variables required:
//   - ADMIN_SECRET
//   - SUPABASE_URL
//   - SUPABASE_SERVICE_ROLE_KEY
//
// ============================================================================

interface TemplateCount {
  template: string;
  count: number;
}

interface StatusCount {
  status: string;
  count: number;
}

interface DailyVolume {
  day: string;
  count: number;
}

interface EmailAnalyticsResponse {
  total_emails: number;
  emails_per_template: TemplateCount[];
  status_distribution: StatusCount[];
  bounce_count: number;
  engagement: {
    total_opens: number | null;
    total_clicks: number | null;
  };
  daily_volume_last_30_days: DailyVolume[];
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
    const adminSecret = process.env.ADMIN_SECRET;
    if (!adminSecret) {
      console.error('[email-analytics] Missing ADMIN_SECRET');
      return res.status(500).json({ error: 'Server misconfigured: missing ADMIN_SECRET' });
    }

    const supabaseUrl = process.env.SUPABASE_URL;
    if (!supabaseUrl) {
      console.error('[email-analytics] Missing SUPABASE_URL');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceRoleKey) {
      console.error('[email-analytics] Missing SUPABASE_SERVICE_ROLE_KEY');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    // -------------------------------------------------------------------------
    // STEP: Validate admin authorization
    // -------------------------------------------------------------------------
    const authHeader = req.headers.authorization;
    if (!authHeader || authHeader !== `Bearer ${adminSecret}`) {
      console.warn('[email-analytics] Unauthorized request attempt');
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
    // STEP: Run aggregate queries in parallel using raw SQL via RPC
    // -------------------------------------------------------------------------
    // Since Supabase JS client doesn't support GROUP BY directly,
    // we use multiple queries and aggregate client-side, or use RPC.
    // For simplicity and efficiency, we'll run parallel count queries.

    const [
      totalResult,
      bounceResult,
      allLogsForAggregation,
    ] = await Promise.all([
      // 1. Total emails sent
      supabase
        .from('email_log')
        .select('*', { count: 'exact', head: true }),

      // 4. Bounce count
      supabase
        .from('email_log')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'bounced'),

      // Fetch data needed for aggregations (template, status, metadata, created_at)
      // We only select the fields needed for aggregation - NO user-identifying data
      supabase
        .from('email_log')
        .select('template, status, metadata, created_at'),
    ]);

    // Handle table not existing gracefully
    if (totalResult.error?.code === '42P01' || totalResult.error?.message?.includes('does not exist')) {
      console.log('[email-analytics] Table does not exist, returning empty analytics');
      return res.status(200).json({
        total_emails: 0,
        emails_per_template: [],
        status_distribution: [],
        bounce_count: 0,
        engagement: {
          total_opens: null,
          total_clicks: null,
        },
        daily_volume_last_30_days: [],
      } as EmailAnalyticsResponse);
    }

    // Check for errors
    const errors = [
      totalResult.error,
      bounceResult.error,
      allLogsForAggregation.error,
    ].filter(Boolean);

    if (errors.length > 0) {
      console.error('[email-analytics] Query errors:', errors);
      return res.status(500).json({ error: 'Failed to fetch email analytics' });
    }

    const logs = allLogsForAggregation.data || [];

    // -------------------------------------------------------------------------
    // STEP: Compute aggregations from fetched data
    // -------------------------------------------------------------------------

    // 2. Emails per template
    const templateCounts = new Map<string, number>();
    for (const log of logs) {
      const template = log.template || 'unknown';
      templateCounts.set(template, (templateCounts.get(template) || 0) + 1);
    }
    const emailsPerTemplate: TemplateCount[] = Array.from(templateCounts.entries())
      .map(([template, count]) => ({ template, count }))
      .sort((a, b) => a.template.localeCompare(b.template));

    // 3. Status distribution
    const statusCounts = new Map<string, number>();
    for (const log of logs) {
      const status = log.status || 'unknown';
      statusCounts.set(status, (statusCounts.get(status) || 0) + 1);
    }
    const statusDistribution: StatusCount[] = Array.from(statusCounts.entries())
      .map(([status, count]) => ({ status, count }));

    // 5. Engagement metrics (opens and clicks from metadata)
    let totalOpens: number | null = null;
    let totalClicks: number | null = null;
    for (const log of logs) {
      if (log.metadata && typeof log.metadata === 'object') {
        const metadata = log.metadata as Record<string, unknown>;
        if ('opens' in metadata && typeof metadata.opens === 'number') {
          totalOpens = (totalOpens || 0) + metadata.opens;
        }
        if ('clicks' in metadata && typeof metadata.clicks === 'number') {
          totalClicks = (totalClicks || 0) + metadata.clicks;
        }
      }
    }

    // 6. Daily volume (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    thirtyDaysAgo.setHours(0, 0, 0, 0);

    const dailyCounts = new Map<string, number>();
    for (const log of logs) {
      if (!log.created_at) continue;
      const logDate = new Date(log.created_at);
      if (logDate >= thirtyDaysAgo) {
        const dayKey = logDate.toISOString().split('T')[0]; // YYYY-MM-DD
        dailyCounts.set(dayKey, (dailyCounts.get(dayKey) || 0) + 1);
      }
    }
    const dailyVolume: DailyVolume[] = Array.from(dailyCounts.entries())
      .map(([day, count]) => ({ day, count }))
      .sort((a, b) => a.day.localeCompare(b.day));

    // -------------------------------------------------------------------------
    // STEP: Return aggregated analytics
    // -------------------------------------------------------------------------
    const response: EmailAnalyticsResponse = {
      total_emails: totalResult.count ?? 0,
      emails_per_template: emailsPerTemplate,
      status_distribution: statusDistribution,
      bounce_count: bounceResult.count ?? 0,
      engagement: {
        total_opens: totalOpens,
        total_clicks: totalClicks,
      },
      daily_volume_last_30_days: dailyVolume,
    };

    return res.status(200).json(response);

  } catch (error: unknown) {
    console.error('[email-analytics] Unexpected error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
