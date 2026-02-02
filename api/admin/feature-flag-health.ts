import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// ============================================================================
// GET /api/admin/feature-flag-health
// ============================================================================
//
// Validates feature-flag integrity by checking that all required flags exist,
// have correct types, and are safe to use.
// This is an admin-only, read-only endpoint.
//
// Headers:
//   Authorization: Bearer <ADMIN_SECRET>
//
// Response:
//   {
//     all_valid: boolean,
//     missing_flags: string[],
//     invalid_type_flags: Array<{ key: string, expected: string, actual: string }>,
//     unexpected_flags: string[],
//     total_flags: number
//   }
//
// Safety:
//   - Does NOT expose environment variables
//   - Does NOT expose raw flag values
//   - Read-only operation
//   - Requires admin authentication
//
// Environment variables required:
//   - ADMIN_SECRET
//   - SUPABASE_URL
//   - SUPABASE_SERVICE_ROLE_KEY
//
// ============================================================================

// Required feature flags and their expected types
const REQUIRED_FLAGS: Record<string, 'boolean' | 'string' | 'number' | 'array'> = {
  enable_magic_link_login: 'boolean',
  enable_wave_promotion: 'boolean',
  enable_founding_member_flow: 'boolean',
  enable_admin_tools: 'boolean',
  waitlist_open: 'boolean', // This flag uses enabled_for array, but we validate presence
};

// All known/expected flag keys
const KNOWN_FLAG_KEYS = new Set(Object.keys(REQUIRED_FLAGS));

interface FeatureFlagRow {
  key: string;
  enabled: boolean | null;
  enabled_for: string[] | null;
  metadata: Record<string, unknown> | null;
}

interface InvalidTypeFlag {
  key: string;
  expected: string;
  actual: string;
}

interface HealthCheckResponse {
  all_valid: boolean;
  missing_flags: string[];
  invalid_type_flags: InvalidTypeFlag[];
  unexpected_flags: string[];
  total_flags: number;
}

/**
 * Determines the actual type of a flag value.
 */
function getActualType(value: unknown): string {
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  if (Array.isArray(value)) return 'array';
  return typeof value;
}

/**
 * Validates a flag's value against its expected type.
 * For flags using enabled_for array, we check if it's a valid array.
 * For flags using enabled boolean, we check if it's a boolean.
 */
function validateFlagType(
  flag: FeatureFlagRow,
  expectedType: 'boolean' | 'string' | 'number' | 'array'
): { valid: boolean; actual: string } {
  // Special handling for waitlist_open which uses enabled_for array
  if (flag.key === 'waitlist_open') {
    const actualType = getActualType(flag.enabled_for);
    return {
      valid: Array.isArray(flag.enabled_for),
      actual: actualType,
    };
  }

  // Standard boolean flags check the enabled field
  if (expectedType === 'boolean') {
    const actualType = getActualType(flag.enabled);
    return {
      valid: typeof flag.enabled === 'boolean',
      actual: actualType,
    };
  }

  // For other types, check enabled_for or metadata as appropriate
  const actualType = getActualType(flag.enabled);
  return {
    valid: actualType === expectedType,
    actual: actualType,
  };
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
    const adminSecret = process.env.ADMIN_SECRET;
    if (!adminSecret) {
      console.error('[feature-flag-health] Missing ADMIN_SECRET');
      return res.status(500).json({ error: 'Server misconfigured: missing ADMIN_SECRET' });
    }

    const supabaseUrl = process.env.SUPABASE_URL;
    if (!supabaseUrl) {
      console.error('[feature-flag-health] Missing SUPABASE_URL');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceRoleKey) {
      console.error('[feature-flag-health] Missing SUPABASE_SERVICE_ROLE_KEY');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    // -------------------------------------------------------------------------
    // STEP: Validate admin authorization
    // -------------------------------------------------------------------------
    const authHeader = req.headers.authorization;
    if (!authHeader || authHeader !== `Bearer ${adminSecret}`) {
      console.warn('[feature-flag-health] Unauthorized request attempt');
      return res.status(401).json({ error: 'Unauthorized' });
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
    // STEP: Fetch all feature flags
    // -------------------------------------------------------------------------
    const { data: flags, error: fetchError } = await supabase
      .from('feature_flags')
      .select('key, enabled, enabled_for, metadata');

    if (fetchError) {
      // Table might not exist
      if (fetchError.code === '42P01' || fetchError.message?.includes('does not exist')) {
        console.log('[feature-flag-health] feature_flags table does not exist');
        return res.status(200).json({
          all_valid: false,
          missing_flags: Object.keys(REQUIRED_FLAGS),
          invalid_type_flags: [],
          unexpected_flags: [],
          total_flags: 0,
        } as HealthCheckResponse);
      }
      console.error('[feature-flag-health] Fetch error:', fetchError);
      return res.status(500).json({ error: 'Failed to fetch feature flags' });
    }

    const flagRows = (flags || []) as FeatureFlagRow[];

    // -------------------------------------------------------------------------
    // STEP: Build a map of existing flags
    // -------------------------------------------------------------------------
    const existingFlags = new Map<string, FeatureFlagRow>();
    for (const flag of flagRows) {
      existingFlags.set(flag.key, flag);
    }

    // -------------------------------------------------------------------------
    // STEP: Validate flags
    // -------------------------------------------------------------------------
    const missingFlags: string[] = [];
    const invalidTypeFlags: InvalidTypeFlag[] = [];
    const unexpectedFlags: string[] = [];

    // Check for missing required flags
    for (const [key, expectedType] of Object.entries(REQUIRED_FLAGS)) {
      const flag = existingFlags.get(key);

      if (!flag) {
        missingFlags.push(key);
        continue;
      }

      // Validate type
      const validation = validateFlagType(flag, expectedType);
      if (!validation.valid) {
        invalidTypeFlags.push({
          key,
          expected: expectedType,
          actual: validation.actual,
        });
      }
    }

    // Check for unexpected flags
    for (const flag of flagRows) {
      if (!KNOWN_FLAG_KEYS.has(flag.key)) {
        unexpectedFlags.push(flag.key);
      }
    }

    // -------------------------------------------------------------------------
    // STEP: Compute overall validity
    // -------------------------------------------------------------------------
    const allValid =
      missingFlags.length === 0 &&
      invalidTypeFlags.length === 0;
    // Note: unexpected flags don't invalidate the health check, they're just warnings

    // -------------------------------------------------------------------------
    // STEP: Log the health check result
    // -------------------------------------------------------------------------
    console.log(JSON.stringify({
      level: 'info',
      event: 'feature_flag_health_check',
      all_valid: allValid,
      missing_count: missingFlags.length,
      invalid_type_count: invalidTypeFlags.length,
      unexpected_count: unexpectedFlags.length,
      total_flags: flagRows.length,
      timestamp: new Date().toISOString(),
    }));

    // -------------------------------------------------------------------------
    // STEP: Return health check response
    // -------------------------------------------------------------------------
    const response: HealthCheckResponse = {
      all_valid: allValid,
      missing_flags: missingFlags,
      invalid_type_flags: invalidTypeFlags,
      unexpected_flags: unexpectedFlags,
      total_flags: flagRows.length,
    };

    return res.status(200).json(response);

  } catch (error: unknown) {
    console.error('[feature-flag-health] Unexpected error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
