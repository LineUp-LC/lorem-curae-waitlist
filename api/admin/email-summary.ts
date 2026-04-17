import type { VercelRequest, VercelResponse } from '@vercel/node';
import { validateAdminRequest } from '../_adminAuth.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const auth = await validateAdminRequest(req);
  if (!auth.ok) return res.status(auth.status).json({ error: auth.error });
  const { supabase } = auth;

  // drip_send_log tracks all email sends with status 'sent' | 'failed'.
  // There is no bounce-tracking in this system, so total_bounced is always 0.
  const [sentResult, failedResult, recentFailuresResult] = await Promise.all([
    supabase
      .from('drip_send_log')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'sent'),
    supabase
      .from('drip_send_log')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'failed'),
    supabase
      .from('drip_send_log')
      .select('drip_event, sent_at, user_id, waitlist!user_id(email)')
      .eq('status', 'failed')
      .order('sent_at', { ascending: false })
      .limit(5),
  ]);

  if (sentResult.error || failedResult.error) {
    console.error('[email-summary] Count error:', sentResult.error ?? failedResult.error);
    return res.status(500).json({ error: 'Failed to fetch email summary' });
  }

  // Map drip_send_log rows to the shape the dashboard expects.
  type FailureRow = {
    drip_event: string;
    sent_at: string;
    waitlist: { email: string } | null;
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recent_failures = (recentFailuresResult.data ?? [] as any[]).map((row: FailureRow) => ({
    email: row.waitlist?.email ?? '(unknown)',
    template: row.drip_event,
    status: 'failed' as const,
    created_at: row.sent_at,
  }));

  return res.status(200).json({
    total_emails_sent: (sentResult.count ?? 0) + (failedResult.count ?? 0),
    total_bounced: 0,
    total_failed: failedResult.count ?? 0,
    recent_failures,
  });
}
