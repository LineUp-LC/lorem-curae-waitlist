import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';

// ============================================================================
// POST /api/admin/anonymize-waitlist-user
// ============================================================================
//
// Anonymizes a waitlist user's personal data (GDPR-style erasure).
// This preserves analytics integrity while removing personal identifiers.
//
// Headers:
//   Authorization: Bearer <ADMIN_SECRET>
//
// Body:
//   { email: string }
//
// Response:
//   {
//     anonymized: true,
//     original_email: string,
//     new_email: string
//   }
//
// Behavior:
//   - Replaces email with 'anon_<uuid>@example.com'
//   - Preserves wave_number, status, is_founding_member, created_at
//   - Logs action to waitlist_activity_log
//
// Safety:
//   - Does NOT delete the user
//   - Does NOT modify analytics fields
//   - Requires admin authentication
//
// Environment variables required:
//   - ADMIN_SECRET
//   - SUPABASE_URL
//   - SUPABASE_SERVICE_ROLE_KEY
//
// ============================================================================

// Simple email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Generates an anonymized email address.
 * Format: anon_<uuid>@example.com
 */
function generateAnonymizedEmail(): string {
  return `anon_${randomUUID()}@example.com`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // -------------------------------------------------------------------------
    // STEP: Validate request method
    // -------------------------------------------------------------------------
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    // -------------------------------------------------------------------------
    // STEP: Validate environment variables
    // -------------------------------------------------------------------------
    const adminSecret = process.env.ADMIN_SECRET;
    if (!adminSecret) {
      console.error('[anonymize-waitlist-user] Missing ADMIN_SECRET');
      return res.status(500).json({ error: 'Server misconfigured: missing ADMIN_SECRET' });
    }

    const supabaseUrl = process.env.SUPABASE_URL;
    if (!supabaseUrl) {
      console.error('[anonymize-waitlist-user] Missing SUPABASE_URL');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceRoleKey) {
      console.error('[anonymize-waitlist-user] Missing SUPABASE_SERVICE_ROLE_KEY');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    // -------------------------------------------------------------------------
    // STEP: Validate admin authorization
    // -------------------------------------------------------------------------
    const authHeader = req.headers.authorization;
    if (!authHeader || authHeader !== `Bearer ${adminSecret}`) {
      console.warn('[anonymize-waitlist-user] Unauthorized request attempt');
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

    // Reject already-anonymized emails
    if (trimmedEmail.startsWith('anon_') && trimmedEmail.endsWith('@example.com')) {
      return res.status(400).json({ error: 'User is already anonymized' });
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
    // STEP: Check if user exists
    // -------------------------------------------------------------------------
    const { data: existingUser, error: fetchError } = await supabase
      .from('waitlist')
      .select('email, wave_number, status, is_founding_member, created_at')
      .eq('email', trimmedEmail)
      .maybeSingle();

    if (fetchError) {
      console.error('[anonymize-waitlist-user] Fetch error:', fetchError);
      return res.status(500).json({ error: 'Failed to verify user' });
    }

    if (!existingUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // -------------------------------------------------------------------------
    // STEP: Generate anonymized email
    // -------------------------------------------------------------------------
    const anonymizedEmail = generateAnonymizedEmail();

    // -------------------------------------------------------------------------
    // STEP: Update ONLY the email field
    // -------------------------------------------------------------------------
    const { error: updateError } = await supabase
      .from('waitlist')
      .update({ email: anonymizedEmail })
      .eq('email', trimmedEmail);

    if (updateError) {
      // Check for unique constraint violation (very unlikely with UUID)
      if (updateError.code === '23505') {
        console.error('[anonymize-waitlist-user] UUID collision, retrying...');
        // Retry with a new UUID
        const retryEmail = generateAnonymizedEmail();
        const { error: retryError } = await supabase
          .from('waitlist')
          .update({ email: retryEmail })
          .eq('email', trimmedEmail);

        if (retryError) {
          console.error('[anonymize-waitlist-user] Retry update error:', retryError);
          return res.status(500).json({ error: 'Failed to anonymize user' });
        }
      } else {
        console.error('[anonymize-waitlist-user] Update error:', updateError);
        return res.status(500).json({ error: 'Failed to anonymize user' });
      }
    }

    // -------------------------------------------------------------------------
    // STEP: Insert audit log entry
    // -------------------------------------------------------------------------
    const { error: logError } = await supabase.from('waitlist_activity_log').insert({
      event_type: 'admin_anonymize',
      email: trimmedEmail,
      metadata: {
        anonymized_to: anonymizedEmail,
        preserved_fields: {
          wave_number: existingUser.wave_number,
          status: existingUser.status,
          is_founding_member: existingUser.is_founding_member,
          created_at: existingUser.created_at,
        },
        anonymized_at: new Date().toISOString(),
      },
    });

    if (logError) {
      // Log the error but don't fail the request - anonymization already succeeded
      console.error('[anonymize-waitlist-user] Failed to write audit log:', logError);
    }

    // -------------------------------------------------------------------------
    // STEP: Log the action to console
    // -------------------------------------------------------------------------
    console.log(JSON.stringify({
      level: 'info',
      event: 'waitlist_user_anonymized',
      original_email: trimmedEmail,
      new_email: anonymizedEmail,
      timestamp: new Date().toISOString(),
    }));

    // -------------------------------------------------------------------------
    // STEP: Return success
    // -------------------------------------------------------------------------
    return res.status(200).json({
      anonymized: true,
      original_email: trimmedEmail,
      new_email: anonymizedEmail,
    });

  } catch (error: unknown) {
    console.error('[anonymize-waitlist-user] Unexpected error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
