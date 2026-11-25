import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { validateAdminRequest } from './_adminAuth.js';
import { sendFollowupEmail } from '../src/lib/email/followupTemplates.js';
import type { UserRole, FollowupEventType } from '../src/lib/email/followupTemplates.js';
import { dripTemplates } from '../src/lib/email/dripTemplates.js';
import type { DripEventType } from '../src/lib/email/dripTemplates.js';
import { checkSendable, excludeIds, firstEmbedded, readOutreachStatus, readRemovedIds } from './_outreach.js';
import type { SendCheck } from './_outreach.js';
import { passOnTextOffer } from './_textOffer.js';
import {
  isOutreachStatus,
  notesNamePerson,
  OUTREACH_NOTES_MAX,
  OUTREACH_NOTES_NAMES_PERSON_ERROR,
  OUTREACH_REMOVED,
} from '../src/lib/outreachStatus.js';
import { MAX_FOUNDING_MEMBERS } from '../src/lib/foundingMembers.js';
import { greetingHtml, validateFirstName } from './_greeting.js';

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
//   - regenerateToken (POST)
//   - resendDripEmail (POST) - repairs ONE failed drip_send_log row
//   - updateOutreach (POST) - outreach status, last-emailed date, notes (#26)
//
// REMOVED (#26): a signup whose waitlist_outreach.outreach_status is 'removed'
// is left out of every count and every send here. Reads of the Removed set fail
// closed: a count returns an error, a send does not happen.
//
// ============================================================================

// Constants
// The founding caps used to be declared here too, at 50 and 20, and were never read --
// declared, unused, and disagreeing with the values api/signup.ts actually enforces.
// Removed 2026-09-18. The live cap is MAX_FOUNDING_MEMBERS in src/lib/foundingMembers.ts.
const FROM_EMAIL = 'Curae <hello@loremcurae.com>';
const REDIRECT_URL = 'https://lorem-curae-waitlist.vercel.app/auth/callback';
const UNSUBSCRIBE_FALLBACK = 'mailto:hello@loremcurae.com?subject=Unsubscribe';

