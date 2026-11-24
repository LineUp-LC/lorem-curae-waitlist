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

// Notes survive an anonymize (decision 5c), so they must never name the person.
// Shown under the notes box.
export const OUTREACH_NOTES_HINT = 'No names or personal details. Write what they want, not who they are.';

export const OUTREACH_NOTES_NAMES_PERSON_ERROR =
  'Notes cannot contain this person’s email address or the part of it before the @. Write what they want, not who they are.';

// True when the notes contain the person's email address, or the part of it
// before the @, ignoring case. The ONE check, used by the admin API (which
// refuses the save) and by the Outreach card (which explains why first).
export function notesNamePerson(notes: string, email: string): boolean {
  const n = notes.toLowerCase();
  const e = email.trim().toLowerCase();
  if (!e) return false;
  const local = e.split('@')[0];
  return n.includes(e) || (local.length > 0 && n.includes(local));
}

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
