import type { VercelRequest, VercelResponse } from '@vercel/node';
import { onConsumerWaveOpenedBatch } from '../../src/lib/email/followupTriggers';

// ============================================================================
// POST /api/admin/open-consumer-wave
// ============================================================================
//
// Sends follow-up emails to all consumers in a specific wave (1-7).
// This is an admin-only endpoint protected by ADMIN_SECRET.
//
// Headers:
//   Authorization: Bearer <ADMIN_SECRET>
//
// Body:
//   { "waveNumber": 1 | 2 | 3 | 4 | 5 | 6 | 7 }
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
  console.log('[open-consumer-wave] Request received');

  try {
    // Validate method
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    // Validate admin secret from environment
    const adminSecret = process.env.ADMIN_SECRET;
    if (!adminSecret) {
      console.error('[open-consumer-wave] Missing ADMIN_SECRET environment variable');
      return res.status(500).json({ error: 'Server misconfigured: missing ADMIN_SECRET' });
    }

    // Validate authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || authHeader !== `Bearer ${adminSecret}`) {
      console.warn('[open-consumer-wave] Unauthorized request attempt');
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Validate request body
    const { waveNumber } = req.body || {};

    if (waveNumber === undefined || waveNumber === null) {
      return res.status(400).json({ error: 'Missing required field: waveNumber' });
    }

    if (![1, 2, 3, 4, 5, 6, 7].includes(waveNumber)) {
      return res.status(400).json({ error: 'waveNumber must be 1, 2, 3, 4, 5, 6, or 7' });
    }

    console.log(`[open-consumer-wave] Authorization validated, starting batch send for wave ${waveNumber}...`);

    const results = await onConsumerWaveOpenedBatch(waveNumber as 1 | 2 | 3 | 4 | 5 | 6 | 7);

    console.log(JSON.stringify({
      level: 'info',
      event: 'consumer_wave_batch_complete',
      waveNumber,
      sent: results.sent,
      failed: results.failed,
      timestamp: new Date().toISOString(),
    }));

    return res.status(200).json(results);
  } catch (error) {
    console.error('[open-consumer-wave] Error:', error);

    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
}
