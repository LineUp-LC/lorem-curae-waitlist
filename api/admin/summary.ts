import type { VercelRequest, VercelResponse } from '@vercel/node';
import { validateAdminRequest } from '../_adminAuth';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const auth = await validateAdminRequest(req);
  if (!auth.ok) return res.status(auth.status).json({ error: auth.error });
  const { supabase } = auth;

  const [totalResult, waveResult, recentResult] = await Promise.all([
    supabase.from('waitlist').select('*', { count: 'exact', head: true }),
    supabase.from('waitlist').select('wave_number').not('wave_number', 'is', null),
    supabase
      .from('waitlist')
      .select('email, created_at, wave_number')
      .order('created_at', { ascending: false })
      .limit(10),
  ]);

  if (totalResult.error || waveResult.error || recentResult.error) {
    console.error('[summary] Query error:', totalResult.error ?? waveResult.error ?? recentResult.error);
    return res.status(500).json({ error: 'Failed to fetch summary data' });
  }

  // Aggregate wave counts in JS — avoids needing a DB function
  const waveCounts = new Map<number, number>();
  for (const row of waveResult.data ?? []) {
    if (row.wave_number != null) {
      waveCounts.set(row.wave_number, (waveCounts.get(row.wave_number) ?? 0) + 1);
    }
  }
  const users_per_wave = Array.from(waveCounts.entries())
    .map(([wave_number, count]) => ({ wave_number, count }))
    .sort((a, b) => a.wave_number - b.wave_number);

  return res.status(200).json({
    total_users: totalResult.count ?? 0,
    total_waves: waveCounts.size,
    users_per_wave,
    recent_signups: recentResult.data ?? [],
  });
}
