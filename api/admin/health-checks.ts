import type { VercelRequest, VercelResponse } from '@vercel/node';
import { validateAdminRequest } from '../_adminAuth.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const auth = await validateAdminRequest(req);
  if (!auth.ok) return res.status(auth.status).json({ error: auth.error });
  const { supabase } = auth;

  const [dbResult, flagsResult] = await Promise.all([
    // database: simple existence ping on the waitlist table
    supabase.from('waitlist').select('*', { count: 'exact', head: true }),
    // feature_flags: confirm table is reachable
    supabase.from('feature_flags').select('*', { count: 'exact', head: true }),
  ]);

  // email: RESEND_API_KEY must be set for emails to work
  const emailOk = !!process.env.RESEND_API_KEY;

  // magic_link: Supabase auth admin API is available if service role key is set
  const magicLinkOk = !!process.env.SUPABASE_URL && !!process.env.SUPABASE_SERVICE_ROLE_KEY;

  return res.status(200).json({
    database: { ok: !dbResult.error },
    email: { ok: emailOk },
    magic_link: { ok: magicLinkOk },
    feature_flags: { ok: !flagsResult.error },
    timestamp: new Date().toISOString(),
  });
}
