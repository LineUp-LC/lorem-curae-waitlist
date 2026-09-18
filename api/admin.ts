import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { validateAdminRequest } from './_adminAuth.js';
import { sendFollowupEmail } from '../src/lib/email/followupTemplates.js';
import type { UserRole, FollowupEventType } from '../src/lib/email/followupTemplates.js';
import { dripTemplates } from '../src/lib/email/dripTemplates.js';
import type { DripEventType } from '../src/lib/email/dripTemplates.js';

// ============================================================================
// CONSOLIDATED ADMIN API
// ============================================================================
//
// All admin endpoints consolidated into a single serverless function.
// Use ?action=<actionName> or { action: "<actionName>" } in body.
//
// Available actions:
//   - whoami (GET) - is this session an admin? Used by the admin shell gate
//   - healthCheck (GET)
//   - getStats (GET)
//   - getUser (GET) - requires ?email=
//   - get-waitlist-user (GET) - requires ?email=; row + delivery log + neighbours
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
//   - resendDripEmail (POST) - repairs ONE failed drip_send_log row
//
// ============================================================================

// Constants
// The founding caps used to be declared here too, at 50 and 20, and were never read --
// declared, unused, and disagreeing with the values api/signup.ts actually enforces.
// Removed 2026-09-18. The live cap is MAX_FOUNDING_MEMBERS in src/lib/foundingMembers.ts.
const FROM_EMAIL = 'Curae <hello@loremcurae.com>';
const REDIRECT_URL = 'https://lorem-curae-waitlist.vercel.app/auth/callback';
const UNSUBSCRIBE_FALLBACK = 'mailto:hello@loremcurae.com?subject=Unsubscribe';

// Columns updateUser is allowed to write.
//
// It previously spread the whole request body into the UPDATE with no filter,
// so any admin-authed caller could write ANY column -- waitlist_position
// (which decides founding classification, positions <= 100), unsubscribe_token
// (which would silently invalidate the unsubscribe link already sitting in
// people's inboxes), unsubscribed_at, created_at, even email. Closed
// 2026-09-18.
//
// The list is admin DECISIONS only. Three deliberate exclusions:
//   - waitlist_position: changes founding classification and the running order.
//     No use case has been stated for editing it by hand, and it is one of the
//     two columns that made the open write a real hole.
//   - has_access: owned by the grant-access action, which does more than set
//     the boolean. Setting it here would look like granting access and would
//     not grant it.
//   - wants_tester_access / wants_beta / text_opt_in: these are the PERSON's
//     declarations, not ours. is_tester exists so an admin decision never
//     overwrites a request (migration 20260918_add_waitlist_is_tester.sql).
const UPDATABLE_USER_COLUMNS = new Set([
  'wave_number',
  'status',
  'is_founding_member',
  'is_founding_member_creator',
  'is_creator',
  'creator_wave_number',
  'price_locked',
  'is_tester',
]);

// Enforced by the status_check CHECK constraint on public.waitlist. Validated
// here so a bad value returns a readable 400 instead of an opaque 500.
const VALID_WAITLIST_STATUSES = new Set(['active', 'waiting_for_next_wave']);

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

  const keys = Object.keys(updates);
  if (keys.length === 0) {
    return res.status(400).json({ error: 'No fields to update' });
  }

  // Reject loudly rather than dropping quietly: a save that returns 200 having
  // written nothing is worse than one that fails, because the caller believes
  // the change landed.
  const rejected = keys.filter((k) => !UPDATABLE_USER_COLUMNS.has(k));
  if (rejected.length > 0) {
    return res.status(400).json({
      error: `Not updatable through this endpoint: ${rejected.join(', ')}`,
      updatable: [...UPDATABLE_USER_COLUMNS],
    });
  }

  if ('status' in updates && !VALID_WAITLIST_STATUSES.has(updates.status)) {
    return res.status(400).json({
      error: `Invalid status. Allowed: ${[...VALID_WAITLIST_STATUSES].join(', ')}`,
    });
  }

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
    database: { ok: !dbResult.error, latency_ms: 0 },
    email: { ok: !!process.env.RESEND_API_KEY, provider: 'Resend', last_bounce_check: new Date().toISOString() },
    magic_link: { ok: !!process.env.SUPABASE_URL && !!process.env.SUPABASE_SERVICE_ROLE_KEY, last_token_created: new Date().toISOString() },
    feature_flags: { ok: !flagsResult.error, missing_flags: [], invalid_type_flags: [], unexpected_flags: [] },
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

// ============================================================================
// USER DETAIL PAGE  (/admin/user/:email)
// ============================================================================

