import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { validateAdminRequest } from './_adminAuth.js';
import { sendFollowupEmail } from '../src/lib/email/followupTemplates.js';
import type { UserRole, FollowupEventType } from '../src/lib/email/followupTemplates.js';

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
const FROM_EMAIL = 'Curae <hello@loremcurae.com>';
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
// HANDLERS MERGED FROM api/admin/* (consolidated to stay under Vercel 12-fn limit)
// ============================================================================

async function handleSummary(supabase: SupabaseClient, res: VercelResponse) {
  const [totalResult, waveResult, recentResult] = await Promise.all([
    supabase.from('waitlist').select('*', { count: 'exact', head: true }),
    supabase.from('waitlist').select('wave_number').not('wave_number', 'is', null),
    supabase.from('waitlist').select('email, created_at, wave_number').order('created_at', { ascending: false }).limit(10),
  ]);
  if (totalResult.error || waveResult.error || recentResult.error) {
    return res.status(500).json({ error: 'Failed to fetch summary data' });
  }
  const waveCounts = new Map<number, number>();
  for (const row of waveResult.data ?? []) {
    if (row.wave_number != null) waveCounts.set(row.wave_number, (waveCounts.get(row.wave_number) ?? 0) + 1);
  }
  return res.status(200).json({
    total_users: totalResult.count ?? 0,
    total_waves: waveCounts.size,
    users_per_wave: Array.from(waveCounts.entries()).map(([wave_number, count]) => ({ wave_number, count })).sort((a, b) => a.wave_number - b.wave_number),
    recent_signups: recentResult.data ?? [],
  });
}

async function handleHealthChecks(supabase: SupabaseClient, res: VercelResponse) {
  const [dbResult, flagsResult] = await Promise.all([
    supabase.from('waitlist').select('*', { count: 'exact', head: true }),
    supabase.from('feature_flags').select('*', { count: 'exact', head: true }),
  ]);
  return res.status(200).json({
    database: { ok: !dbResult.error },
    email: { ok: !!process.env.RESEND_API_KEY },
    magic_link: { ok: !!process.env.SUPABASE_URL && !!process.env.SUPABASE_SERVICE_ROLE_KEY },
    feature_flags: { ok: !flagsResult.error },
    timestamp: new Date().toISOString(),
  });
}

async function handleEmailSummary(supabase: SupabaseClient, res: VercelResponse) {
  const [sentResult, failedResult, recentFailuresResult] = await Promise.all([
    supabase.from('drip_send_log').select('*', { count: 'exact', head: true }).eq('status', 'sent'),
    supabase.from('drip_send_log').select('*', { count: 'exact', head: true }).eq('status', 'failed'),
    supabase.from('drip_send_log').select('drip_event, sent_at, user_id, waitlist!user_id(email)').eq('status', 'failed').order('sent_at', { ascending: false }).limit(5),
  ]);
  if (sentResult.error || failedResult.error) {
    return res.status(500).json({ error: 'Failed to fetch email summary' });
  }
  type FailureRow = { drip_event: string; sent_at: string; waitlist: { email: string } | null };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recent_failures = (recentFailuresResult.data ?? [] as any[]).map((row: FailureRow) => ({
    email: row.waitlist?.email ?? '(unknown)',
    template: row.drip_event,
    status: 'failed' as const,
    created_at: row.sent_at,
  }));
  return res.status(200).json({
    total_emails_sent: (sentResult.count ?? 0) + (failedResult.count ?? 0),
    total_bounced: 0,
    total_failed: failedResult.count ?? 0,
    recent_failures,
  });
}

async function handleWaitlistUsers(supabase: SupabaseClient, res: VercelResponse) {
  const { data, error } = await supabase
    .from('waitlist')
    .select('id, email, created_at, has_access, unsubscribed_at, wave_number, creator_wave_number, is_creator, is_founding_member, wants_tester_access')
    .order('created_at', { ascending: true });
  if (error) return res.status(500).json({ error: 'Failed to fetch waitlist users' });
  return res.status(200).json({ users: data ?? [] });
}

async function handleTextOptInUsers(supabase: SupabaseClient, res: VercelResponse) {
  const [usersResult, configResult] = await Promise.all([
    supabase.from('waitlist').select('email, phone_number, wave_number, is_founding_member, text_opt_in_offer_sent_at, created_at').eq('text_opt_in', true).order('created_at', { ascending: true }),
    supabase.from('text_opt_in_config').select('slots_remaining').single(),
  ]);
  if (usersResult.error) return res.status(500).json({ error: 'Failed to fetch opted-in users' });
  return res.status(200).json({
    users: usersResult.data ?? [],
    slots_remaining: (configResult.data as { slots_remaining: number } | null)?.slots_remaining ?? 0,
  });
}

interface WaitlistRow {
  id: string; email: string; has_access: boolean; unsubscribed_at: string | null;
  wave_number: number | null; creator_wave_number: number | null;
  is_creator: boolean; is_founding_member: boolean; wants_tester_access: boolean;
}

