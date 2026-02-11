import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// ============================================================================
// CONSOLIDATED ADMIN API
// ============================================================================
//
// All admin endpoints consolidated into a single serverless function.
// Use ?action=<actionName> or { action: "<actionName>" } in body.
//
// Available actions:
//   - healthCheck (GET)
//   - getStats (GET)
//   - getUser (GET) - requires ?email=
//   - searchUsers (GET)
//   - exportUsers (GET)
//   - updateUser (PATCH)
//   - deleteUser (DELETE)
//   - importUsers (POST)
//   - openWave (POST)
//   - promoteWave (POST)
//   - toggleWaitlist (POST)
//   - resendMagicLink (POST)
//   - bulkDeleteFallback (POST)
//   - anonymizeUser (POST)
//   - regenerateToken (POST)
//
// ============================================================================

// Constants
const MAX_FOUNDING_MEMBERS = 50;
const MAX_FOUNDING_MEMBER_CREATORS = 20;
const FROM_EMAIL = 'Lorem Curae <hello@loremcurae.com>';
const REDIRECT_URL = 'https://lorem-curae-waitlist.vercel.app/auth/callback';

// Helper: Validate admin auth
function validateAdminAuth(req: VercelRequest, adminSecret: string): boolean {
  const authHeader = req.headers.authorization;
  return authHeader === `Bearer ${adminSecret}`;
}

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

// ============================================================================
// ACTION HANDLERS
// ============================================================================

async function handleHealthCheck(supabase: SupabaseClient, res: VercelResponse) {
  const startTime = Date.now();

  const { count, error } = await supabase
    .from('waitlist')
    .select('*', { count: 'exact', head: true });

  return res.status(200).json({
    database_connected: !error,
    waitlist_table_exists: !error || error.code !== '42P01',
    row_count: count ?? 0,
    latency_ms: Date.now() - startTime,
  });
}

async function handleGetStats(supabase: SupabaseClient, res: VercelResponse) {
  const [total, founding, foundingCreator, wave1, wave2, wave3, fallback] = await Promise.all([
    supabase.from('waitlist').select('*', { count: 'exact', head: true }),
    supabase.from('waitlist').select('*', { count: 'exact', head: true }).eq('is_founding_member', true),
    supabase.from('waitlist').select('*', { count: 'exact', head: true }).eq('is_founding_member_creator', true),
    supabase.from('waitlist').select('*', { count: 'exact', head: true }).eq('wave_number', 1),
    supabase.from('waitlist').select('*', { count: 'exact', head: true }).eq('wave_number', 2),
    supabase.from('waitlist').select('*', { count: 'exact', head: true }).eq('wave_number', 3),
    supabase.from('waitlist').select('*', { count: 'exact', head: true }).eq('status', 'waiting_for_next_wave'),
  ]);

  return res.status(200).json({
    total_users: total.count ?? 0,
    total_founding_members: founding.count ?? 0,
    total_founding_member_creators: foundingCreator.count ?? 0,
    wave_counts: {
      wave_1: wave1.count ?? 0,
      wave_2: wave2.count ?? 0,
      wave_3: wave3.count ?? 0,
    },
    fallback_count: fallback.count ?? 0,
  });
}

async function handleGetUser(supabase: SupabaseClient, req: VercelRequest, res: VercelResponse) {
  const email = req.query.email as string;
  if (!email) return res.status(400).json({ error: 'email query parameter is required' });

  const trimmedEmail = email.trim().toLowerCase();
  if (!isValidEmail(trimmedEmail)) return res.status(400).json({ error: 'Invalid email format' });

  const { data, error } = await supabase
    .from('waitlist')
    .select('*')
    .eq('email', trimmedEmail)
    .maybeSingle();

  if (error) return res.status(500).json({ error: 'Failed to fetch user' });
  if (!data) return res.status(404).json({ error: 'User not found' });

  return res.status(200).json(data);
}

async function handleSearchUsers(supabase: SupabaseClient, req: VercelRequest, res: VercelResponse) {
  const { email, wave_number, status, is_founding_member, limit = '50' } = req.query;

  let query = supabase
    .from('waitlist')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(Math.min(parseInt(limit as string) || 50, 200));

  if (email) query = query.ilike('email', `%${email}%`);
  if (wave_number === 'null') query = query.is('wave_number', null);
  else if (wave_number) query = query.eq('wave_number', parseInt(wave_number as string));
  if (status) query = query.eq('status', status);
  if (is_founding_member === 'true') query = query.eq('is_founding_member', true);
  if (is_founding_member === 'false') query = query.eq('is_founding_member', false);

  const { data, error } = await query;
  if (error) return res.status(500).json({ error: 'Failed to search users' });

  return res.status(200).json({ results: data || [] });
}