// Events a resend can actually send: exactly the ones that still have a
// template.
//
// A drip_send_log row can name an event whose template no longer exists.
// founding_rate_urgency is the live case -- retired because "its whole body was
// a price promise nothing honours" (src/lib/email/dripTemplates.ts), and it
// left 15 failed rows behind, 0 ever delivered. Those rows are REPORTED on the
// page and never offered a Send button. Rebuilding one would mean writing a new
// price promise while the founding rate is under review.
const RESENDABLE_DRIP_EVENTS = new Set<string>(Object.keys(dripTemplates));

function unsubscribeUrlFor(token: string | null | undefined): string {
  const base = process.env.SUPABASE_URL;
  if (!base || !token) return UNSUBSCRIBE_FALLBACK;
  return `${base.replace(/\/$/, '')}/functions/v1/unsubscribe?token=${token}`;
}

// Mirrors the scheduler's fallback: a broken counter must never block a send.
async function fetchSlotsRemaining(supabase: SupabaseClient): Promise<string> {
  try {
    const { data, error } = await supabase
      .from('founding_member_slots')
      .select('slots_remaining')
      .single();
    if (error || data?.slots_remaining == null) return 'A limited number of';
    return String(data.slots_remaining);
  } catch {
    return 'A limited number of';
  }
}

