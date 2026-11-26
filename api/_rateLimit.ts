import type { VercelRequest } from '@vercel/node';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createHash } from 'node:crypto';

// ----------------------------------------------------------------------------
// REQUEST LIMIT (our own counter, Ethan's pick). Used by api/request-magic-link.ts
// and api/signup.ts. The limits themselves live only in public.hit_request_limit
// (migration 20261126013622_waitlist_scale_safety.sql).
// Keys leave this server as SHA-256 hashes, never the raw email or address.
// FAIL OPEN: if the counter cannot be reached (error, odd reply, or 3 s with
// no answer), the request is allowed and one line is logged, with no email.
// ----------------------------------------------------------------------------
const REQUEST_LIMIT_TIMEOUT_MS = 3000;

export function firstForwardedFor(req: VercelRequest): string | null {
  const header = req.headers['x-forwarded-for'];
  const value = Array.isArray(header) ? header[0] : header;
  const first = value?.split(',')[0]?.trim();
  return first ? first : null;
}

export async function underRequestLimit(supabase: SupabaseClient, kind: 'email' | 'ip', raw: string): Promise<boolean> {
  const keyHash = createHash('sha256').update(`${kind}:${raw}`).digest('hex');
  try {
    const { data, error } = await supabase
      .rpc('hit_request_limit', { p_kind: kind, p_key_hash: keyHash })
      .abortSignal(AbortSignal.timeout(REQUEST_LIMIT_TIMEOUT_MS));
    if (error || typeof data !== 'boolean') {
      console.error(JSON.stringify({ level: 'error', event: 'request_limit_unavailable', kind, error: error?.message ?? 'bad_reply' }));
      return true;
    }
    return data;
  } catch (err) {
    console.error(JSON.stringify({ level: 'error', event: 'request_limit_unavailable', kind, error: err instanceof Error ? err.message : String(err) }));
    return true;
  }
}
