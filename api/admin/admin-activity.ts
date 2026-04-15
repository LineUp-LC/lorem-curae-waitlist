import type { VercelRequest, VercelResponse } from '@vercel/node';

// There is currently no admin_activity table in the database.
// This endpoint returns an empty events array so the dashboard renders
// gracefully. When an admin_activity table is added, replace the handler
// body with a real Supabase query.

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const adminSecret = process.env.ADMIN_SECRET;
  const authHeader = req.headers.authorization;
  if (!adminSecret || authHeader !== `Bearer ${adminSecret}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  return res.status(200).json({ events: [] });
}