async function handleGetWaitlistUser(supabase: SupabaseClient, req: VercelRequest, res: VercelResponse) {
  const email = req.query.email as string;
  if (!email) return res.status(400).json({ error: 'email query parameter is required' });

  const trimmedEmail = email.trim().toLowerCase();
  if (!isValidEmail(trimmedEmail)) return res.status(400).json({ error: 'Invalid email format' });

  const { data: user, error } = await supabase
    .from('waitlist')
    .select('*')
    .eq('email', trimmedEmail)
    .maybeSingle();

  if (error) return res.status(500).json({ error: 'Failed to fetch user' });
  if (!user) return res.status(404).json({ error: 'User not found' });

  // Delivery log. A FAILED READ IS NOT AN EMPTY LOG: returning [] here would
  // render as "no emails sent", which is a different and false statement. The
  // page shows an explicit couldn't-load state instead.
  const { data: dripRows, error: dripErr } = await supabase
    .from('drip_send_log')
    .select('id, drip_event, status, sent_at, error_text')
    .eq('user_id', user.id)
    .order('sent_at', { ascending: true });

  // Neighbours for prev/next, ordered by waitlist_position.
  // Positions are SPARSE (live range is 2..22 across 21 rows), so this steps to
  // the adjacent ROW and never to position +/- 1.
  let prev: { email: string; waitlist_position: number } | null = null;
  let next: { email: string; waitlist_position: number } | null = null;
  let index: number | null = null;

  const { count: total } = await supabase
    .from('waitlist')
    .select('*', { count: 'exact', head: true });

  if (user.waitlist_position != null) {
    const [{ data: p }, { data: n }, { count: idx }] = await Promise.all([
      supabase
        .from('waitlist')
        .select('email, waitlist_position')
        .lt('waitlist_position', user.waitlist_position)
        .order('waitlist_position', { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from('waitlist')
        .select('email, waitlist_position')
        .gt('waitlist_position', user.waitlist_position)
        .order('waitlist_position', { ascending: true })
        .limit(1)
        .maybeSingle(),
      supabase
        .from('waitlist')
        .select('*', { count: 'exact', head: true })
        .lte('waitlist_position', user.waitlist_position),
    ]);
    prev = p ?? null;
    next = n ?? null;
    index = idx ?? null;
  }

  return res.status(200).json({
    user,
    drips: dripErr ? null : (dripRows ?? []),
    drips_error: dripErr ? 'Failed to load the delivery log' : null,
    resendable_events: [...RESENDABLE_DRIP_EVENTS],
    neighbors: { prev, next, index, total: total ?? null },
  });
}

async function handleResendDripEmail(supabase: SupabaseClient, req: VercelRequest, res: VercelResponse) {
  const resendApiKey = process.env.RESEND_API_KEY;
  if (!resendApiKey) return res.status(500).json({ error: 'Email service not configured' });

  const { email, dripEvent } = req.body || {};
  if (!email || !dripEvent) return res.status(400).json({ error: 'email and dripEvent are required' });

  const trimmedEmail = email.trim().toLowerCase();
  if (!isValidEmail(trimmedEmail)) return res.status(400).json({ error: 'Invalid email format' });

  if (!RESENDABLE_DRIP_EVENTS.has(dripEvent)) {
    return res.status(400).json({
      error: `"${dripEvent}" has no template. It was retired and cannot be resent.`,
    });
  }

  const { data: user, error: userErr } = await supabase
    .from('waitlist')
    .select('id, email, unsubscribed_at, unsubscribe_token')
    .eq('email', trimmedEmail)
    .maybeSingle();

  if (userErr) return res.status(500).json({ error: 'Failed to fetch user' });
  if (!user) return res.status(404).json({ error: 'User not found' });

  // Same guard the scheduler applies. Never email someone who opted out.
  if (user.unsubscribed_at) {
    return res.status(409).json({ error: 'This person has unsubscribed. Nothing sent.' });
  }

  // This action REPAIRS a failure. It is not a general send: it requires an
  // existing row for this event, in state failed. That is what stops it being
  // used to email a delivered sequence twice.
  const { data: logRow, error: logErr } = await supabase
    .from('drip_send_log')
    .select('id, status')
    .eq('user_id', user.id)
    .eq('drip_event', dripEvent)
    .maybeSingle();

  if (logErr) return res.status(500).json({ error: 'Failed to read the delivery log' });
  if (!logRow) {
    return res.status(404).json({ error: 'No send was ever recorded for that email, so there is nothing to repair.' });
  }
  if (logRow.status !== 'failed') {
    return res.status(409).json({ error: 'That email was delivered. Not sending it a second time.' });
  }

  const slotsRemaining = await fetchSlotsRemaining(supabase);
  const template = dripTemplates[dripEvent as DripEventType];
  const html = template.html
    .replace(/\{\{UNSUBSCRIBE_URL\}\}/g, unsubscribeUrlFor(user.unsubscribe_token))
    .replace(/\{\{SLOTS_REMAINING\}\}/g, slotsRemaining);

  // SEND FIRST, THEN TOUCH THE LOG. Clearing the failed row before the send
  // would, on a failure, leave no record that we ever tried.
  let sendError: string | null = null;
  try {
    const emailRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: user.email,
        subject: template.subject,
        html,
      }),
    });
    if (!emailRes.ok) sendError = `Resend ${emailRes.status}: ${await emailRes.text()}`;
  } catch (err) {
    sendError = (err as Error).message;
  }

  if (sendError) {
    // Record the fresh failure on the same row. Nothing is lost, and the row
    // stays in state failed so it can be tried again.
    await supabase
      .from('drip_send_log')
      .update({ error_text: sendError, sent_at: new Date().toISOString() })
      .eq('id', logRow.id);
    return res.status(502).json({ error: sendError, sent: false });
  }

  // The failed row must stop being a failed row, or drip-scheduler's
  // idempotency check (which reads only whether a row EXISTS, never its status)
  // keeps skipping this event forever.
  //
  // This is ONE UPDATE rather than DELETE + INSERT. Same end state, and it is
  // atomic: a delete followed by a failed insert would leave the person emailed
  // with no record of it at all. The unique index is (user_id, drip_event), so
  // there is no second row to write anyway.
  const { data: updated, error: updErr } = await supabase
    .from('drip_send_log')
    .update({ status: 'sent', error_text: null, sent_at: new Date().toISOString() })
    .eq('id', logRow.id)
    .eq('status', 'failed')
    .select('id, drip_event, status, sent_at, error_text')
    .maybeSingle();

  // The email HAS been sent at this point. A log write that matched no row is
  // reported rather than swallowed, because the page would otherwise show a
  // row that is still failed and invite a second send.
  if (updErr || !updated) {
    return res.status(200).json({
      sent: true,
      log_updated: false,
      warning: 'The email was sent, but the delivery log could not be updated. Refresh before resending.',
    });
  }

  return res.status(200).json({ sent: true, log_updated: true, drip: updated });
}

// Answers one question: is the caller's session an admin?
//
// It does no work of its own. validateAdminRequest has already decided by the
// time this runs, so REACHING this handler at all is the answer, and a
// non-admin gets the same 401 every other action gives.
//
// It exists because SUPABASE_ADMIN_EMAILS is server-side only and the browser
// cannot read it, so the admin shell has no way to know whether a session is
// an admin session without asking. healthCheck was the alternative and counts
// a table to answer a question about identity.
function handleWhoami(res: VercelResponse) {
  return res.status(200).json({ admin: true });
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
    'metrics': { request_throughput: [], error_rate: [], latency_ms: [], queue_depth: [], email_send_rate: [], wave_progression_rate: [] },
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

      case 'whoami':
        if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
        return handleWhoami(res);

      case 'getUser':
        if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
        return handleGetUser(supabase, req, res);

      // Backs /admin/user/:email. Distinct from getUser, which returns the bare
      // row: this also returns the delivery log and the prev/next neighbours.
      case 'get-waitlist-user':
        if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
        return handleGetWaitlistUser(supabase, req, res);

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

      case 'resendDripEmail':
        if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
        return handleResendDripEmail(supabase, req, res);

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
