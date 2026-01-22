import type { VercelRequest, VercelResponse } from '@vercel/node';
import { onTesterAccessOpenedBatch } from '../../src/lib/email/followupTriggers';

// ============================================================================
// POST /api/admin/open-tester-access
// ============================================================================
//
// Sends follow-up emails to ALL testers (tester_creator + tester_consumer).
// This is an admin-only endpoint protected by ADMIN_SECRET.
//
// Headers:
//   Authorization: Bearer <ADMIN_SECRET>
//
// Response:
//   { sent: number, failed: number, errors: [...] }
//
// Environment variables required:
//   - ADMIN_SECRET (for authentication)
//   - SUPABASE_URL
//   - SUPABASE_SERVICE_ROLE_KEY
//   - RESEND_API_KEY
//
// ============================================================================

export default async function handler(req: VercelRequest, res: VercelResponse) {
  console.log('[open-tester-access] Request received');

  try {
    // Validate method
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    // Validate admin secret from environment
    const adminSecret = process.env.ADMIN_SECRET;
    if (!adminSecret) {
      console.error('[open-tester-access] Missing ADMIN_SECRET environment variable');
      return res.status(500).json({ error: 'Server misconfigured: missing ADMIN_SECRET' });
    }

    // Validate authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || authHeader !== `Bearer ${adminSecret}`) {
      console.warn('[open-tester-access] Unauthorized request attempt');
      return res.status(401).json({ error: 'Unauthorized' });
    }

    console.log('[open-tester-access] Authorization validated, starting batch send...');

    const results = await onTesterAccessOpenedBatch();

    console.log(JSON.stringify({
      level: 'info',
      event: 'tester_access_batch_complete',
      sent: results.sent,
      failed: results.failed,
      timestamp: new Date().toISOString(),
    }));

    return res.status(200).json(results);
  } catch (error) {
    console.error('[open-tester-access] Error:', error);

    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
}
