import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// ============================================================================
// DELETE /api/admin/bulk-delete-fallback-users
// ============================================================================
//
// Bulk-deletes fallback waitlist users (wave_number IS NULL).
// This is an admin-only endpoint with audit logging.
//
// Headers:
//   Authorization: Bearer <ADMIN_SECRET>
//
// Body:
//   {
//     limit?: number   // optional, default 100, max 500
//   }
//
// Response:
//   {
//     deleted_count: number,
//     limit: number
//   }
//
// Safety:
//   - Only deletes users where wave_number IS NULL
//   - Deletes oldest users first (ordered by created_at ASC)
//   - Enforces a maximum limit of 500 per request
//   - Requires admin authentication
//   - Logs deletion to waitlist_activity_log for audit trail
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
    if (req.method !== 'DELETE') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    // -------------------------------------------------------------------------
    // STEP: Validate environment variables
    // -------------------------------------------------------------------------
    const adminSecret = process.env.ADMIN_SECRET;
    if (!adminSecret) {
      console.error('[bulk-delete-fallback-users] Missing ADMIN_SECRET');
      return res.status(500).json({ error: 'Server misconfigured: missing ADMIN_SECRET' });
    }

    const supabaseUrl = process.env.SUPABASE_URL;
    if (!supabaseUrl) {
      console.error('[bulk-delete-fallback-users] Missing SUPABASE_URL');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceRoleKey) {
      console.error('[bulk-delete-fallback-users] Missing SUPABASE_SERVICE_ROLE_KEY');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    // -------------------------------------------------------------------------
    // STEP: Validate admin authorization
    // -------------------------------------------------------------------------
    const authHeader = req.headers.authorization;
    if (!authHeader || authHeader !== `Bearer ${adminSecret}`) {
      console.warn('[bulk-delete-fallback-users] Unauthorized request attempt');
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // -------------------------------------------------------------------------
    // STEP: Validate request body
    // -------------------------------------------------------------------------
    const body = req.body as { limit?: unknown } | undefined;

    let limit = DEFAULT_LIMIT;

    if (body && typeof body === 'object' && body.limit !== undefined) {
      const { limit: limitParam } = body;

      if (typeof limitParam !== 'number' || !Number.isInteger(limitParam)) {
        return res.status(400).json({ error: 'limit must be an integer' });
      }

      if (limitParam < MIN_LIMIT || limitParam > MAX_LIMIT) {
        return res.status(400).json({ error: `limit must be between ${MIN_LIMIT} and ${MAX_LIMIT}` });
      }

      limit = limitParam;
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
    // STEP: Find fallback users to delete (wave_number IS NULL, oldest first)
    // -------------------------------------------------------------------------
    const { data: fallbackUsers, error: fetchError } = await supabase
      .from('waitlist')
      .select('email')
      .is('wave_number', null)
      .order('created_at', { ascending: true })
      .limit(limit);

    if (fetchError) {
      console.error('[bulk-delete-fallback-users] Fetch error:', fetchError);
      return res.status(500).json({ error: 'Failed to fetch fallback users' });
    }

    // If no fallback users found, return early
    if (!fallbackUsers || fallbackUsers.length === 0) {
      // Still log the attempt
      await supabase.from('waitlist_activity_log').insert({
        event_type: 'admin_bulk_delete_fallback',
        email: null,
        metadata: {
          deleted_count: 0,
          limit: limit,
          message: 'No fallback users found',
        },
      });

      return res.status(200).json({
        deleted_count: 0,
        limit: limit,
      });
    }

    // Extract emails of users to delete
    const emailsToDelete = fallbackUsers.map((user) => user.email);

    // -------------------------------------------------------------------------
    // STEP: Delete the fallback users
    // -------------------------------------------------------------------------
    const { error: deleteError, count: deletedCount } = await supabase
      .from('waitlist')
      .delete({ count: 'exact' })
      .in('email', emailsToDelete)
      .is('wave_number', null); // Double-check: only delete if still fallback

    if (deleteError) {
      console.error('[bulk-delete-fallback-users] Delete error:', deleteError);
      return res.status(500).json({ error: 'Failed to delete fallback users' });
    }

    const actualDeletedCount = deletedCount ?? 0;

    // -------------------------------------------------------------------------
    // STEP: Insert audit log entry
    // -------------------------------------------------------------------------
    const { error: logError } = await supabase.from('waitlist_activity_log').insert({
      event_type: 'admin_bulk_delete_fallback',
      email: null,
      metadata: {
        deleted_count: actualDeletedCount,
        limit: limit,
        deleted_emails: emailsToDelete,
        deleted_at: new Date().toISOString(),
      },
    });

    if (logError) {
      // Log the error but don't fail the request - deletion already succeeded
      console.error('[bulk-delete-fallback-users] Failed to write audit log:', logError);
    }

    // -------------------------------------------------------------------------
    // STEP: Log the deletion to console
    // -------------------------------------------------------------------------
    console.log(JSON.stringify({
      level: 'info',
      event: 'bulk_delete_fallback_users',
      deleted_count: actualDeletedCount,
      limit: limit,
      timestamp: new Date().toISOString(),
    }));

    // -------------------------------------------------------------------------
    // STEP: Return success
    // -------------------------------------------------------------------------
    return res.status(200).json({
      deleted_count: actualDeletedCount,
      limit: limit,
    });

  } catch (error: unknown) {
    console.error('[bulk-delete-fallback-users] Unexpected error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
