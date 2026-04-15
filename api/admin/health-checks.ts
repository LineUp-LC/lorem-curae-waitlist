import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const adminSecret = process.env.ADMIN_SECRET;
  const authHeader = req.headers.authorization;
  if (!adminSecret || authHeader !== `Bearer ${adminSecret}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    return res.status(500).json({ error: 'Server misconfiguration' });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const [dbResult, flagsResult] = await Promise.all([
    // database: simple existence ping on the waitlist table
    supabase.from('waitlist').select('*', { count: 'exact', head: true }),
    // feature_flags: confirm table is reachable
    supabase.from('feature_flags').select('*', { count: 'exact', head: true }),
  ]);

  // email: RESEND_API_KEY must be set for emails to work
  const emailOk = !!process.env.RESEND_API_KEY;

  // magic_link: Supabase auth admin API is available if service role key is set
  // (same credential used to generate magic links in request-magic-link.ts)
  const magicLinkOk = !!supabaseUrl && !!serviceRoleKey;

  return res.status(200).json({
    database: { ok: !dbResult.error },
    email: { ok: emailOk },
    magic_link: { ok: magicLinkOk },
    feature_flags: { ok: !flagsResult.error },
    timestamp: new Date().toISOString(),
  });
}
