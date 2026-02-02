import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// ============================================================================
// GET /api/admin/health-check
// ============================================================================
//
// Verifies Supabase and database health.
// This is an admin-only, read-only endpoint.
//
// Headers:
//   Authorization: Bearer <ADMIN_SECRET>
//
// Response:
//   {
//     database_connected: boolean,
//     waitlist_table_exists: boolean,
//     row_count: number,
//     latency_ms: number
//   }
//
// Safety:
//   - Read-only operations only
//   - Does NOT expose environment variables
//   - Does NOT expose user-level data
//   - Requires admin authentication
//
// Environment variables required:
//   - ADMIN_SECRET
//   - SUPABASE_URL
//   - SUPABASE_SERVICE_ROLE_KEY
//
// ============================================================================

interface HealthCheckResponse {
  database_connected: boolean;
  waitlist_table_exists: boolean;
  row_count: number;
  latency_ms: number;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const startTime = Date.now();

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
      console.error('[health-check] Missing ADMIN_SECRET');
      return res.status(500).json({ error: 'Server misconfigured: missing ADMIN_SECRET' });
    }

    const supabaseUrl = process.env.SUPABASE_URL;
    if (!supabaseUrl) {
      console.error('[health-check] Missing SUPABASE_URL');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceRoleKey) {
      console.error('[health-check] Missing SUPABASE_SERVICE_ROLE_KEY');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    // -------------------------------------------------------------------------
    // STEP: Validate admin authorization
    // -------------------------------------------------------------------------
    const authHeader = req.headers.authorization;
    if (!authHeader || authHeader !== `Bearer ${adminSecret}`) {
      console.warn('[health-check] Unauthorized request attempt');
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
    // STEP: Initialize response with defaults
    // -------------------------------------------------------------------------
    const response: HealthCheckResponse = {
      database_connected: false,
      waitlist_table_exists: false,
      row_count: 0,
      latency_ms: 0,
    };

    // -------------------------------------------------------------------------
    // STEP: Test database connection (SELECT NOW())
    // -------------------------------------------------------------------------
    const queryStartTime = Date.now();

    const { error: connectionError } = await supabase.rpc('now');

    // If rpc('now') doesn't work, try a simple query
    if (connectionError) {
      // Fallback: try selecting from waitlist with limit 0
      const { error: fallbackError } = await supabase
        .from('waitlist')
        .select('email', { count: 'exact', head: true })
        .limit(0);

      if (fallbackError && fallbackError.code !== '42P01') {
        // Not a "table doesn't exist" error - actual connection issue
        console.error('[health-check] Database connection failed:', fallbackError);
        response.latency_ms = Date.now() - queryStartTime;
        return res.status(200).json(response);
      }

      // If we get here, connection succeeded (even if table doesn't exist)
      response.database_connected = true;
    } else {
      response.database_connected = true;
    }

    // -------------------------------------------------------------------------
    // STEP: Check if waitlist table exists and get row count
    // -------------------------------------------------------------------------
    const { count, error: tableError } = await supabase
      .from('waitlist')
      .select('*', { count: 'exact', head: true });

    if (tableError) {
      if (tableError.code === '42P01' || tableError.message?.includes('does not exist')) {
        // Table doesn't exist
        response.waitlist_table_exists = false;
        response.row_count = 0;
      } else {
        // Other error - log it but don't expose details
        console.error('[health-check] Table check error:', tableError);
        response.waitlist_table_exists = false;
        response.row_count = 0;
      }
    } else {
      response.waitlist_table_exists = true;
      response.row_count = count ?? 0;
    }

    // -------------------------------------------------------------------------
    // STEP: Calculate latency
    // -------------------------------------------------------------------------
    response.latency_ms = Date.now() - queryStartTime;

    // -------------------------------------------------------------------------
    // STEP: Log health check result
    // -------------------------------------------------------------------------
    console.log(JSON.stringify({
      level: 'info',
      event: 'health_check',
      database_connected: response.database_connected,
      waitlist_table_exists: response.waitlist_table_exists,
      row_count: response.row_count,
      latency_ms: response.latency_ms,
      timestamp: new Date().toISOString(),
    }));

    // -------------------------------------------------------------------------
    // STEP: Return health check response
    // -------------------------------------------------------------------------
    return res.status(200).json(response);

  } catch (error: unknown) {
    const latency_ms = Date.now() - startTime;
    console.error('[health-check] Unexpected error:', error);

    // Return a failed health check response (don't expose error details)
    return res.status(200).json({
      database_connected: false,
      waitlist_table_exists: false,
      row_count: 0,
      latency_ms: latency_ms,
    } as HealthCheckResponse);
  }
}
