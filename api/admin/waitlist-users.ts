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