// The admin resend actions' answer to a checkSendable refusal. null = send.
function adminSendRefusal(check: SendCheck): { status: number; error: string } | null {
  if (check.sendable) return null;
  if (check.reason === 'unsubscribed') return { status: 409, error: 'This person has unsubscribed. Nothing sent.' };
  if (check.reason === 'removed') return { status: 409, error: 'This person is Removed. Nothing sent.' };
  return { status: 500, error: 'Could not confirm outreach status. Nothing sent.' };
}

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
//   - waitlist_position: the running order (it decided founding classification
//     until waitlist #43). No use case has been stated for editing it by hand,
//     and it is one of the two columns that made the open write a real hole.
//   - founding_number (waitlist #43) is not listed either: it is stamped once by
//     the database and never renumbered. Toggling is_founding_member gives or
//     clears it (trg_sync_founding_number); a direct write is ignored there.
//   - has_access: owned by the grant-access action, which does more than set
//     the boolean. Setting it here would look like granting access and would
//     not grant it.
//   - wants_tester_access / wants_beta / text_opt_in: these are the PERSON's
//     declarations, not ours. is_tester exists so an admin decision never
//     overwrites a request (migration 20260918_add_waitlist_is_tester.sql).
//
// first_name is the one exception to "decisions only" (waitlist #40): it is
// editable so an admin can fix a typo, under the same check as signup
// (validateFirstName). It is never cleared: a blank is refused like at signup.
const UPDATABLE_USER_COLUMNS = new Set([
  'first_name',
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

// The waitlist columns a row sent to the admin browser may carry (#35 item 2).
// unsubscribe_token is left out on purpose: it is the secret in every unsubscribe
// link, and no admin screen shows it. Built from what the readers use: the person
// page (src/pages/admin/user/page.tsx WaitlistUser), the search page (email,
// created_at, wave_number), and the server code that reads these rows
// (WaitlistRow, is_tester, waitlist_position, id). Add a column here before a
// screen reads it. One literal string, so supabase-js can type the rows it returns.
const ADMIN_WAITLIST_COLUMNS =
  'id, email, first_name, created_at, updated_at, wave_number, status, segment, wants_beta, wants_tester_access, is_tester, is_creator, is_founding_member, is_founding_member_creator, creator_wave_number, price_locked, waitlist_position, founding_number, unsubscribed_at, has_access, phone_number, text_opt_in';

// The database's answer when turning founding on would pass the 100 cap
// (sync_founding_number, migration 20261125042640_founding_cap_on_switch.sql).
const FOUNDING_CAP_FULL_CODE = 'FC001';

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
// STATUS-CHANGE NOTIFICATIONS
// ============================================================================
//
// AN EMAIL FAILURE NEVER FAILS THE ACTION THAT CAUSED IT. Promoting forty people
// into a wave is a database change that succeeded; one bounced address does not
// undo it, and reporting the whole promotion as failed would invite an admin to run
// it again. Every outcome is caught and RETURNED instead, so the caller can see
// exactly who was told and who was not.
//
// Deliverability is not decided here. sendFollowupEmail owns the unsubscribe guard
// and the once-per-instance dedupe, so this reports "skipped" rather than deciding
// it -- one place where that judgement lives.

interface NotifyOutcome { email: string; event: string; status: 'sent' | 'skipped' | 'failed'; reason?: string }

async function notifyStatusChange(
  row: WaitlistRow,
  eventType: FollowupEventType,
  vars?: Record<string, string | number>,
): Promise<NotifyOutcome> {
  try {
    const r = await sendFollowupEmail(row.email, determineUserRole(row), eventType, vars);
    if (r.skipped) return { email: row.email, event: eventType, status: 'skipped', reason: r.skippedReason };
    return { email: row.email, event: eventType, status: 'sent' };
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    console.error(JSON.stringify({ level: 'error', event: 'status_change_email_failed', eventType, reason }));
    return { email: row.email, event: eventType, status: 'failed', reason };
  }
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
  const removed = await readRemovedIds(supabase);
  if (!removed.ok) return res.status(500).json({ error: 'Failed to read removed signups' });
  const count = () => excludeIds(supabase.from('waitlist').select('*', { count: 'exact', head: true }), removed.ids);

  const [total, founding, foundingCreator, wave1, wave2, wave3, fallback] = await Promise.all([
    count(),
    count().eq('is_founding_member', true),
    count().eq('is_founding_member_creator', true),
    count().eq('wave_number', 1),
    count().eq('wave_number', 2),
    count().eq('wave_number', 3),
    count().eq('status', 'waiting_for_next_wave'),
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
    .select(ADMIN_WAITLIST_COLUMNS)
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
    .select(ADMIN_WAITLIST_COLUMNS)
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

  // Same check and wording as signup (validateFirstName, api/_greeting.ts). The
  // trimmed value is what gets written.
  if ('first_name' in updates) {
    const firstName = validateFirstName(updates.first_name);
    if (!firstName.ok) return res.status(400).json({ error: firstName.error });
    updates.first_name = firstName.value;
  }

  if ('status' in updates && !VALID_WAITLIST_STATUSES.has(updates.status)) {
    return res.status(400).json({
      error: `Invalid status. Allowed: ${[...VALID_WAITLIST_STATUSES].join(', ')}`,
    });
  }

  // READ BEFORE WRITING. A status-change email is a statement about a TRANSITION,
  // so it cannot be derived from the new row alone: "you have moved from Wave 1 to
  // Wave 3" needs the 1, and re-saving a form with an unchanged wave must send
  // nothing at all.
  const { data: prior } = await supabase
    .from('waitlist')
    .select('id, email, has_access, unsubscribed_at, wave_number, creator_wave_number, is_creator, is_founding_member, wants_tester_access, is_tester')
    .eq('email', trimmedEmail)
    .maybeSingle();

  const { data, error } = await supabase
    .from('waitlist')
    .update(updates)
    .eq('email', trimmedEmail)
    .select(ADMIN_WAITLIST_COLUMNS)
    .single();

  // Turning founding on past the cap is refused by the database trigger and
  // nothing is written (#44).
  if (error?.code === FOUNDING_CAP_FULL_CODE) {
    return res.status(409).json({ error: 'Founding spots are full (100 of 100). Nothing was changed.' });
  }
  if (error) return res.status(500).json({ error: 'Failed to update user' });
  if (!data) return res.status(404).json({ error: 'User not found' });

  // Notify on what actually changed. Without a prior row there is no transition to
  // describe, so nothing is sent -- silence is the honest answer to "we do not know
  // what this was before".
  const emails: NotifyOutcome[] = [];
  if (prior) {
    const before = prior as unknown as WaitlistRow & { is_tester: boolean };
    const after = data as unknown as WaitlistRow & { is_tester: boolean };

    // Selected as a tester. One direction only: un-selecting someone is not news we
    // have copy for, and "you are no longer a tester" is a decision, not a rider.
    if (!before.is_tester && after.is_tester) {
      emails.push(await notifyStatusChange(after, 'tester_selected'));
    }

    if (before.wave_number !== after.wave_number && after.wave_number != null) {
      if (before.wave_number == null) {
        emails.push(await notifyStatusChange(after, 'wave_assigned', { WAVE: after.wave_number }));
      } else {
        // Sent on BACKWARD moves too. Going quiet on bad news is worse, and
        // role_downgraded_generic already sets that precedent. The template is
        // neutral precisely so it reads correctly either way.
        emails.push(await notifyStatusChange(after, 'wave_changed', {
          PREVIOUS_WAVE: before.wave_number,
          WAVE: after.wave_number,
        }));
      }
    }
  }

  return res.status(200).json({ updated: true, user: data, emails });
}

async function handleDeleteUser(supabase: SupabaseClient, req: VercelRequest, res: VercelResponse) {
  const { email } = req.body || {};
  if (!email) return res.status(400).json({ error: 'email is required' });

  const trimmedEmail = email.trim().toLowerCase();

  // Decision 7a, enforced here and not only in the browser (#26, decision 4a):
  // deleting someone who asked not to be contacted (Removed or unsubscribed),
  // or whose outreach record cannot be read, needs confirm_contact_warning.
  const { data: target, error: targetErr } = await supabase
    .from('waitlist')
    .select('id, unsubscribed_at')
    .eq('email', trimmedEmail)
    .maybeSingle();
  if (targetErr) return res.status(500).json({ error: 'Failed to verify user' });
  if (!target) return res.status(404).json({ error: 'User not found' });

  const contact = await checkSendable(supabase, target);
  const needsConfirm = !contact.sendable;
  if (needsConfirm && (req.body || {}).confirm_contact_warning !== true) {
    return res.status(409).json({
      error: 'This person asked not to be contacted, or their outreach record could not be read. Tick the confirmation box to delete.',
    });
  }

  const { error } = await supabase
    .from('waitlist')
    .delete()
    .eq('id', target.id);

  if (error) return res.status(500).json({ error: 'Failed to delete user' });

  return res.status(200).json({ deleted: true, email: trimmedEmail });
}

async function handleOpenWave(supabase: SupabaseClient, req: VercelRequest, res: VercelResponse) {
  const { wave_number } = req.body || {};
  if (!wave_number || typeof wave_number !== 'number') {
    return res.status(400).json({ error: 'wave_number must be an integer' });
  }

  // Removed people are not moved into a wave (#26). A filtered UPDATE cannot
  // filter on waitlist_outreach, so read the eligible ids first, then update
  // exactly those.
  const removed = await readRemovedIds(supabase);
  if (!removed.ok) return res.status(500).json({ error: 'Failed to read removed signups' });

  const { data: waiting, error: waitingErr } = await excludeIds(
    supabase.from('waitlist').select('id').eq('status', 'waiting_for_next_wave'),
    removed.ids,
  );
  if (waitingErr) return res.status(500).json({ error: 'Failed to open wave' });

  const waitingIds = (waiting ?? []).map((r: { id: string }) => r.id);
  if (waitingIds.length === 0) {
    return res.status(200).json({
      success: true, wave_number, users_moved: 0,
      emails_sent: 0, emails_skipped: 0, emails_failed: 0, emails: [],
    });
  }

  const { data, error } = await supabase
    .from('waitlist')
    .update({ wave_number, status: 'active' })
    .in('id', waitingIds)
    .eq('status', 'waiting_for_next_wave')
    .select('*');

  if (error) return res.status(500).json({ error: 'Failed to open wave' });

  // Everyone here came OUT of the holding pool, so this is an assignment rather
  // than a move: they had no wave to be moved from.
  const emails: NotifyOutcome[] = [];
  for (const row of (data || []) as unknown as WaitlistRow[]) {
    emails.push(await notifyStatusChange(row, 'wave_assigned', { WAVE: wave_number }));
  }

  return res.status(200).json({
    success: true,
    wave_number,
    users_moved: data?.length || 0,
    emails_sent: emails.filter((e) => e.status === 'sent').length,
    emails_skipped: emails.filter((e) => e.status === 'skipped').length,
    emails_failed: emails.filter((e) => e.status === 'failed').length,
    emails,
  });
}

async function handlePromoteWave(supabase: SupabaseClient, req: VercelRequest, res: VercelResponse) {
  const { target_wave, limit } = req.body || {};
  if (!target_wave || !limit) {
    return res.status(400).json({ error: 'target_wave and limit are required' });
  }

  // Removed people are not promoted (#26). Excluded BEFORE the limit, so the
  // batch still fills to `limit` from the people who remain.
  const removed = await readRemovedIds(supabase);
  if (!removed.ok) return res.status(500).json({ error: 'Failed to read removed signups' });

  const { data: fallbackUsers } = await excludeIds(
    supabase
      .from('waitlist')
      .select('email')
      .eq('status', 'waiting_for_next_wave'),
    removed.ids,
  )
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
    // Re-checked at the moment of the move, as openWave does (#35 item 4):
    // someone moved out of the waiting pool since the read is left alone.
    .eq('status', 'waiting_for_next_wave')
    .select(ADMIN_WAITLIST_COLUMNS);

  if (error) return res.status(500).json({ error: 'Failed to promote users' });

  // PARTIAL FAILURE IS REPORTED PER PERSON, not collapsed into a count. The promotion
  // has already committed by this point, so a failure here means "promoted but not
  // told" -- a state an admin has to be able to see and act on, and one that a bare
  // success count would hide. Re-running is safe: the promotion matches nobody the
  // second time (they are no longer waiting), and the dedupe in followup_send_log
  // stops anyone already told from being told twice.
  const notifications: NotifyOutcome[] = [];
  for (const row of (promotedUsers || []) as unknown as WaitlistRow[]) {
    notifications.push(await notifyStatusChange(row, 'wave_assigned', { WAVE: target_wave }));
  }

  return res.status(200).json({
    promoted_count: promotedUsers?.length || 0,
    promoted_users: promotedUsers || [],
    emails_sent: notifications.filter((e) => e.status === 'sent').length,
    emails_skipped: notifications.filter((e) => e.status === 'skipped').length,
    emails_failed: notifications.filter((e) => e.status === 'failed').length,
    notifications,
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
  const { data: user, error: userErr } = await supabase
    .from('waitlist')
    .select('id, email, first_name, unsubscribed_at')
    .eq('email', trimmedEmail)
    .maybeSingle();

  if (userErr) return res.status(500).json({ error: 'Failed to fetch user' });
  if (!user) return res.status(404).json({ error: 'User not found in waitlist' });

  // Never email someone who opted out or was Removed (#26). This action had no
  // unsubscribe check before. A failed outreach read does not send.
  const refusal = adminSendRefusal(await checkSendable(supabase, user));
  if (refusal) return res.status(refusal.status).json({ error: refusal.error });

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
      // Greets by first name like every other email (#40), "Hi there," without one.
      html: `<p>${greetingHtml(user.first_name)}</p><p>Here's your secure magic link to sign in:</p><p><a href="${linkData.properties.action_link}">Click here to sign in</a></p>`,
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

  // Removed and unsubscribed people are never bulk-deleted (#26, decision 4a):
  // their record is what stops us contacting them again. They are skipped and
  // counted. If the Removed set cannot be read, nothing is deleted.
  const removed = await readRemovedIds(supabase);
  if (!removed.ok) return res.status(500).json({ error: 'Failed to read removed signups. Nothing was deleted.' });
  const removedIds = new Set(removed.ids);

  const { data: waiting, error: waitingErr } = await supabase
    .from('waitlist')
    .select('id, unsubscribed_at')
    .eq('status', 'waiting_for_next_wave')
    .order('created_at', { ascending: true });
  if (waitingErr) return res.status(500).json({ error: 'Failed to read fallback users. Nothing was deleted.' });

  const rows = (waiting ?? []) as { id: string; unsubscribed_at: string | null }[];
  const protectedRows = rows.filter(r => r.unsubscribed_at || removedIds.has(r.id));
  const deletable = rows.filter(r => !r.unsubscribed_at && !removedIds.has(r.id));
  // The panel promises at most 100 per request; enforce it here too.
  const cap = Math.min(100, Math.max(0, Math.floor(Number(limit) || 0)));
  const ids = deletable.slice(0, cap).map(r => r.id);

  if (ids.length === 0) {
    return res.status(200).json({ deleted_count: 0, skipped_count: protectedRows.length });
  }

  const { data: deleted, error } = await supabase
    .from('waitlist')
    .delete()
    .in('id', ids)
    .is('unsubscribed_at', null)
    .select('id');

  if (error) return res.status(500).json({ error: 'Failed to delete users' });

  return res.status(200).json({
    deleted_count: deleted?.length ?? 0,
    skipped_count: protectedRows.length,
  });
}

async function handleExportUsers(supabase: SupabaseClient, req: VercelRequest, res: VercelResponse) {
  const limit = Math.min(parseInt(req.query.limit as string) || 500, 5000);

  // Removed people are left out of the export, the same filter the counts use
  // (#26, waitlist #29). A failed read exports nothing rather than everyone.
  const removed = await readRemovedIds(supabase);
  if (!removed.ok) return res.status(500).json({ error: 'Failed to read removed signups' });

  const { data, error } = await excludeIds(supabase.from('waitlist').select('*'), removed.ids)
    .order('created_at', { ascending: true })
    .limit(limit);

  if (error) return res.status(500).json({ error: 'Failed to export users' });

  // Generate CSV
  const headers = ['email', 'first_name', 'segment', 'wave_number', 'status', 'is_creator', 'is_founding_member', 'is_founding_member_creator', 'wants_tester_access', 'created_at'];
  const rows = (data || []).map(row =>
    headers.map(h => {
      const val = row[h];
      if (val === null || val === undefined) return '';
      let str = String(val);
      // FORMULA GUARD (#40). A spreadsheet runs a cell that starts with = + - @ or
      // a tab as a formula, and names and emails are typed by the public. Every
      // TEXT cell that starts with one gets a leading apostrophe, so it opens as
      // plain text. Numbers and booleans are ours and are left alone.
      // The set is the OWASP CSV Injection list: = + - @, tab (0x09), carriage
      // return (0x0D), line feed (0x0A), and the full-width forms of = + - @
      // (U+FF1D, U+FF0B, U+FF0D, U+FF20). Written as escapes on purpose.
      if (typeof val === 'string' && /^[=+\-@\t\r\n\uFF1D\uFF0B\uFF0D\uFF20]/.test(str)) str = `'${str}`;
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

  // Removed people are left out of every waitlist count (#26).
  const removed = await readRemovedIds(supabase);
  if (!removed.ok) return res.status(500).json({ error: 'Failed to read removed signups' });
  const count = () => excludeIds(supabase.from('waitlist').select('*', { count: 'exact', head: true }), removed.ids);

  const [total, founding, foundingCreator, last30Days, waveDist, statusDist] = await Promise.all([
    count(),
    count().eq('is_founding_member', true),
    count().eq('is_founding_member_creator', true),
    excludeIds(supabase.from('waitlist').select('created_at'), removed.ids).gte('created_at', thirtyDaysAgo.toISOString()),
    excludeIds(supabase.from('waitlist').select('wave_number'), removed.ids),
    excludeIds(supabase.from('waitlist').select('status'), removed.ids),
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
  // Removed people are left out of the COUNTS (#26). The recent-signups list
  // below is a list, not a count, and is left as it was.
  const removed = await readRemovedIds(supabase);
  if (!removed.ok) return res.status(500).json({ error: 'Failed to fetch summary data' });

  const [totalResult, waveResult, recentResult] = await Promise.all([
    excludeIds(supabase.from('waitlist').select('*', { count: 'exact', head: true }), removed.ids),
    excludeIds(supabase.from('waitlist').select('wave_number'), removed.ids).not('wave_number', 'is', null),
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
    .select('id, email, first_name, created_at, has_access, unsubscribed_at, wave_number, creator_wave_number, is_creator, is_founding_member, founding_number, wants_tester_access, waitlist_outreach(outreach_status, last_emailed_on, resignup_attempts)')
    .order('created_at', { ascending: true });
  if (error) return res.status(500).json({ error: 'Failed to fetch waitlist users' });

  // Flatten the one-to-one embed to `outreach` (object or null). Null means the
  // row was missing; the page shows it as unknown and never as Not sent.
  const users = (data ?? []).map((row: Record<string, unknown>) => {
    const { waitlist_outreach, ...rest } = row;
    return { ...rest, outreach: firstEmbedded(waitlist_outreach as Record<string, unknown> | Record<string, unknown>[] | null) };
  });
  return res.status(200).json({ users });
}

async function handleTextOptInUsers(supabase: SupabaseClient, res: VercelResponse) {
  // This list is who gets texted by hand, so Removed people are left out (#26).
  const removed = await readRemovedIds(supabase);
  if (!removed.ok) return res.status(500).json({ error: 'Failed to fetch opted-in users' });

  const [usersResult, configResult] = await Promise.all([
    excludeIds(
      supabase.from('waitlist').select('email, phone_number, wave_number, is_founding_member, text_opt_in_offer_sent_at, created_at').eq('text_opt_in', true),
      removed.ids,
    ).order('created_at', { ascending: true }),
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
  // C13 (2026-09-26): no creator roles. `is_creator` no longer changes a role or an email.
  if (row.wants_tester_access) return 'tester_consumer';
  if (row.wave_number) return `consumer_wave_${row.wave_number}` as UserRole;
  return 'user';
}

function getEventType(role: UserRole): FollowupEventType | null {
  if (role === 'tester_consumer') return 'tester_access_opened';
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

  // Removed people are skipped (#26): granting sends an access email. If the
  // Removed set cannot be read, grant nobody.
  const removed = await readRemovedIds(supabase);
  if (!removed.ok) return res.status(500).json({ error: 'Failed to read removed signups. Nobody was granted.' });
  const removedIds = new Set(removed.ids);

  let granted = 0, skipped = 0, failed = 0;
  const results: Array<{ email: string; status: 'granted' | 'skipped' | 'failed'; reason?: string }> = [];

  for (const row of rows as WaitlistRow[]) {
    if (row.has_access) { skipped++; results.push({ email: row.email, status: 'skipped', reason: 'already_granted' }); continue; }
    if (row.unsubscribed_at) { skipped++; results.push({ email: row.email, status: 'skipped', reason: 'unsubscribed' }); continue; }
    if (removedIds.has(row.id)) { skipped++; results.push({ email: row.email, status: 'skipped', reason: 'removed' }); continue; }
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
    .select(ADMIN_WAITLIST_COLUMNS)
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
  let total: number | null = null;

  // Removed people are left out of the total, the position and prev/next, the
  // same filter the counts use (#26, waitlist #31). A failed read shows no
  // position and no neighbours rather than numbers that count Removed people.
  // A Removed person's own page shows no position: they are not in the count.
  const removed = await readRemovedIds(supabase);
  if (removed.ok) {
    const isRemoved = removed.ids.includes(user.id as string);
    const { count: totalCount } = await excludeIds(
      supabase.from('waitlist').select('*', { count: 'exact', head: true }),
      removed.ids,
    );
    total = totalCount ?? null;

    if (user.waitlist_position != null) {
      const [{ data: p }, { data: n }, { count: idx }] = await Promise.all([
        excludeIds(supabase.from('waitlist').select('email, waitlist_position'), removed.ids)
          .lt('waitlist_position', user.waitlist_position)
          .order('waitlist_position', { ascending: false })
          .limit(1)
          .maybeSingle(),
        excludeIds(supabase.from('waitlist').select('email, waitlist_position'), removed.ids)
          .gt('waitlist_position', user.waitlist_position)
          .order('waitlist_position', { ascending: true })
          .limit(1)
          .maybeSingle(),
        excludeIds(supabase.from('waitlist').select('*', { count: 'exact', head: true }), removed.ids)
          .lte('waitlist_position', user.waitlist_position),
      ]);
      prev = p ?? null;
      next = n ?? null;
      index = isRemoved ? null : (idx ?? null);
    }
  }

  // Outreach row (#26). A failed or missing read is reported as such and never
  // defaulted to Not sent; the page shows an error instead of the form.
  const { data: outreachRow, error: outreachErr } = await supabase
    .from('waitlist_outreach')
    .select('outreach_status, last_emailed_on, notes, removed_at, removed_cleared_at, resignup_attempts, last_resignup_at, updated_at')
    .eq('waitlist_id', user.id)
    .maybeSingle();

  return res.status(200).json({
    user,
    outreach: outreachErr ? null : (outreachRow ?? null),
    outreach_error: outreachErr
      ? 'The outreach record could not be read.'
      : outreachRow
        ? null
        : 'This signup has no outreach record. The outreach migration may not be applied yet.',
    drips: dripErr ? null : (dripRows ?? []),
    drips_error: dripErr ? 'Failed to load the delivery log' : null,
    resendable_events: [...RESENDABLE_DRIP_EVENTS],
    neighbors: { prev, next, index, total },
  });
}

// ============================================================================
// OUTREACH  (/admin/user/:email, #26)
// ============================================================================
//
// Status, last-emailed date and notes for one signup. Kept separate from
// updateUser, which sends emails when certain fields change.
//
// MOVING TO REMOVED goes through mark_waitlist_removed, which also clears the
// phone number and text opt-in (decision 5a) and gives back a held text spot.
// If a spot or open offer was freed, it is passed on like a decline.
//
// UNDOING REMOVED (decision 2a) needs confirm_undo_removed: true. removed_at is
// kept as history and removed_cleared_at records the undo. A deleted phone
// number is not restored. unsubscribed_at is not touched, so someone who
// unsubscribed still gets no email after an undo. If founding spots are full,
// they return without the founding badge (decision 3a, undo_waitlist_removed).
//
// NOTES may not contain the person's email or the part before the @ (5c).

const LAST_EMAILED_RE = /^\d{4}-\d{2}-\d{2}$/;

function isRealDate(value: string): boolean {
  if (!LAST_EMAILED_RE.test(value)) return false;
  const d = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}

async function handleUpdateOutreach(supabase: SupabaseClient, req: VercelRequest, res: VercelResponse) {
  const body = (req.body || {}) as Record<string, unknown>;
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  if (!email || !isValidEmail(email)) return res.status(400).json({ error: 'A valid email is required' });

  const patch: Record<string, unknown> = {};

  if ('last_emailed_on' in body) {
    const v = body.last_emailed_on;
    if (v === null || v === '') patch.last_emailed_on = null;
    else if (typeof v === 'string' && isRealDate(v)) patch.last_emailed_on = v;
    else return res.status(400).json({ error: 'last_emailed_on must be a date (YYYY-MM-DD) or empty' });
  }

  if ('notes' in body) {
    const v = body.notes;
    if (v === null) patch.notes = null;
    else if (typeof v === 'string') {
      const trimmed = v.trim();
      if (trimmed.length > OUTREACH_NOTES_MAX) {
        return res.status(400).json({ error: `Notes are limited to ${OUTREACH_NOTES_MAX} characters` });
      }
      // Notes must not name the person (5c): they are kept with a Removed record.
      if (notesNamePerson(trimmed, email)) {
        return res.status(400).json({ error: OUTREACH_NOTES_NAMES_PERSON_ERROR });
      }
      patch.notes = trimmed === '' ? null : trimmed;
    } else return res.status(400).json({ error: 'notes must be text' });
  }

  let nextStatus: string | undefined;
  if ('outreach_status' in body) {
    if (!isOutreachStatus(body.outreach_status)) {
      return res.status(400).json({ error: 'Invalid outreach status' });
    }
    nextStatus = body.outreach_status;
  }

  if (nextStatus === undefined && Object.keys(patch).length === 0) {
    return res.status(400).json({ error: 'No fields to update' });
  }

  const { data: user, error: userErr } = await supabase
    .from('waitlist')
    .select('id')
    .eq('email', email)
    .maybeSingle();
  if (userErr) return res.status(500).json({ error: 'Failed to fetch user' });
  if (!user) return res.status(404).json({ error: 'User not found' });

  const current = await readOutreachStatus(supabase, user.id);
  if (!current.ok) {
    return res.status(500).json({
      error: current.reason === 'missing'
        ? 'This signup has no outreach record. The outreach migration may not be applied yet.'
        : 'Could not read the outreach record. Nothing was saved.',
    });
  }

  const wasRemoved = current.status === OUTREACH_REMOVED;
  const toRemoved = nextStatus === OUTREACH_REMOVED && !wasRemoved;
  const undoRemoved = wasRemoved && nextStatus !== undefined && nextStatus !== OUTREACH_REMOVED;

  if (undoRemoved && body.confirm_undo_removed !== true) {
    return res.status(409).json({ error: 'Undoing Removed needs confirmation. They may get emails again.' });
  }

  // Undo goes through undo_waitlist_removed below (it re-checks the founding
  // cap in the same database step), so only a plain status change is patched.
  if (nextStatus !== undefined && !toRemoved && !undoRemoved && nextStatus !== current.status) {
    patch.outreach_status = nextStatus;
  }

  const warnings: string[] = [];

  // Date, notes and any non-Removed status change first. Zero rows matched is
  // a failure, never a silent success.
  if (Object.keys(patch).length > 0) {
    // Guarded on the status we read, so two admins saving at once cannot
    // overwrite each other's change unseen.
    const { data: updated, error: updErr } = await supabase
      .from('waitlist_outreach')
      .update(patch)
      .eq('waitlist_id', user.id)
      .eq('outreach_status', current.status)
      .select('waitlist_id');
    if (updErr || !updated) {
      return res.status(500).json({ error: 'Failed to save the outreach record. Nothing was saved.' });
    }
    if (updated.length !== 1) {
      return res.status(409).json({ error: 'This record was changed by someone else. Reload and try again. Nothing was saved.' });
    }
  }

  // Decision 3a: if founding spots are full, they come back without the badge.
  if (undoRemoved) {
    const { data: undone, error: undoErr } = await supabase.rpc('undo_waitlist_removed', {
      p_waitlist_id: user.id,
      p_new_status: nextStatus,
      p_founding_cap: MAX_FOUNDING_MEMBERS,
    });
    if (undoErr) {
      return res.status(500).json({
        error: Object.keys(patch).length > 0
          ? 'The date and notes were saved, but undoing Removed failed. Try again.'
          : 'Undoing Removed failed. Nothing was changed.',
      });
    }
    const kept = firstEmbedded(undone as { founding_kept: boolean } | { founding_kept: boolean }[] | null)?.founding_kept;
    if (kept === false) {
      warnings.push('Founding spots are full, so they return without the founding badge or its locked price.');
    }
  }

  let textOfferPassedOn = false;
  if (toRemoved) {
    const { data: marked, error: markErr } = await supabase.rpc('mark_waitlist_removed', { p_waitlist_id: user.id });
    if (markErr) {
      return res.status(500).json({
        error: Object.keys(patch).length > 0
          ? 'The date and notes were saved, but moving to Removed failed. Try again.'
          : 'Moving to Removed failed. Nothing was changed.',
      });
    }
    const passOnAfter = (firstEmbedded(marked as { pass_on_after: string | null } | { pass_on_after: string | null }[] | null))?.pass_on_after ?? null;
    if (passOnAfter) {
      const resendApiKey = process.env.RESEND_API_KEY;
      if (!resendApiKey) {
        warnings.push('Their text spot was freed, but the offer could not be passed on: email is not configured.');
      } else {
        const passed = await passOnTextOffer(supabase, resendApiKey, passOnAfter);
        textOfferPassedOn = passed.offered;
        if (passed.error) warnings.push(`Their text spot was freed, but passing it on failed: ${passed.error}.`);
      }
    }
  }

  const { data: outreach, error: readBackErr } = await supabase
    .from('waitlist_outreach')
    .select('outreach_status, last_emailed_on, notes, removed_at, removed_cleared_at, resignup_attempts, last_resignup_at, updated_at')
    .eq('waitlist_id', user.id)
    .maybeSingle();

  return res.status(200).json({
    updated: true,
    outreach: readBackErr ? null : outreach,
    text_offer_passed_on: textOfferPassedOn,
    warnings,
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
    .select('id, email, first_name, unsubscribed_at, unsubscribe_token')
    .eq('email', trimmedEmail)
    .maybeSingle();

  if (userErr) return res.status(500).json({ error: 'Failed to fetch user' });
  if (!user) return res.status(404).json({ error: 'User not found' });

  // Same guard the scheduler applies. Never email someone who opted out, nor
  // someone Removed (#26). A failed outreach read does not send.
  const refusal = adminSendRefusal(await checkSendable(supabase, user));
  if (refusal) return res.status(refusal.status).json({ error: refusal.error });

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
  const outcome = await sendAndRecordDrip(
    supabase,
    resendApiKey,
    user,
    dripEvent as DripEventType,
    logRow.id,
    slotsRemaining,
  );

  if (outcome.kind === 'send_failed') {
    return res.status(502).json({ error: outcome.error, sent: false });
  }
  if (outcome.kind === 'sent_log_stale') {
    return res.status(200).json({
      sent: true,
      log_updated: false,
      warning: 'The email was sent, but the delivery log could not be updated. Refresh before resending.',
    });
  }
  return res.status(200).json({ sent: true, log_updated: true, drip: outcome.drip });
}

// ----------------------------------------------------------------------------
// The one place a drip is actually sent and its row rewritten.
//
// Shared by the single resend and the bulk sweep so the two cannot drift about
// the ordering or the log write, which is the part that is easy to get wrong.
// ----------------------------------------------------------------------------

type SendAndRecord =
  | { kind: 'sent'; drip: Record<string, unknown> }
  | { kind: 'sent_log_stale' }
  | { kind: 'send_failed'; error: string };

async function sendAndRecordDrip(
  supabase: SupabaseClient,
  resendApiKey: string,
  user: { email: string; first_name: string | null; unsubscribe_token: string | null },
  dripEvent: DripEventType,
  logRowId: string,
  slotsRemaining: string,
): Promise<SendAndRecord> {
  const template = dripTemplates[dripEvent];
  // Greeting filled LAST (#40): the name is typed by the person, so a name written
  // like a placeholder must not be filled by a later step.
  const html = template.html
    .replace(/\{\{UNSUBSCRIBE_URL\}\}/g, unsubscribeUrlFor(user.unsubscribe_token))
    .replace(/\{\{SLOTS_REMAINING\}\}/g, slotsRemaining)
    .replace(/\{\{GREETING\}\}/g, () => greetingHtml(user.first_name));

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
      .eq('id', logRowId);
    return { kind: 'send_failed', error: sendError };
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
    .eq('id', logRowId)
    .eq('status', 'failed')
    .select('id, drip_event, status, sent_at, error_text')
    .maybeSingle();

  // The email HAS been sent at this point. A log write that matched no row is
  // reported rather than swallowed.
  if (updErr || !updated) return { kind: 'sent_log_stale' };
  return { kind: 'sent', drip: updated as Record<string, unknown> };
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

      case 'regenerateToken':
        if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
        return handleRegenerateToken(supabase, req, res);

      case 'resendDripEmail':
        if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
        return handleResendDripEmail(supabase, req, res);

      case 'updateOutreach':
        if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
        return handleUpdateOutreach(supabase, req, res);


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
