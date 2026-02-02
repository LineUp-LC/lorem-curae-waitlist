import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// ============================================================================
// GET /api/waitlist/recent-activity
// ============================================================================
//
// Returns anonymized recent waitlist activity.
// This is a public, read-only endpoint (no authentication required).
// No personal data is exposed.
//
// Response:
//   {
//     activity: Array<{
//       joined_at: string,
//       relative_time: string
//     }>
//   }
//
// Environment variables required:
//   - SUPABASE_URL
//   - SUPABASE_SERVICE_ROLE_KEY
//
// ============================================================================

/**
 * Computes a human-readable relative time string.
 */
function getRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 60) {
    return 'just now';
  }

  if (diffMinutes === 1) {
    return '1 minute ago';
  }

  if (diffMinutes < 60) {
    return `${diffMinutes} minutes ago`;
  }

  if (diffHours === 1) {
    return '1 hour ago';
  }

  if (diffHours < 24) {
    return `${diffHours} hours ago`;
  }

  if (diffDays === 1) {
    return '1 day ago';
  }

  if (diffDays < 30) {
    return `${diffDays} days ago`;
  }

  const diffWeeks = Math.floor(diffDays / 7);
  if (diffWeeks === 1) {
    return '1 week ago';
  }

  if (diffWeeks < 4) {
    return `${diffWeeks} weeks ago`;
  }

  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths === 1) {
    return '1 month ago';
  }

  return `${diffMonths} months ago`;
}

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
    const supabaseUrl = process.env.SUPABASE_URL;
    if (!supabaseUrl) {
      console.error('[waitlist/recent-activity] Missing SUPABASE_URL');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceRoleKey) {
      console.error('[waitlist/recent-activity] Missing SUPABASE_SERVICE_ROLE_KEY');
      return res.status(500).json({ error: 'Server configuration error' });
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
    // STEP: Query recent signups (only created_at)
    // -------------------------------------------------------------------------
    const { data, error } = await supabase
      .from('waitlist')
      .select('created_at')
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error('[waitlist/recent-activity] Query error:', error);
      return res.status(500).json({ error: 'Failed to fetch recent activity' });
    }

    // -------------------------------------------------------------------------
    // STEP: Transform to anonymized activity
    // -------------------------------------------------------------------------
    const activity = (data || []).map((row) => {
      const joinedAt = new Date(row.created_at);
      return {
        joined_at: joinedAt.toISOString(),
        relative_time: getRelativeTime(joinedAt),
      };
    });

    // -------------------------------------------------------------------------
    // STEP: Return anonymized activity
    // -------------------------------------------------------------------------
    return res.status(200).json({ activity });

  } catch (error: unknown) {
    console.error('[waitlist/recent-activity] Unexpected error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
