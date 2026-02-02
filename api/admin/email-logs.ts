import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// ============================================================================
// GET /api/admin/email-logs
// ============================================================================
//
// Returns recent email-sending logs for the waitlist system.
// This is an admin-only, read-only endpoint.
//
// Headers:
//   Authorization: Bearer <ADMIN_SECRET>
//
// Query parameters:
//   limit (optional): Number of logs to return (default 100, max 500)
//   email (optional): Filter by recipient email
//   template (optional): Filter by template name
//   status (optional): Filter by status ('sent' | 'failed')
//
// Response:
//   {
//     logs: Array<{
//       id: number,
//       email: string,
//       template: string,
//       status: string,
//       provider_message_id: string | null,
//       error: string | null,
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
const VALID_STATUSES = ['sent', 'failed'];

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
      console.error('[email-logs] Missing ADMIN_SECRET');
      return res.status(500).json({ error: 'Server misconfigured: missing ADMIN_SECRET' });
    }

    const supabaseUrl = process.env.SUPABASE_URL;
    if (!supabaseUrl) {
      console.error('[email-logs] Missing SUPABASE_URL');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceRoleKey) {
      console.error('[email-logs] Missing SUPABASE_SERVICE_ROLE_KEY');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    // -------------------------------------------------------------------------
    // STEP: Validate admin authorization
    // -------------------------------------------------------------------------
    const authHeader = req.headers.authorization;
    if (!authHeader || authHeader !== `Bearer ${adminSecret}`) {
      console.warn('[email-logs] Unauthorized request attempt');
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // -------------------------------------------------------------------------
    // STEP: Parse and validate query parameters
    // -------------------------------------------------------------------------
    const {
      limit: limitParam,
      email: emailParam,
      template: templateParam,
      status: statusParam,
    } = req.query;

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

    // Parse email filter
    let emailFilter: string | null = null;
    if (emailParam !== undefined) {
      if (typeof emailParam !== 'string') {
        return res.status(400).json({ error: 'email must be a single value' });
      }
      const trimmed = emailParam.trim().toLowerCase();
      if (trimmed) {
        emailFilter = trimmed;
      }
    }

    // Parse template filter
    let templateFilter: string | null = null;
    if (templateParam !== undefined) {
      if (typeof templateParam !== 'string') {
        return res.status(400).json({ error: 'template must be a single value' });
      }
      const trimmed = templateParam.trim();
      if (trimmed) {
        templateFilter = trimmed;
      }
    }

    // Parse status filter
    let statusFilter: string | null = null;
    if (statusParam !== undefined) {
      if (typeof statusParam !== 'string') {
        return res.status(400).json({ error: 'status must be a single value' });
      }
      const trimmed = statusParam.trim().toLowerCase();
      if (trimmed) {
        if (!VALID_STATUSES.includes(trimmed)) {
          return res.status(400).json({ error: `status must be one of: ${VALID_STATUSES.join(', ')}` });
        }
        statusFilter = trimmed;
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
    // STEP: Query email logs
    // -------------------------------------------------------------------------
    let query = supabase
      .from('email_log')
      .select('id, email, template, status, provider_message_id, error, created_at')
      .order('created_at', { ascending: false })
      .limit(limit);

    // Apply filters
    if (emailFilter) {
      query = query.eq('email', emailFilter);
    }
    if (templateFilter) {
      query = query.eq('template', templateFilter);
    }
    if (statusFilter) {
      query = query.eq('status', statusFilter);
    }

    const { data, error } = await query;

    if (error) {
      // Table might not exist yet - return empty array gracefully
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        console.log('[email-logs] Table does not exist, returning empty logs');
        return res.status(200).json({ logs: [] });
      }
      console.error('[email-logs] Query error:', error);
      return res.status(500).json({ error: 'Failed to fetch email logs' });
    }

    // -------------------------------------------------------------------------
    // STEP: Return logs
    // -------------------------------------------------------------------------
    return res.status(200).json({
      logs: data || [],
    });

  } catch (error: unknown) {
    console.error('[email-logs] Unexpected error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