async function handleUpdateUser(supabase: SupabaseClient, req: VercelRequest, res: VercelResponse) {
  const { email, ...updates } = req.body || {};
  if (!email) return res.status(400).json({ error: 'email is required' });

  const trimmedEmail = email.trim().toLowerCase();

  const { data, error } = await supabase
    .from('waitlist')
    .update(updates)
    .eq('email', trimmedEmail)
    .select('*')
    .single();

  if (error) return res.status(500).json({ error: 'Failed to update user' });
  if (!data) return res.status(404).json({ error: 'User not found' });

  return res.status(200).json({ updated: true, user: data });
}

async function handleDeleteUser(supabase: SupabaseClient, req: VercelRequest, res: VercelResponse) {
  const { email } = req.body || {};
  if (!email) return res.status(400).json({ error: 'email is required' });

  const trimmedEmail = email.trim().toLowerCase();

  const { error } = await supabase
    .from('waitlist')
    .delete()
    .eq('email', trimmedEmail);

  if (error) return res.status(500).json({ error: 'Failed to delete user' });

  return res.status(200).json({ deleted: true, email: trimmedEmail });
}

async function handleOpenWave(supabase: SupabaseClient, req: VercelRequest, res: VercelResponse) {
  const { wave_number } = req.body || {};
  if (!wave_number || typeof wave_number !== 'number') {
    return res.status(400).json({ error: 'wave_number must be an integer' });
  }

  const { data, error } = await supabase
    .from('waitlist')
    .update({ wave_number, status: 'active' })
    .eq('status', 'waiting_for_next_wave')
    .select('id');

  if (error) return res.status(500).json({ error: 'Failed to open wave' });

  return res.status(200).json({
    success: true,
    wave_number,
    users_moved: data?.length || 0,
  });
}

async function handlePromoteWave(supabase: SupabaseClient, req: VercelRequest, res: VercelResponse) {
  const { target_wave, limit } = req.body || {};
  if (!target_wave || !limit) {
    return res.status(400).json({ error: 'target_wave and limit are required' });
  }

  const { data: fallbackUsers } = await supabase
    .from('waitlist')
    .select('email')
    .eq('status', 'waiting_for_next_wave')
    .order('created_at', { ascending: true })
    .limit(limit);

  if (!fallbackUsers?.length) {
    return res.status(200).json({ promoted_count: 0, promoted_users: [] });
  }

  const emails = fallbackUsers.map(u => u.email);
  const { data: promotedUsers, error } = await supabase
    .from('waitlist')
    .update({ wave_number: target_wave, status: 'active' })
    .in('email', emails)
    .select('*');

  if (error) return res.status(500).json({ error: 'Failed to promote users' });

  return res.status(200).json({
    promoted_count: promotedUsers?.length || 0,
    promoted_users: promotedUsers || [],
  });
}

async function handleToggleWaitlist(supabase: SupabaseClient, req: VercelRequest, res: VercelResponse) {
  const { open } = req.body || {};
  if (typeof open !== 'boolean') {
    return res.status(400).json({ error: '"open" must be a boolean' });
  }

  const { error } = await supabase
    .from('feature_flags')
    .update({ enabled_for: open ? ['public'] : [] })
    .eq('key', 'waitlist_open');

  if (error) return res.status(500).json({ error: 'Failed to toggle waitlist' });

  return res.status(200).json({ open });
}

async function handleResendMagicLink(supabase: SupabaseClient, req: VercelRequest, res: VercelResponse) {
  const resendApiKey = process.env.RESEND_API_KEY;
  if (!resendApiKey) return res.status(500).json({ error: 'Email service not configured' });

  const { email } = req.body || {};
  if (!email) return res.status(400).json({ error: 'email is required' });

  const trimmedEmail = email.trim().toLowerCase();

  // Check user exists
  const { data: user } = await supabase
    .from('waitlist')
    .select('email')
    .eq('email', trimmedEmail)
    .maybeSingle();

  if (!user) return res.status(404).json({ error: 'User not found in waitlist' });

  // Generate magic link
  const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
    type: 'magiclink',
    email: trimmedEmail,
    options: { redirectTo: REDIRECT_URL },
  });

  if (linkError || !linkData?.properties?.action_link) {
    return res.status(500).json({ error: 'Magic link generation failed' });
  }

  // Send email
  const emailRes = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: FROM_EMAIL,
      to: trimmedEmail,
      subject: 'Your secure sign-in link',
      html: `<p>Here's your secure magic link to sign in:</p><p><a href="${linkData.properties.action_link}">Click here to sign in</a></p>`,
    }),
  });

  if (!emailRes.ok) return res.status(500).json({ error: 'Email sending failed' });

  return res.status(200).json({ sent: true, email: trimmedEmail });
}

