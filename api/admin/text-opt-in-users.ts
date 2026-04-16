import type { VercelRequest, VercelResponse } from '@vercel/node';
import { validateAdminRequest } from '../_adminAuth.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const auth = await validateAdminRequest(req);
  if (!auth.ok) return res.status(auth.status).json({ error: auth.error });
  const { supabase } = auth;

  const [usersResult, configResult] = await Promise.all([
    supabase
      .from('waitlist')
      .select('email, phone_number, wave_number, is_founding_member, text_opt_in_offer_sent_at, created_at')
      .eq('text_opt_in', true)
      .order('created_at', { ascending: true }),
    supabase
      .from('text_opt_in_config')
      .select('slots_remaining')
      .single(),
  ]);

  if (usersResult.error) {
    console.error('[text-opt-in-users] Fetch error:', usersResult.error);
    return res.status(500).json({ error: 'Failed to fetch opted-in users' });
  }

  return res.status(200).json({
    users: usersResult.data ?? [],
    slots_remaining: (configResult.data as { slots_remaining: number } | null)?.slots_remaining ?? 0,
  });
}
