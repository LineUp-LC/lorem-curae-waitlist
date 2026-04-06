import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// ============================================================================
// CONSOLIDATED PUBLIC WAITLIST API
// ============================================================================
//
// All public waitlist endpoints consolidated into a single serverless function.
// Use ?action=<actionName> query parameter.
//
// Available actions:
//   - status (GET) - requires ?email=
//   - count (GET)
//   - isOpen (GET)
//   - foundingMember (GET) - requires ?email=
//   - waveDistribution (GET)
//   - recentActivity (GET)
//   - dailySignups (GET)
//   - weeklySignups (GET)
//   - monthlySignups (GET)
//   - geography (GET)
//   - deviceStats (GET)
//
// ============================================================================

// Helper: Create Supabase client
function createSupabaseClient(url: string, key: string): SupabaseClient {
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

// Helper: Validate email format
function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Helper: Get relative time string
function getRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 60) return 'just now';
  if (diffMinutes === 1) return '1 minute ago';
  if (diffMinutes < 60) return `${diffMinutes} minutes ago`;
  if (diffHours === 1) return '1 hour ago';
  if (diffHours < 24) return `${diffHours} hours ago`;
  if (diffDays === 1) return '1 day ago';
  if (diffDays < 30) return `${diffDays} days ago`;

  const diffWeeks = Math.floor(diffDays / 7);
  if (diffWeeks === 1) return '1 week ago';
  if (diffWeeks < 4) return `${diffWeeks} weeks ago`;

  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths === 1) return '1 month ago';
  return `${diffMonths} months ago`;
}

// ============================================================================
// ACTION HANDLERS
// ============================================================================

async function handleStatus(supabase: SupabaseClient, req: VercelRequest, res: VercelResponse) {
  const email = req.query.email as string;
  if (!email) return res.status(400).json({ error: 'Email is required' });

  const trimmedEmail = email.trim().toLowerCase();
  if (!trimmedEmail || !isValidEmail(trimmedEmail)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }

  const { data, error } = await supabase
    .from('waitlist')
    .select('email, wave_number, status, is_founding_member')
    .eq('email', trimmedEmail)
    .maybeSingle();

  if (error) return res.status(500).json({ error: 'Failed to fetch waitlist status' });
  if (!data) return res.status(404).json({ error: 'Not found' });

  return res.status(200).json({
    email: data.email,
    wave_number: data.wave_number,
    status: data.status,
    is_founding_member: data.is_founding_member,
  });
}

async function handleCount(supabase: SupabaseClient, res: VercelResponse) {
  const { count, error } = await supabase
    .from('waitlist')
    .select('*', { count: 'exact', head: true });

  if (error) return res.status(500).json({ error: 'Failed to fetch waitlist count' });

  return res.status(200).json({ total: count ?? 0 });
}

async function handleIsOpen(supabase: SupabaseClient, res: VercelResponse) {
  const { data, error } = await supabase
    .from('feature_flags')
    .select('enabled_for')
    .eq('key', 'waitlist_open')
    .maybeSingle();

  if (error) return res.status(500).json({ error: 'Failed to check waitlist status' });

  const isOpen = Array.isArray(data?.enabled_for) && data.enabled_for.length > 0;
  return res.status(200).json({ open: isOpen });
}

async function handleFoundingMember(supabase: SupabaseClient, req: VercelRequest, res: VercelResponse) {
  const email = req.query.email as string;
  if (!email) return res.status(400).json({ error: 'Email is required' });

  const trimmedEmail = email.trim().toLowerCase();
  if (!trimmedEmail || !isValidEmail(trimmedEmail)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }

  const { data, error } = await supabase
    .from('waitlist')
    .select('email, is_founding_member')
    .eq('email', trimmedEmail)
    .maybeSingle();

  if (error) return res.status(500).json({ error: 'Failed to fetch founding member status' });
  if (!data) return res.status(404).json({ error: 'Not found' });

  return res.status(200).json({
    email: data.email,
    is_founding_member: data.is_founding_member,
  });
}

async function handleWaveDistribution(supabase: SupabaseClient, res: VercelResponse) {
  const [wave1, wave2, wave3, fallback] = await Promise.all([
    supabase.from('waitlist').select('*', { count: 'exact', head: true }).eq('wave_number', 1),
    supabase.from('waitlist').select('*', { count: 'exact', head: true }).eq('wave_number', 2),
    supabase.from('waitlist').select('*', { count: 'exact', head: true }).eq('wave_number', 3),
    supabase.from('waitlist').select('*', { count: 'exact', head: true }).eq('status', 'waiting_for_next_wave'),
  ]);

  const errors = [wave1.error, wave2.error, wave3.error, fallback.error].filter(Boolean);
  if (errors.length > 0) {
    return res.status(500).json({ error: 'Failed to fetch wave distribution' });
  }

  return res.status(200).json({
    wave_1: wave1.count ?? 0,
    wave_2: wave2.count ?? 0,
    wave_3: wave3.count ?? 0,
    fallback: fallback.count ?? 0,
  });
}

async function handleRecentActivity(supabase: SupabaseClient, res: VercelResponse) {
  const { data, error } = await supabase
    .from('waitlist')
    .select('created_at')
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) return res.status(500).json({ error: 'Failed to fetch recent activity' });

  const activity = (data || []).map((row) => {
    const joinedAt = new Date(row.created_at);
    return {
      joined_at: joinedAt.toISOString(),
      relative_time: getRelativeTime(joinedAt),
    };
  });

  return res.status(200).json({ activity });
}

