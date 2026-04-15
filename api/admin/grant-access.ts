import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { sendFollowupEmail } from '../../src/lib/email/followupTemplates';
import type { UserRole, FollowupEventType } from '../../src/lib/email/followupTemplates';

// ----------------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------------

interface WaitlistRow {
  id: string;
  email: string;
  has_access: boolean;
  unsubscribed_at: string | null;
  wave_number: number | null;
  creator_wave_number: number | null;
  is_creator: boolean;
  is_founding_member: boolean;
  wants_tester_access: boolean;
}

// ----------------------------------------------------------------------------
// Role + event type resolution
// ----------------------------------------------------------------------------

function determineUserRole(row: WaitlistRow): UserRole {
  if (row.is_founding_member) return 'founding_member';
  if (row.wants_tester_access) return row.is_creator ? 'tester_creator' : 'tester_consumer';
  if (row.is_creator && row.creator_wave_number) {
    switch (row.creator_wave_number) {
      case 1: return 'creator_c1';
      case 2: return 'creator_c2';
      case 3: return 'creator_c3';
    }
  }
  if (row.wave_number) {
    return `consumer_wave_${row.wave_number}` as UserRole;
  }
  return 'user';
}

function getEventType(role: UserRole): FollowupEventType | null {
  if (role === 'tester_creator' || role === 'tester_consumer') return 'tester_access_opened';
  if (role === 'creator_c1' || role === 'creator_c2' || role === 'creator_c3') return 'creator_tools_opened';
  if (role.startsWith('consumer_wave_')) return 'consumer_wave_opened';
  // founding_member* and 'user' have no auto-access email
  return null;
}

// ----------------------------------------------------------------------------
// Handler
// ----------------------------------------------------------------------------

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const adminSecret = process.env.ADMIN_SECRET;
    const authHeader = req.headers.authorization;
    if (!adminSecret || authHeader !== `Bearer ${adminSecret}`) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { userIds } = req.body ?? {};
    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ error: 'userIds must be a non-empty array' });
    }

    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceRoleKey) {
      return res.status(500).json({ error: 'Server misconfiguration' });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: rows, error: fetchErr } = await supabase
      .from('waitlist')
      .select(
        'id, email, has_access, unsubscribed_at, wave_number, creator_wave_number, is_creator, is_founding_member, wants_tester_access'
      )
      .in('id', userIds);

    if (fetchErr || !rows) {
      return res.status(500).json({ error: 'Failed to fetch waitlist records' });
    }

    let granted = 0;
    let skipped = 0;
    let failed = 0;

    const results: Array<{
      email: string;
      status: 'granted' | 'skipped' | 'failed';
      reason?: string;
    }> = [];

    for (const row of rows as WaitlistRow[]) {
      // Skip users who already have access or have unsubscribed
      if (row.has_access) {
        skipped++;
        results.push({ email: row.email, status: 'skipped', reason: 'already_granted' });
        continue;
      }
      if (row.unsubscribed_at) {
        skipped++;
        results.push({ email: row.email, status: 'skipped', reason: 'unsubscribed' });
        continue;
      }

      // Grant access in the database
      const { error: updateErr } = await supabase
        .from('waitlist')
        .update({ has_access: true })
        .eq('id', row.id);

      if (updateErr) {
        failed++;
        results.push({ email: row.email, status: 'failed', reason: updateErr.message });
        continue;
      }

      // Send access-opened email if a template exists for this role
      const role = determineUserRole(row);
      const eventType = getEventType(role);

      if (eventType) {
        try {
          await sendFollowupEmail(row.email, role, eventType);
        } catch (emailErr) {
          // Access is already granted — log email failure but count as granted
          console.error(
            JSON.stringify({
              level: 'error',
              event: 'grant_access_email_failed',
              email: row.email.substring(0, 3) + '***',
              role,
              eventType,
              error: emailErr instanceof Error ? emailErr.message : String(emailErr),
            })
          );
          granted++;
          results.push({ email: row.email, status: 'granted', reason: 'email_failed' });
          continue;
        }
      }

      granted++;
      results.push({ email: row.email, status: 'granted' });
    }

    console.log(
      JSON.stringify({
        level: 'info',
        event: 'grant_access_batch',
        granted,
        skipped,
        failed,
        timestamp: new Date().toISOString(),
      })
    );

    return res.status(200).json({ granted, skipped, failed, results });
  } catch (err) {
    console.error('[grant-access] Unexpected error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
