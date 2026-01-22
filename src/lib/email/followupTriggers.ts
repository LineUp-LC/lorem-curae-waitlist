// ============================================================================
// LOREM CURAE - FOLLOW-UP EMAIL TRIGGERS
// ============================================================================
//
// Helper functions to trigger follow-up emails from anywhere in the app.
//
// Usage:
//   import { onTesterAccessOpened } from '@/lib/email/followupTriggers';
//   await onTesterAccessOpened({ email: 'user@example.com', role: 'tester_creator' });
//
// CRITICAL: Founding Member roles are NEVER assigned automatically.
// The onRoleChanged() function will throw an error if you attempt to
// upgrade a user to any founding role.
//
// Environment variables required:
//   - SUPABASE_URL
//   - SUPABASE_SERVICE_ROLE_KEY
//   - RESEND_API_KEY
//
// ============================================================================

import { createClient } from '@supabase/supabase-js';
import {
  sendFollowupEmail,
  FollowupUser,
  UserRole,
  FOUNDING_ROLES,
  FollowupEventType,
} from './followupTemplates';

// ----------------------------------------------------------------------------
// ENVIRONMENT HELPERS
// ----------------------------------------------------------------------------

function getEnvVars() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) throw new Error('[followupTriggers] Missing SUPABASE_URL environment variable');
  if (!supabaseServiceRoleKey) throw new Error('[followupTriggers] Missing SUPABASE_SERVICE_ROLE_KEY environment variable');

  return { supabaseUrl, supabaseServiceRoleKey };
}

