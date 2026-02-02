import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// ============================================================================
// GET /api/admin/waitlist-logs
// ============================================================================
//
// Returns recent waitlist activity logs.
// This is an admin-only, read-only endpoint.
//
// Headers:
//   Authorization: Bearer <ADMIN_SECRET>
//
// Query parameters:
//   limit (optional): Number of logs to return (default 100, max 500)
//   event_type (optional): Filter by event type
//
// Response:
//   {
//     logs: Array<{
//       id: number,
//       event_type: string,
//       email: string | null,
//       metadata: object | null,
//       created_at: string
//     }>
//   }
//
// Environment variables required:
//   - ADMIN_SECRET
//   - SUPABASE_URL
//   - SUPABASE_SERVICE_ROLE_KEY
//
// ============================================================================

const DEFAULT_LIMIT = 100;
const MAX_LIMIT = 500;
const MIN_LIMIT = 1;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // -------------------------------------------------------------------------
    // STEP: Validate request method
    // -------------------------------------------------------------------------
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    // -------------------------------------------------------------------------
    // STEP: Validate environment variables
    // -------------------------------------------------------------------------
    const adminSecret = process.env.ADMIN_SECRET;
    if (!adminSecret) {
      console.error('[waitlist-logs] Missing ADMIN_SECRET');
      return res.status(500).json({ error: 'Server misconfigured: missing ADMIN_SECRET' });
    }

    const supabaseUrl = process.env.SUPABASE_URL;
    if (!supabaseUrl) {
      console.error('[waitlist-logs] Missing SUPABASE_URL');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceRoleKey) {
      console.error('[waitlist-logs] Missing SUPABASE_SERVICE_ROLE_KEY');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    // -------------------------------------------------------------------------
    // STEP: Validate admin authorization
    // -------------------------------------------------------------------------
    const authHeader = req.headers.authorization;
    if (!authHeader || authHeader !== `Bearer ${adminSecret}`) {
      console.warn('[waitlist-logs] Unauthorized request attempt');
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // -------------------------------------------------------------------------
    // STEP: Parse and validate query parameters
    // -------------------------------------------------------------------------
    const { limit: limitParam, event_type: eventTypeParam } = req.query;

    // Parse limit
    let limit = DEFAULT_LIMIT;
    if (limitParam !== undefined) {
      if (typeof limitParam !== 'string') {
        return res.status(400).json({ error: 'limit must be a single value' });
      }
      const parsedLimit = parseInt(limitParam, 10);
      if (isNaN(parsedLimit)) {
        return res.status(400).json({ error: 'limit must be an integer' });
      }
      if (parsedLimit < MIN_LIMIT || parsedLimit > MAX_LIMIT) {
        return res.status(400).json({ error: `limit must be between ${MIN_LIMIT} and ${MAX_LIMIT}` });
      }
      limit = parsedLimit;
    }

    // Parse event_type
    let eventType: string | null = null;
    if (eventTypeParam !== undefined) {
      if (typeof eventTypeParam !== 'string') {
        return res.status(400).json({ error: 'event_type must be a single value' });
      }
      const trimmed = eventTypeParam.trim();
      if (trimmed) {
        eventType = trimmed;
      }
    }

    // -------------------------------------------------------------------------
    // STEP: Create Supabase client
    // -------------------------------------------------------------------------
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // -------------------------------------------------------------------------
    // STEP: Query activity logs
    // -------------------------------------------------------------------------
    let query = supabase
      .from('waitlist_activity_log')
      .select('id, event_type, email, metadata, created_at')
      .order('created_at', { ascending: false })
      .limit(limit);

    // Apply event_type filter if provided
    if (eventType) {
      query = query.eq('event_type', eventType);
    }

    const { data, error } = await query;

    if (error) {
      // Table might not exist yet - return empty array gracefully
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        console.log('[waitlist-logs] Table does not exist, returning empty logs');
        return res.status(200).json({ logs: [] });
      }
      console.error('[waitlist-logs] Query error:', error);
      return res.status(500).json({ error: 'Failed to fetch logs' });
    }

    // -------------------------------------------------------------------------
    // STEP: Return logs
    // -------------------------------------------------------------------------
    return res.status(200).json({
      logs: data || [],
    });

  } catch (error: unknown) {
    console.error('[waitlist-logs] Unexpected error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
