import type { SupabaseClient } from '@supabase/supabase-js';
import { isOutreachStatus, OUTREACH_REMOVED } from '../src/lib/outreachStatus.js';
import type { OutreachStatus } from '../src/lib/outreachStatus.js';

// ----------------------------------------------------------------------------
// Outreach reads shared by the API routes. Tracked in #26.
//
// FAIL CLOSED. A send path that cannot read someone's outreach row does not
// send: "we could not tell whether they asked us to stop" must never read as
// "they did not". A count that cannot read the Removed set returns an error
// rather than a number that silently includes them.
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

export type RemovedIdsRead ={ ok: true; ids: string[] } | { ok: false };

export async function readRemovedIds(supabase: SupabaseClient): Promise<RemovedIdsRead> {
  const { data, error } = await supabase
    .from('waitlist_outreach')
    .select('waitlist_id')
    .eq('outreach_status', OUTREACH_REMOVED);
  if (error || !data) {
    console.error(JSON.stringify({ level: 'error', event: 'removed_ids_read_failed', error: error?.message }));
    return { ok: false };
  }
  return { ok: true, ids: (data as { waitlist_id: string }[]).map((r) => r.waitlist_id) };
}

// Adds "id not in (removed ids)" to a waitlist query. The ids are uuids read
// from our own table, so they need no escaping. With none removed, the query is
// returned unchanged (PostgREST rejects an empty in-list).
export function excludeIds<T extends { not(column: string, operator: string, value: unknown): T }>(
  query: T,
  ids: string[],
): T {
  return ids.length === 0 ? query : query.not('id', 'in', `(${ids.join(',')})`);
}

// One-to-one embeds can come back as an object or a one-element array
// depending on how PostgREST reads the relationship. Normalise both.
export function firstEmbedded<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}
