// ============================================================================
// LOREM CURAE - FOLLOW-UP EMAIL TRIGGERS
// ============================================================================
//
// Helper functions to trigger follow-up emails from anywhere in the app.
//
// Usage:
//   import { onTesterAccessOpened } from '@/lib/email/followupTriggers';
//   await onTesterAccessOpened({ email: 'user@example.com', role: 'tester_consumer' });
//
// The batch senders and the role-change trigger were removed as unused
// (waitlist #24).
//
// Environment variables required (by sendFollowupEmail):
//   - SUPABASE_URL
//   - SUPABASE_SERVICE_ROLE_KEY
//   - RESEND_API_KEY
//
// ============================================================================

import {
  sendFollowupEmail,
  FollowupUser,
  UserRole,
} from './followupTemplates.js';

// ----------------------------------------------------------------------------
// TRIGGER: TESTER ACCESS OPENED
// ----------------------------------------------------------------------------

/**
 * Sends follow-up email when tester access opens for a single user.
 * Valid for: tester_consumer (C13: there are no creator roles)
 */
export async function onTesterAccessOpened(user: FollowupUser): Promise<void> {
  if (user.role !== 'tester_consumer') {
    throw new Error(
      `[followupTriggers] onTesterAccessOpened() called with invalid role "${user.role}". ` +
      `Expected "tester_consumer".`
    );
  }

  await sendFollowupEmail(user.email, user.role, 'tester_access_opened');
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