function determineUserRole(row: WaitlistRow): UserRole {
  if (row.is_founding_member) return 'founding_member';
  if (row.wants_tester_access) return row.is_creator ? 'tester_creator' : 'tester_consumer';
  if (row.is_creator && row.creator_wave_number) {
    if (row.creator_wave_number === 1) return 'creator_c1';
    if (row.creator_wave_number === 2) return 'creator_c2';
    if (row.creator_wave_number === 3) return 'creator_c3';
  }
  if (row.wave_number) return `consumer_wave_${row.wave_number}` as UserRole;
  return 'user';
}

function getEventType(role: UserRole): FollowupEventType | null {
  if (role === 'tester_creator' || role === 'tester_consumer') return 'tester_access_opened';
  if (role === 'creator_c1' || role === 'creator_c2' || role === 'creator_c3') return 'creator_tools_opened';
  if (role.startsWith('consumer_wave_')) return 'consumer_wave_opened';
  return null;
}

async function handleGrantAccess(supabase: SupabaseClient, req: VercelRequest, res: VercelResponse) {
  const { userIds } = req.body ?? {};
  if (!Array.isArray(userIds) || userIds.length === 0) {
    return res.status(400).json({ error: 'userIds must be a non-empty array' });
  }
  const { data: rows, error: fetchErr } = await supabase
    .from('waitlist')
    .select('id, email, has_access, unsubscribed_at, wave_number, creator_wave_number, is_creator, is_founding_member, wants_tester_access')
    .in('id', userIds);
  if (fetchErr || !rows) return res.status(500).json({ error: 'Failed to fetch waitlist records' });

  let granted = 0, skipped = 0, failed = 0;
  const results: Array<{ email: string; status: 'granted' | 'skipped' | 'failed'; reason?: string }> = [];

  for (const row of rows as WaitlistRow[]) {
    if (row.has_access) { skipped++; results.push({ email: row.email, status: 'skipped', reason: 'already_granted' }); continue; }
    if (row.unsubscribed_at) { skipped++; results.push({ email: row.email, status: 'skipped', reason: 'unsubscribed' }); continue; }
    const { error: updateErr } = await supabase.from('waitlist').update({ has_access: true }).eq('id', row.id);
    if (updateErr) { failed++; results.push({ email: row.email, status: 'failed', reason: updateErr.message }); continue; }
    const role = determineUserRole(row);
    const eventType = getEventType(role);
    if (eventType) {
      try { await sendFollowupEmail(row.email, role, eventType); }
      catch (emailErr) {
        console.error(JSON.stringify({ level: 'error', event: 'grant_access_email_failed', email: row.email.substring(0, 3) + '***', error: emailErr instanceof Error ? emailErr.message : String(emailErr) }));
        granted++; results.push({ email: row.email, status: 'granted', reason: 'email_failed' }); continue;
      }
    }
    granted++; results.push({ email: row.email, status: 'granted' });
  }
  return res.status(200).json({ granted, skipped, failed, results });
}

function getStubResponse(action: string): Record<string, unknown> {
  const stubs: Record<string, Record<string, unknown>> = {
    'admin-activity': { events: [] },
    'activity-log': { logs: [] },
    'email-templates': { templates: [] },
    'email-events': { events: [] },
    'email-analytics': { total_emails_sent: 0, total_bounced: 0, bounce_rate: 0, template_stats: [], last_30_days: [] },
    'feature-flags': { flags: [] },
    'waves': { waves: [] },
    'metrics': { signups_over_time: [], api_latency: [], error_rate: [], active_users: [], email_volume: [] },
    'notifications': { notifications: [] },
    'incidents': { incidents: [] },
  };
  return stubs[action] ?? {};
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // Validate admin auth via Supabase JWT
    const auth = await validateAdminRequest(req);
    if (!auth.ok) return res.status(auth.status).json({ error: auth.error });
    const supabase = auth.supabase;

    // Get action from query or body
    const action = (req.query.action as string) || req.body?.action;
    if (!action) {
      return res.status(400).json({ error: 'action parameter is required' });
    }

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

      // Merged from api/admin/* files
      case 'summary':
        if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
        return handleSummary(supabase, res);

      case 'health-checks':
        if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
        return handleHealthChecks(supabase, res);

      case 'email-summary':
        if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
        return handleEmailSummary(supabase, res);

      case 'waitlist-users':
        if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
        return handleWaitlistUsers(supabase, res);

      case 'text-opt-in-users':
        if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
        return handleTextOptInUsers(supabase, res);

      case 'grant-access':
        if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
        return handleGrantAccess(supabase, req, res);

      case 'admin-activity':
      case 'activity-log':
      case 'email-templates':
      case 'email-events':
      case 'email-analytics':
      case 'feature-flags':
      case 'waves':
      case 'metrics':
      case 'notifications':
      case 'incidents':
        // Stub endpoints — not yet implemented
        return res.status(200).json(getStubResponse(action));

      default:
        return res.status(400).json({ error: `Unknown action: ${action}` });
    }
  } catch (error) {
    console.error('[admin] Unexpected error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
