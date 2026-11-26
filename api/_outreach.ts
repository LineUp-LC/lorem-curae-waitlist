import type { SupabaseClient } from '@supabase/supabase-js';
import { isOutreachStatus, OUTREACH_REMOVED } from '../src/lib/outreachStatus.js';
import type { OutreachStatus } from '../src/lib/outreachStatus.js';

// ----------------------------------------------------------------------------
// Outreach reads shared by the API routes. Tracked in #26.
//
// FAIL CLOSED. A send path that cannot read someone's outreach row does not
// send: "we could not tell whether they asked us to stop" must never read as
// "they did not". A count that cannot read the Removed set returns an error
// rather than a number that silently includes them (NOT_REMOVED_VIEW below).
// ----------------------------------------------------------------------------

export type OutreachStatusRead =
  | { ok: true; status: OutreachStatus }
  | { ok: false; reason: 'read_failed' | 'missing' };

export async function readOutreachStatus(
  supabase: SupabaseClient,
  waitlistId: string,
): Promise<OutreachStatusRead> {
  const { data, error } = await supabase
    .from('waitlist_outreach')
    .select('outreach_status')
    .eq('waitlist_id', waitlistId)
    .maybeSingle();
  if (error) {
    console.error(JSON.stringify({ level: 'error', event: 'outreach_read_failed', error: error.message }));
    return { ok: false, reason: 'read_failed' };
  }
  const status = (data as { outreach_status?: unknown } | null)?.outreach_status;
  if (!isOutreachStatus(status)) return { ok: false, reason: 'missing' };
  return { ok: true, status };
}

// ONE gate for "may we contact this person" on every hand-written send path
// (#26). Unsubscribed refuses without a read; Removed refuses; a failed or
// missing outreach read refuses as read_failed, which callers answer with a
// server error. Each caller keeps its own response shape for each reason.
export type SendCheck =
  | { sendable: true }
  | { sendable: false; reason: 'unsubscribed' | 'removed' }
  | { sendable: false; reason: 'read_failed'; readReason: 'read_failed' | 'missing' };

export async function checkSendable(
  supabase: SupabaseClient,
  // unsubscribed_at is REQUIRED: a caller that forgot to select it must not
  // read as "not unsubscribed".
  row: { id: string; unsubscribed_at: string | null },
): Promise<SendCheck> {
  if (row.unsubscribed_at) return { sendable: false, reason: 'unsubscribed' };
  const outreach = await readOutreachStatus(supabase, row.id);
  if (outreach.ok === false) return { sendable: false, reason: 'read_failed', readReason: outreach.reason };
  if (outreach.status === OUTREACH_REMOVED) return { sendable: false, reason: 'removed' };
  return { sendable: true };
}

// Waitlist rows that are not Removed, filtered IN THE DATABASE (waitlist issue
// 32). Replaces readRemovedIds + excludeIds, which read every Removed id into
// the server and put them all in the request address; past about 1,000 Removed
// people that address was too long and the read failed. The view is
// service-role only (migration 20261126010142_waitlist_scale_safety.sql).
// FAIL CLOSED: every caller checks the query error and answers with a server
// error. A failed read never becomes "everyone" or zero.
export const NOT_REMOVED_VIEW = 'waitlist_not_removed';

// One-to-one embeds can come back as an object or a one-element array
// depending on how PostgREST reads the relationship. Normalise both.
export function firstEmbedded<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}
