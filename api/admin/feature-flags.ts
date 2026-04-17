import type { VercelRequest, VercelResponse } from '@vercel/node';
import { validateAdminRequest } from '../_adminAuth.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const auth = await validateAdminRequest(req);
  if (!auth.ok) return res.status(auth.status).json({ error: auth.error });
  return res.status(200).json({ flags: [] });
}
