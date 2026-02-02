import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// ============================================================================
// DELETE /api/admin/delete-waitlist-user
// ============================================================================
//
// Deletes a single user from the waitlist by exact email match.
// This is an admin-only endpoint with audit logging.
//
// Headers:
//   Authorization: Bearer <ADMIN_SECRET>
//
// Body:
//   { email: string }
//
// Response:
//   { deleted: true, email: string }
//
// Safety:
//   - Only deletes ONE user at a time
//   - Requires exact email match (no wildcards)
//   - Requires admin authentication
//   - Logs deletion to waitlist_activity_log for audit trail
//
// Environment variables required:
//   - ADMIN_SECRET
//   - SUPABASE_URL
//   - SUPABASE_SERVICE_ROLE_KEY
//
// ============================================================================

// Simple email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface WaitlistUser {
  email: string;
  wave_number: number | null;
  status: string;
  is_founding_member: boolean;
  created_at: string;
}

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
      console.error('[delete-waitlist-user] Missing ADMIN_SECRET');
      return res.status(500).json({ error: 'Server misconfigured: missing ADMIN_SECRET' });
    }

    const supabaseUrl = process.env.SUPABASE_URL;
    if (!supabaseUrl) {
      console.error('[delete-waitlist-user] Missing SUPABASE_URL');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceRoleKey) {
      console.error('[delete-waitlist-user] Missing SUPABASE_SERVICE_ROLE_KEY');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    // -------------------------------------------------------------------------
    // STEP: Validate admin authorization
    // -------------------------------------------------------------------------
    const authHeader = req.headers.authorization;
    if (!authHeader || authHeader !== `Bearer ${adminSecret}`) {
      console.warn('[delete-waitlist-user] Unauthorized request attempt');
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // -------------------------------------------------------------------------
    // STEP: Validate request body
    // -------------------------------------------------------------------------
    const body = req.body as { email?: unknown } | undefined;

    if (!body || typeof body !== 'object') {
      return res.status(400).json({ error: 'Request body is required' });
    }

    const { email } = body;

    // Validate email is present and is a string
    if (email === undefined || email === null) {
      return res.status(400).json({ error: 'email is required' });
    }

    if (typeof email !== 'string') {
      return res.status(400).json({ error: 'email must be a string' });
    }

    const trimmedEmail = email.trim().toLowerCase();

    // Reject empty email
    if (!trimmedEmail) {
      return res.status(400).json({ error: 'email cannot be empty' });
    }

    // Basic email format validation
    if (!EMAIL_REGEX.test(trimmedEmail)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Reject any attempt at wildcards or SQL injection patterns
    if (trimmedEmail.includes('%') || trimmedEmail.includes('*') || trimmedEmail.includes(';')) {
      return res.status(400).json({ error: 'Invalid email format' });
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
    // STEP: Fetch user data before deletion (for audit log)
    // -------------------------------------------------------------------------
    const { data: existingUser, error: fetchError } = await supabase
      .from('waitlist')
      .select('email, wave_number, status, is_founding_member, created_at')
      .eq('email', trimmedEmail)
      .maybeSingle();

    if (fetchError) {
      console.error('[delete-waitlist-user] Fetch error:', fetchError);
      return res.status(500).json({ error: 'Failed to verify user' });
    }

    if (!existingUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Store user data for audit log before deletion
    const userSnapshot: WaitlistUser = {
      email: existingUser.email,
      wave_number: existingUser.wave_number,
      status: existingUser.status,
      is_founding_member: existingUser.is_founding_member,
      created_at: existingUser.created_at,
    };

    // -------------------------------------------------------------------------
    // STEP: Delete the user
    // -------------------------------------------------------------------------
    const { error: deleteError } = await supabase
      .from('waitlist')
      .delete()
      .eq('email', trimmedEmail);

    if (deleteError) {
      console.error('[delete-waitlist-user] Delete error:', deleteError);
      return res.status(500).json({ error: 'Failed to delete user' });
    }

    // -------------------------------------------------------------------------
    // STEP: Insert audit log entry
    // -------------------------------------------------------------------------
    const { error: logError } = await supabase
      .from('waitlist_activity_log')
      .insert({
        event_type: 'admin_delete_user',
        email: trimmedEmail,
        metadata: {
          action: 'delete',
          deleted_user_snapshot: {
            wave_number: userSnapshot.wave_number,
            status: userSnapshot.status,
            is_founding_member: userSnapshot.is_founding_member,
            original_created_at: userSnapshot.created_at,
          },
          deleted_at: new Date().toISOString(),
        },
      });

    if (logError) {
      // Log the error but don't fail the request - deletion already succeeded
      // This ensures GDPR deletion isn't blocked by logging issues
      console.error('[delete-waitlist-user] Failed to write audit log:', logError);
    }

    // -------------------------------------------------------------------------
    // STEP: Log the deletion to console
    // -------------------------------------------------------------------------
    console.log(JSON.stringify({
      level: 'info',
      event: 'waitlist_user_deleted',
      email: trimmedEmail,
      wave_number: userSnapshot.wave_number,
      status: userSnapshot.status,
      is_founding_member: userSnapshot.is_founding_member,
      timestamp: new Date().toISOString(),
    }));

    // -------------------------------------------------------------------------
    // STEP: Return success
    // -------------------------------------------------------------------------
    return res.status(200).json({
      deleted: true,
      email: trimmedEmail,
    });

  } catch (error: unknown) {
    console.error('[delete-waitlist-user] Unexpected error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
