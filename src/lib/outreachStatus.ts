// Outreach status for a waitlist signup. Admin-only; stored in
// public.waitlist_outreach (migration 20261124_add_waitlist_outreach.sql), never
// on public.waitlist, whose own-row read policy would expose it to the person.
//
// SYNC PAIR: these five values are the CHECK constraint on
// waitlist_outreach.outreach_status. The drip-scheduler and unsubscribe edge
// functions (Deno, cannot import this file) spell 'removed' by hand.
//
// Tracked in #26.

export const OUTREACH_STATUSES = ['not_sent', 'sent', 'replied', 'quiet', 'removed'] as const;

export type OutreachStatus = (typeof OUTREACH_STATUSES)[number];

export const OUTREACH_REMOVED: OutreachStatus = 'removed';

export const OUTREACH_STATUS_LABELS: Record<OutreachStatus, string> = {
  not_sent: 'Not sent',
  sent: 'Sent',
  replied: 'Replied',
  quiet: 'Quiet',
  removed: 'Removed',
};

// Names of admin Badge variants (src/pages/admin/components/ui/Badge.tsx).
export const OUTREACH_STATUS_BADGE: Record<
  OutreachStatus,
  'default' | 'info' | 'success' | 'warning' | 'error'
> = {
  not_sent: 'default',
  sent: 'info',
  replied: 'success',
  quiet: 'warning',
  removed: 'error',
};

// SYNC PAIR with the notes CHECK in the migration.
export const OUTREACH_NOTES_MAX = 500;

export function isOutreachStatus(value: unknown): value is OutreachStatus {
  return typeof value === 'string' && (OUTREACH_STATUSES as readonly string[]).includes(value);
}

// What the admin API returns for one signup's outreach row.
export interface OutreachRecord {
  outreach_status: OutreachStatus;
  last_emailed_on: string | null;
  notes: string | null;
  removed_at: string | null;
  removed_cleared_at: string | null;
  resignup_attempts: number;
  last_resignup_at: string | null;
  updated_at: string;
}
