// Outreach status for a waitlist signup. Admin-only; stored in
// public.waitlist_outreach (migration 20261124194749_add_waitlist_outreach.sql), never
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

// Notes are kept with a Removed record (decision 5c), so they must never name
// the person. Shown under the notes box.
export const OUTREACH_NOTES_HINT = 'No names or personal details. Write what they want, not who they are.';

export const OUTREACH_NOTES_NAMES_PERSON_ERROR =
  'Notes cannot contain this person’s email address or the part of it before the @. Write what they want, not who they are.';

// The part before the @ only counts once it is this long (choice B1), so a
// short address like ed@ does not block every note containing "ed".
const NOTES_LOCAL_PART_MIN = 4;

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// True when the notes contain the person's full email address anywhere, or the
// part before the @ (4 or more characters) as a whole word, ignoring case.
// "Whole word" means not touching another letter or digit on either side. The
// ONE check, used by the admin API (which refuses the save) and by the
// Outreach card (which explains why first).
export function notesNamePerson(notes: string, email: string): boolean {
  const n = notes.toLowerCase();
  const e = email.trim().toLowerCase();
  if (!e) return false;
  if (n.includes(e)) return true;
  const local = e.split('@')[0];
  if (local.length < NOTES_LOCAL_PART_MIN) return false;
  return new RegExp(`(^|[^a-z0-9])${escapeRegExp(local)}($|[^a-z0-9])`).test(n);
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