function createAdminClient() {
  const { supabaseUrl, supabaseServiceRoleKey } = getEnvVars();
  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

// ----------------------------------------------------------------------------
// BATCH RESULT TYPE
// ----------------------------------------------------------------------------

export interface BatchSendResult {
  sent: number;
  failed: number;
  errors: Array<{ email: string; error: string }>;
}

// ----------------------------------------------------------------------------
// TRIGGER: TESTER ACCESS OPENED
// ----------------------------------------------------------------------------

/**
 * Sends follow-up email when tester access opens for a single user.
 * Valid for: tester_creator, tester_consumer
 */
export async function onTesterAccessOpened(user: FollowupUser): Promise<void> {
  if (user.role !== 'tester_creator' && user.role !== 'tester_consumer') {
    throw new Error(
      `[followupTriggers] onTesterAccessOpened() called with invalid role "${user.role}". ` +
      `Expected "tester_creator" or "tester_consumer".`
    );
  }

  await sendFollowupEmail(user.email, user.role, 'tester_access_opened');
}

/**
 * Batch sends tester access opened emails to ALL testers.
 * Queries the waitlist for all users with wants_tester_access = true
 * who are NOT founding members.
 */
export async function onTesterAccessOpenedBatch(): Promise<BatchSendResult> {
  const supabase = createAdminClient();

  console.log('[followupTriggers] Fetching all testers for batch send...');

  // Fetch all testers (non-founding members with wants_tester_access)
  const { data: testers, error } = await supabase
    .from('waitlist')
    .select('email, is_creator, is_founding_member')
    .eq('wants_tester_access', true)
    .eq('is_founding_member', false);

  if (error) {
    throw new Error(`[followupTriggers] Failed to fetch testers: ${error.message}`);
  }

  const results: BatchSendResult = { sent: 0, failed: 0, errors: [] };

  console.log(`[followupTriggers] Found ${testers?.length || 0} testers to notify`);

  for (const tester of testers || []) {
    const role: UserRole = tester.is_creator ? 'tester_creator' : 'tester_consumer';

    try {
      await sendFollowupEmail(tester.email, role, 'tester_access_opened');
      results.sent++;
    } catch (err) {
      results.failed++;
      results.errors.push({
        email: tester.email,
        error: err instanceof Error ? err.message : String(err),
      });
      console.error(`[followupTriggers] Failed to send to ${tester.email}:`, err);
    }
  }

  console.log(`[followupTriggers] Batch complete: ${results.sent} sent, ${results.failed} failed`);

  return results;
}

// ----------------------------------------------------------------------------
// TRIGGER: CREATOR TOOLS OPENED
// ----------------------------------------------------------------------------

/**
 * Sends follow-up email when creator tools open for a single user.
 * Valid for: creator_c1, creator_c2, creator_c3, founding_member_creator, founding_member_tester_creator
 */
export async function onCreatorToolsOpened(user: FollowupUser): Promise<void> {
  const validRoles: UserRole[] = [
    'creator_c1',
    'creator_c2',
    'creator_c3',
    'founding_member_creator',
    'founding_member_tester_creator',
  ];

  if (!validRoles.includes(user.role)) {
    throw new Error(
      `[followupTriggers] onCreatorToolsOpened() called with invalid role "${user.role}". ` +
      `Expected one of: ${validRoles.join(', ')}.`
    );
  }

  await sendFollowupEmail(user.email, user.role, 'creator_tools_opened');
}

/**
 * Batch sends creator tools opened emails to all creators in a specific wave.
 * Only sends to non-founding, non-tester creators in the specified wave.
 */
export async function onCreatorWaveOpenedBatch(waveNumber: 1 | 2 | 3): Promise<BatchSendResult> {
  const supabase = createAdminClient();

  console.log(`[followupTriggers] Fetching creators for wave C${waveNumber}...`);

  // Fetch all creators in this wave (non-founding, non-tester)
  const { data: creators, error } = await supabase
    .from('waitlist')
    .select('email')
    .eq('is_creator', true)
    .eq('creator_wave_number', waveNumber)
    .eq('is_founding_member', false)
    .eq('wants_tester_access', false);

  if (error) {
    throw new Error(`[followupTriggers] Failed to fetch creators for wave C${waveNumber}: ${error.message}`);
  }

  const role: UserRole = `creator_c${waveNumber}` as UserRole;
  const results: BatchSendResult = { sent: 0, failed: 0, errors: [] };

  console.log(`[followupTriggers] Found ${creators?.length || 0} creators in wave C${waveNumber}`);

  for (const creator of creators || []) {
    try {
      await sendFollowupEmail(creator.email, role, 'creator_tools_opened');
      results.sent++;
    } catch (err) {
      results.failed++;
      results.errors.push({
        email: creator.email,
        error: err instanceof Error ? err.message : String(err),
      });
      console.error(`[followupTriggers] Failed to send to ${creator.email}:`, err);
    }
  }

  console.log(`[followupTriggers] Batch complete: ${results.sent} sent, ${results.failed} failed`);

  return results;
}

// ----------------------------------------------------------------------------
// TRIGGER: CONSUMER WAVE OPENED
// ----------------------------------------------------------------------------

/**
 * Sends follow-up email when a consumer wave opens for a single user.
 */
export async function onConsumerWaveOpened(
  waveNumber: 1 | 2 | 3 | 4 | 5 | 6 | 7,
  user: FollowupUser
): Promise<void> {
  const expectedRole = `consumer_wave_${waveNumber}` as UserRole;

  if (user.role !== expectedRole) {
    throw new Error(
      `[followupTriggers] onConsumerWaveOpened(${waveNumber}) called with mismatched role "${user.role}". ` +
      `Expected "${expectedRole}".`
    );
  }

  await sendFollowupEmail(user.email, user.role, 'consumer_wave_opened');
}

/**
 * Batch sends consumer wave opened emails to ALL users in a specific wave.
 * Only sends to non-creator, non-founding, non-tester consumers.
 */
export async function onConsumerWaveOpenedBatch(
  waveNumber: 1 | 2 | 3 | 4 | 5 | 6 | 7
): Promise<BatchSendResult> {
  const supabase = createAdminClient();

  console.log(`[followupTriggers] Fetching consumers for wave ${waveNumber}...`);

  // Fetch all consumers in this wave (non-creator, non-founding, non-tester)
  const { data: consumers, error } = await supabase
    .from('waitlist')
    .select('email')
    .eq('wave_number', waveNumber)
    .eq('is_creator', false)
    .eq('is_founding_member', false)
    .eq('wants_tester_access', false);

  if (error) {
    throw new Error(`[followupTriggers] Failed to fetch consumers for wave ${waveNumber}: ${error.message}`);
  }

  const role: UserRole = `consumer_wave_${waveNumber}` as UserRole;
  const results: BatchSendResult = { sent: 0, failed: 0, errors: [] };

  console.log(`[followupTriggers] Found ${consumers?.length || 0} consumers in wave ${waveNumber}`);

  for (const consumer of consumers || []) {
    try {
      await sendFollowupEmail(consumer.email, role, 'consumer_wave_opened');
      results.sent++;
    } catch (err) {
      results.failed++;
      results.errors.push({
        email: consumer.email,
        error: err instanceof Error ? err.message : String(err),
      });
      console.error(`[followupTriggers] Failed to send to ${consumer.email}:`, err);
    }
  }

  console.log(`[followupTriggers] Batch complete: ${results.sent} sent, ${results.failed} failed`);

  return results;
}

// ----------------------------------------------------------------------------
// TRIGGER: ROLE CHANGED
// ----------------------------------------------------------------------------

/** Role hierarchy for determining upgrade vs downgrade */
const ROLE_HIERARCHY: Record<UserRole, number> = {
  user: 0,
  consumer_wave_7: 1,
  consumer_wave_6: 2,
  consumer_wave_5: 3,
  consumer_wave_4: 4,
  consumer_wave_3: 5,
  consumer_wave_2: 6,
  consumer_wave_1: 7,
  creator_c3: 8,
  creator_c2: 9,
  creator_c1: 10,
  tester_consumer: 11,
  tester_creator: 12,
  // Founding roles are highest but cannot be auto-assigned
  founding_member: 100,
  founding_member_creator: 100,
  founding_member_tester_consumer: 100,
  founding_member_tester_creator: 100,
};

/**
 * Sends follow-up email when a user's role changes.
 *
 * CRITICAL: This function will THROW AN ERROR if newRole is a founding role.
 * Founding roles can ONLY be assigned manually by an admin.
 */
export async function onRoleChanged(
  user: { email: string },
  oldRole: UserRole,
  newRole: UserRole
): Promise<void> {
  // SAFETY CHECK: Never auto-assign founding roles
  if (FOUNDING_ROLES.includes(newRole)) {
    throw new Error(
      `[followupTriggers] FORBIDDEN: Cannot automatically upgrade user to founding role "${newRole}". ` +
      `Founding roles can ONLY be assigned manually by an admin. ` +
      `This is a security violation.`
    );
  }

  // Determine if this is an upgrade or downgrade
  const oldRank = ROLE_HIERARCHY[oldRole] ?? 0;
  const newRank = ROLE_HIERARCHY[newRole] ?? 0;

  const eventType: FollowupEventType = newRank > oldRank ? 'role_upgraded' : 'role_downgraded';

  console.log(`[followupTriggers] Role change: ${oldRole} → ${newRole} (${eventType})`);

  await sendFollowupEmail(user.email, newRole, eventType);
}

/**
 * Safe version of onRoleChanged that silently skips founding roles
 * instead of throwing. Use this in auth callbacks where you don't want
 * to block the flow.
 */
export async function onRoleChangedSafe(
  user: { email: string },
  oldRole: UserRole,
  newRole: UserRole
): Promise<void> {
  // Silently skip if new role is founding (admin-assigned only)
  if (FOUNDING_ROLES.includes(newRole)) {
    console.log(
      `[followupTriggers] Skipping role change email: "${newRole}" is a founding role (admin-only)`
    );
    return;
  }

  // Silently skip if roles are the same
  if (oldRole === newRole) {
    return;
  }

  try {
    await onRoleChanged(user, oldRole, newRole);
  } catch (err) {
    // Log but don't throw - this is the "safe" version
    console.error(`[followupTriggers] Failed to send role change email:`, err);
  }
}
