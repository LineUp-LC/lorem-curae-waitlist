import type { VercelRequest, VercelResponse } from '@vercel/node';
import { validateAdminRequest } from '../_adminAuth';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const auth = await validateAdminRequest(req);
  if (!auth.ok) return res.status(auth.status).json({ error: auth.error });
  const { supabase } = auth;

  const { data, error } = await supabase
    .from('waitlist')
    .select(
      'id, email, created_at, has_access, unsubscribed_at, wave_number, creator_wave_number, is_creator, is_founding_member, wants_tester_access'
    )
    .order('created_at', { ascending: true });

  if (error) {
    console.error('[waitlist-users] Fetch error:', error);
    return res.status(500).json({ error: 'Failed to fetch waitlist users' });
  }

  return res.status(200).json({ users: data ?? [] });
}