async function handleDailySignups(supabase: SupabaseClient, req: VercelRequest, res: VercelResponse) {
  const days = Math.min(parseInt(req.query.days as string) || 30, 90);
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const { data, error } = await supabase
    .from('waitlist')
    .select('created_at')
    .gte('created_at', startDate.toISOString());

  if (error) return res.status(500).json({ error: 'Failed to fetch daily signups' });

  const dailyCounts: Record<string, number> = {};
  (data || []).forEach((row) => {
    const date = new Date(row.created_at).toISOString().split('T')[0];
    dailyCounts[date] = (dailyCounts[date] || 0) + 1;
  });

  const result = Object.entries(dailyCounts)
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return res.status(200).json({ daily_signups: result });
}

async function handleWeeklySignups(supabase: SupabaseClient, req: VercelRequest, res: VercelResponse) {
  const weeks = Math.min(parseInt(req.query.weeks as string) || 12, 52);
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - weeks * 7);

  const { data, error } = await supabase
    .from('waitlist')
    .select('created_at')
    .gte('created_at', startDate.toISOString());

  if (error) return res.status(500).json({ error: 'Failed to fetch weekly signups' });

  const weeklyCounts: Record<string, number> = {};
  (data || []).forEach((row) => {
    const date = new Date(row.created_at);
    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() - date.getDay());
    const weekKey = weekStart.toISOString().split('T')[0];
    weeklyCounts[weekKey] = (weeklyCounts[weekKey] || 0) + 1;
  });

  const result = Object.entries(weeklyCounts)
    .map(([week_start, count]) => ({ week_start, count }))
    .sort((a, b) => a.week_start.localeCompare(b.week_start));

  return res.status(200).json({ weekly_signups: result });
}

async function handleMonthlySignups(supabase: SupabaseClient, req: VercelRequest, res: VercelResponse) {
  const months = Math.min(parseInt(req.query.months as string) || 12, 24);
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - months);

  const { data, error } = await supabase
    .from('waitlist')
    .select('created_at')
    .gte('created_at', startDate.toISOString());

  if (error) return res.status(500).json({ error: 'Failed to fetch monthly signups' });

  const monthlyCounts: Record<string, number> = {};
  (data || []).forEach((row) => {
    const date = new Date(row.created_at);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    monthlyCounts[monthKey] = (monthlyCounts[monthKey] || 0) + 1;
  });

  const result = Object.entries(monthlyCounts)
    .map(([month, count]) => ({ month, count }))
    .sort((a, b) => a.month.localeCompare(b.month));

  return res.status(200).json({ monthly_signups: result });
}

async function handleGeography(supabase: SupabaseClient, res: VercelResponse) {
  // Note: This requires a 'country' or 'region' column in the waitlist table
  // If not available, return empty or aggregate by available metadata
  const { data, error } = await supabase
    .from('waitlist')
    .select('country')
    .not('country', 'is', null);

  if (error) return res.status(500).json({ error: 'Failed to fetch geography data' });

  const countryCounts: Record<string, number> = {};
  (data || []).forEach((row) => {
    if (row.country) {
      countryCounts[row.country] = (countryCounts[row.country] || 0) + 1;
    }
  });

  const result = Object.entries(countryCounts)
    .map(([country, count]) => ({ country, count }))
    .sort((a, b) => b.count - a.count);

  return res.status(200).json({ geography: result });
}

async function handleDeviceStats(supabase: SupabaseClient, res: VercelResponse) {
  // Note: This requires a 'device_type' or 'user_agent' column in the waitlist table
  // If not available, return empty or aggregate by available metadata
  const { data, error } = await supabase
    .from('waitlist')
    .select('device_type')
    .not('device_type', 'is', null);

  if (error) return res.status(500).json({ error: 'Failed to fetch device stats' });

  const deviceCounts: Record<string, number> = {};
  (data || []).forEach((row) => {
    if (row.device_type) {
      deviceCounts[row.device_type] = (deviceCounts[row.device_type] || 0) + 1;
    }
  });

  const result = Object.entries(deviceCounts)
    .map(([device, count]) => ({ device, count }))
    .sort((a, b) => b.count - a.count);

  return res.status(200).json({ device_stats: result });
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // Validate request method
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    // Validate environment
    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      return res.status(500).json({ error: 'Server configuration error' });
    }

    // Get action from query
    const action = req.query.action as string;
    if (!action) {
      return res.status(400).json({ error: 'action parameter is required' });
    }

    // Create Supabase client
    const supabase = createSupabaseClient(supabaseUrl, serviceRoleKey);

    // Route to handler based on action
    switch (action) {
      case 'status':
        return handleStatus(supabase, req, res);

      case 'count':
        return handleCount(supabase, res);

      case 'isOpen':
        return handleIsOpen(supabase, res);

      case 'foundingMember':
        return handleFoundingMember(supabase, req, res);

      case 'waveDistribution':
        return handleWaveDistribution(supabase, res);

      case 'recentActivity':
        return handleRecentActivity(supabase, res);

      case 'dailySignups':
        return handleDailySignups(supabase, req, res);

      case 'weeklySignups':
        return handleWeeklySignups(supabase, req, res);

      case 'monthlySignups':
        return handleMonthlySignups(supabase, req, res);

      case 'geography':
        return handleGeography(supabase, res);

      case 'deviceStats':
        return handleDeviceStats(supabase, res);

      default:
        return res.status(400).json({ error: `Unknown action: ${action}` });
    }
  } catch (error) {
    console.error('[waitlist] Unexpected error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