async function handleBulkDeleteFallback(supabase: SupabaseClient, req: VercelRequest, res: VercelResponse) {
  const { limit = 100, confirm } = req.body || {};
  if (confirm !== true) {
    return res.status(400).json({ error: 'Must set confirm: true to proceed' });
  }

  const { data: users } = await supabase
    .from('waitlist')
    .select('email')
    .eq('status', 'waiting_for_next_wave')
    .order('created_at', { ascending: true })
    .limit(limit);

  if (!users?.length) {
    return res.status(200).json({ deleted_count: 0 });
  }

  const emails = users.map(u => u.email);
  const { error } = await supabase
    .from('waitlist')
    .delete()
    .in('email', emails);

  if (error) return res.status(500).json({ error: 'Failed to delete users' });

  return res.status(200).json({ deleted_count: emails.length });
}

async function handleExportUsers(supabase: SupabaseClient, req: VercelRequest, res: VercelResponse) {
  const limit = Math.min(parseInt(req.query.limit as string) || 500, 5000);

  const { data, error } = await supabase
    .from('waitlist')
    .select('*')
    .order('created_at', { ascending: true })
    .limit(limit);

  if (error) return res.status(500).json({ error: 'Failed to export users' });

  // Generate CSV
  const headers = ['email', 'segment', 'wave_number', 'status', 'is_creator', 'is_founding_member', 'is_founding_member_creator', 'wants_tester_access', 'created_at'];
  const rows = (data || []).map(row =>
    headers.map(h => {
      const val = row[h];
      if (val === null || val === undefined) return '';
      const str = String(val);
      return str.includes(',') || str.includes('"') ? `"${str.replace(/"/g, '""')}"` : str;
    }).join(',')
  );
  const csv = [headers.join(','), ...rows].join('\r\n');

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="waitlist-export.csv"`);
  return res.status(200).send(csv);
}

async function handleWaitlistAnalytics(supabase: SupabaseClient, res: VercelResponse) {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setUTCDate(thirtyDaysAgo.getUTCDate() - 30);
  thirtyDaysAgo.setUTCHours(0, 0, 0, 0);

  const [total, founding, foundingCreator, last30Days, waveDist, statusDist] = await Promise.all([
    supabase.from('waitlist').select('*', { count: 'exact', head: true }),
    supabase.from('waitlist').select('*', { count: 'exact', head: true }).eq('is_founding_member', true),
    supabase.from('waitlist').select('*', { count: 'exact', head: true }).eq('is_founding_member_creator', true),
    supabase.from('waitlist').select('created_at').gte('created_at', thirtyDaysAgo.toISOString()),
    supabase.from('waitlist').select('wave_number'),
    supabase.from('waitlist').select('status'),
  ]);

  // Aggregate by day
  const dayCounts = new Map<string, number>();
  (last30Days.data || []).forEach(row => {
    const day = row.created_at.split('T')[0];
    dayCounts.set(day, (dayCounts.get(day) || 0) + 1);
  });
  const signups_last_30_days = Array.from(dayCounts.entries())
    .map(([day, count]) => ({ day, count }))
    .sort((a, b) => a.day.localeCompare(b.day));

  // Aggregate by wave
  const waveCounts = new Map<number | null, number>();
  (waveDist.data || []).forEach(row => {
    waveCounts.set(row.wave_number, (waveCounts.get(row.wave_number) || 0) + 1);
  });
  const wave_distribution = Array.from(waveCounts.entries())
    .map(([wave_number, count]) => ({ wave_number, count }))
    .sort((a, b) => (a.wave_number ?? 999) - (b.wave_number ?? 999));

  // Aggregate by status
  const statusCounts = new Map<string, number>();
  (statusDist.data || []).forEach(row => {
    statusCounts.set(row.status || 'unknown', (statusCounts.get(row.status || 'unknown') || 0) + 1);
  });
  const status_distribution = Array.from(statusCounts.entries())
    .map(([status, count]) => ({ status, count }))
    .sort((a, b) => b.count - a.count);

  return res.status(200).json({
    total_signups: total.count ?? 0,
    signups_last_30_days,
    wave_distribution,
    status_distribution,
    founding_member_count: founding.count ?? 0,
    founding_member_creator_count: foundingCreator.count ?? 0,
  });
}

async function handleAnonymizeUser(supabase: SupabaseClient, req: VercelRequest, res: VercelResponse) {
  const { email } = req.body || {};
  if (!email) return res.status(400).json({ error: 'email is required' });

  const trimmedEmail = email.trim().toLowerCase();
  if (!isValidEmail(trimmedEmail)) return res.status(400).json({ error: 'Invalid email format' });

  if (trimmedEmail.startsWith('anon_') && trimmedEmail.endsWith('@example.com')) {
    return res.status(400).json({ error: 'User is already anonymized' });
  }

  const { data: existingUser, error: fetchError } = await supabase
    .from('waitlist')
    .select('*')
    .eq('email', trimmedEmail)
    .maybeSingle();

  if (fetchError) return res.status(500).json({ error: 'Failed to verify user' });
  if (!existingUser) return res.status(404).json({ error: 'User not found' });

  const anonymizedEmail = `anon_${crypto.randomUUID()}@example.com`;
  const { error: updateError } = await supabase
    .from('waitlist')
    .update({ email: anonymizedEmail })
    .eq('email', trimmedEmail);

  if (updateError) return res.status(500).json({ error: 'Failed to anonymize user' });

  return res.status(200).json({
    anonymized: true,
    original_email: trimmedEmail,
    new_email: anonymizedEmail,
  });
}

async function handleRegenerateToken(supabase: SupabaseClient, req: VercelRequest, res: VercelResponse) {
  const { email } = req.body || {};
  if (!email) return res.status(400).json({ error: 'email is required' });

  const trimmedEmail = email.trim().toLowerCase();
  if (!isValidEmail(trimmedEmail)) return res.status(400).json({ error: 'Invalid email format' });

  const { data: user, error: fetchError } = await supabase
    .from('waitlist')
    .select('email')
    .eq('email', trimmedEmail)
    .maybeSingle();

  if (fetchError) return res.status(500).json({ error: 'Failed to verify user' });
  if (!user) return res.status(404).json({ error: 'User not found in waitlist' });

  const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
    type: 'magiclink',
    email: trimmedEmail,
  });

  if (linkError || !linkData?.properties?.action_link) {
    return res.status(500).json({ error: 'Token generation failed' });
  }

  // Extract token from URL
  try {
    const url = new URL(linkData.properties.action_link);
    const token = url.searchParams.get('token');
    if (!token) return res.status(500).json({ error: 'Token extraction failed' });

    return res.status(200).json({
      regenerated: true,
      email: trimmedEmail,
      token: token,
    });
  } catch {
    return res.status(500).json({ error: 'Token extraction failed' });
  }
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // Validate environment
    const adminSecret = process.env.ADMIN_SECRET;
    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!adminSecret || !supabaseUrl || !serviceRoleKey) {
      return res.status(500).json({ error: 'Server configuration error' });
    }

    // Validate admin auth
    if (!validateAdminAuth(req, adminSecret)) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get action from query or body
    const action = (req.query.action as string) || req.body?.action;
    if (!action) {
      return res.status(400).json({ error: 'action parameter is required' });
    }

    // Create Supabase client
    const supabase = createSupabaseClient(supabaseUrl, serviceRoleKey);

    // Route to handler based on action
    switch (action) {
      // GET actions
      case 'healthCheck':
        if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
        return handleHealthCheck(supabase, res);

      case 'getStats':
        if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
        return handleGetStats(supabase, res);

      case 'getUser':
        if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
        return handleGetUser(supabase, req, res);

      case 'searchUsers':
        if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
        return handleSearchUsers(supabase, req, res);

      case 'exportUsers':
        if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
        return handleExportUsers(supabase, req, res);

      // PATCH actions
      case 'updateUser':
        if (req.method !== 'PATCH' && req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
        return handleUpdateUser(supabase, req, res);

      // DELETE actions
      case 'deleteUser':
        if (req.method !== 'DELETE' && req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
        return handleDeleteUser(supabase, req, res);

      // POST actions
      case 'openWave':
        if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
        return handleOpenWave(supabase, req, res);

      case 'promoteWave':
        if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
        return handlePromoteWave(supabase, req, res);

      case 'toggleWaitlist':
        if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
        return handleToggleWaitlist(supabase, req, res);

      case 'resendMagicLink':
        if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
        return handleResendMagicLink(supabase, req, res);

      case 'bulkDeleteFallback':
        if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
        return handleBulkDeleteFallback(supabase, req, res);

      case 'waitlistAnalytics':
        if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
        return handleWaitlistAnalytics(supabase, res);

      case 'anonymizeUser':
        if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
        return handleAnonymizeUser(supabase, req, res);

      case 'regenerateToken':
        if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
        return handleRegenerateToken(supabase, req, res);

      default:
        return res.status(400).json({ error: `Unknown action: ${action}` });
    }
  } catch (error) {
    console.error('[admin] Unexpected error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
