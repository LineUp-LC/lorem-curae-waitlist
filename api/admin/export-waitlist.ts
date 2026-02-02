import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// ============================================================================
// GET /api/admin/export-waitlist
// ============================================================================
//
// Exports filtered waitlist data as a CSV file.
// This is an admin-only, read-only endpoint.
//
// Headers:
//   Authorization: Bearer <ADMIN_SECRET>
//
// Query parameters (all optional):
//   wave_number (1 | 2 | 3 | null): Filter by wave number
//   status ('active' | 'waiting_for_next_wave'): Filter by status
//   is_founding_member ('true' | 'false'): Filter by founding member flag
//   is_founding_member_creator ('true' | 'false'): Filter by founding member creator flag
//   start_date (ISO timestamp): Filter created_at >= start_date
//   end_date (ISO timestamp): Filter created_at <= end_date
//   limit (integer): Max results to return (default 500, max 5000)
//
// Response:
//   Content-Type: text/csv
//   CSV file with columns: email, wave_number, status, is_founding_member, is_founding_member_creator, created_at
//
// Environment variables required:
//   - ADMIN_SECRET
//   - SUPABASE_URL
//   - SUPABASE_SERVICE_ROLE_KEY
//
// ============================================================================

const DEFAULT_LIMIT = 500;
const MAX_LIMIT = 5000;
const MIN_LIMIT = 1;
const VALID_WAVE_NUMBERS = [1, 2, 3];
const VALID_STATUSES = ['active', 'waiting_for_next_wave'];

// CSV column headers - exactly these fields, no more
const CSV_HEADERS = ['email', 'wave_number', 'status', 'is_founding_member', 'is_founding_member_creator', 'created_at'];

interface WaitlistRow {
  email: string;
  wave_number: number | null;
  status: string;
  is_founding_member: boolean;
  is_founding_member_creator: boolean;
  created_at: string;
}

/**
 * Escapes a CSV field value according to RFC 4180.
 * - Fields containing commas, quotes, or newlines are wrapped in quotes
 * - Quotes within fields are escaped by doubling them
 */
function escapeCSVField(value: string | number | boolean | null): string {
  if (value === null || value === undefined) {
    return '';
  }

  const stringValue = String(value);

  // Check if escaping is needed
  if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n') || stringValue.includes('\r')) {
    // Escape quotes by doubling them and wrap in quotes
    return `"${stringValue.replace(/"/g, '""')}"`;
  }

  return stringValue;
}

/**
 * Converts an array of waitlist rows to a CSV string.
 */
function toCSV(rows: WaitlistRow[]): string {
  const lines: string[] = [];

  // Add header row
  lines.push(CSV_HEADERS.join(','));

  // Add data rows
  for (const row of rows) {
    const fields = [
      escapeCSVField(row.email),
      escapeCSVField(row.wave_number),
      escapeCSVField(row.status),
      escapeCSVField(row.is_founding_member),
      escapeCSVField(row.is_founding_member_creator),
      escapeCSVField(row.created_at),
    ];
    lines.push(fields.join(','));
  }

  return lines.join('\r\n');
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
      console.error('[export-waitlist] Missing ADMIN_SECRET');
      return res.status(500).json({ error: 'Server misconfigured: missing ADMIN_SECRET' });
    }

    const supabaseUrl = process.env.SUPABASE_URL;
    if (!supabaseUrl) {
      console.error('[export-waitlist] Missing SUPABASE_URL');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceRoleKey) {
      console.error('[export-waitlist] Missing SUPABASE_SERVICE_ROLE_KEY');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    // -------------------------------------------------------------------------
    // STEP: Validate admin authorization
    // -------------------------------------------------------------------------
    const authHeader = req.headers.authorization;
    if (!authHeader || authHeader !== `Bearer ${adminSecret}`) {
      console.warn('[export-waitlist] Unauthorized request attempt');
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // -------------------------------------------------------------------------
    // STEP: Parse and validate query parameters
    // -------------------------------------------------------------------------
    const {
      wave_number: waveNumberParam,
      status: statusParam,
      is_founding_member: isFoundingMemberParam,
      is_founding_member_creator: isFoundingMemberCreatorParam,
      start_date: startDateParam,
      end_date: endDateParam,
      limit: limitParam,
    } = req.query;

    // Validate limit
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

    // Validate wave_number filter
    let waveNumberFilter: number | 'null' | null = null;
    if (waveNumberParam !== undefined) {
      if (typeof waveNumberParam !== 'string') {
        return res.status(400).json({ error: 'wave_number must be a single value' });
      }
      const trimmed = waveNumberParam.trim().toLowerCase();
      if (trimmed === 'null') {
        waveNumberFilter = 'null';
      } else {
        const parsed = parseInt(trimmed, 10);
        if (isNaN(parsed) || !VALID_WAVE_NUMBERS.includes(parsed)) {
          return res.status(400).json({ error: 'wave_number must be 1, 2, 3, or null' });
        }
        waveNumberFilter = parsed;
      }
    }

    // Validate status filter
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

    // Validate is_founding_member filter
    let isFoundingMemberFilter: boolean | null = null;
    if (isFoundingMemberParam !== undefined) {
      if (typeof isFoundingMemberParam !== 'string') {
        return res.status(400).json({ error: 'is_founding_member must be a single value' });
      }
      const trimmed = isFoundingMemberParam.trim().toLowerCase();
      if (trimmed === 'true') {
        isFoundingMemberFilter = true;
      } else if (trimmed === 'false') {
        isFoundingMemberFilter = false;
      } else if (trimmed) {
        return res.status(400).json({ error: 'is_founding_member must be true or false' });
      }
    }

    // Validate is_founding_member_creator filter
    let isFoundingMemberCreatorFilter: boolean | null = null;
    if (isFoundingMemberCreatorParam !== undefined) {
      if (typeof isFoundingMemberCreatorParam !== 'string') {
        return res.status(400).json({ error: 'is_founding_member_creator must be a single value' });
      }
      const trimmed = isFoundingMemberCreatorParam.trim().toLowerCase();
      if (trimmed === 'true') {
        isFoundingMemberCreatorFilter = true;
      } else if (trimmed === 'false') {
        isFoundingMemberCreatorFilter = false;
      } else if (trimmed) {
        return res.status(400).json({ error: 'is_founding_member_creator must be true or false' });
      }
    }

    // Validate start_date filter
    let startDateFilter: Date | null = null;
    if (startDateParam !== undefined) {
      if (typeof startDateParam !== 'string') {
        return res.status(400).json({ error: 'start_date must be a single value' });
      }
      const trimmed = startDateParam.trim();
      if (trimmed) {
        const parsed = new Date(trimmed);
        if (isNaN(parsed.getTime())) {
          return res.status(400).json({ error: 'start_date must be a valid ISO timestamp' });
        }
        startDateFilter = parsed;
      }
    }

    // Validate end_date filter
    let endDateFilter: Date | null = null;
    if (endDateParam !== undefined) {
      if (typeof endDateParam !== 'string') {
        return res.status(400).json({ error: 'end_date must be a single value' });
      }
      const trimmed = endDateParam.trim();
      if (trimmed) {
        const parsed = new Date(trimmed);
        if (isNaN(parsed.getTime())) {
          return res.status(400).json({ error: 'end_date must be a valid ISO timestamp' });
        }
        endDateFilter = parsed;
      }
    }

    // Validate date range logic
    if (startDateFilter && endDateFilter && startDateFilter > endDateFilter) {
      return res.status(400).json({ error: 'start_date must be before or equal to end_date' });
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
    // STEP: Build dynamic query
    // -------------------------------------------------------------------------
    let query = supabase
      .from('waitlist')
      .select('email, wave_number, status, is_founding_member, is_founding_member_creator, created_at')
      .order('created_at', { ascending: true })
      .limit(limit);

    // Apply wave_number filter
    if (waveNumberFilter !== null) {
      if (waveNumberFilter === 'null') {
        query = query.is('wave_number', null);
      } else {
        query = query.eq('wave_number', waveNumberFilter);
      }
    }

    // Apply status filter
    if (statusFilter) {
      query = query.eq('status', statusFilter);
    }

    // Apply is_founding_member filter
    if (isFoundingMemberFilter !== null) {
      query = query.eq('is_founding_member', isFoundingMemberFilter);
    }

    // Apply is_founding_member_creator filter
    if (isFoundingMemberCreatorFilter !== null) {
      query = query.eq('is_founding_member_creator', isFoundingMemberCreatorFilter);
    }

    // Apply start_date filter
    if (startDateFilter) {
      query = query.gte('created_at', startDateFilter.toISOString());
    }

    // Apply end_date filter
    if (endDateFilter) {
      query = query.lte('created_at', endDateFilter.toISOString());
    }

    // -------------------------------------------------------------------------
    // STEP: Execute query
    // -------------------------------------------------------------------------
    const { data, error } = await query;

    if (error) {
      // Table might not exist yet - return empty CSV gracefully
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        console.log('[export-waitlist] Table does not exist, returning empty CSV');
        const emptyCSV = CSV_HEADERS.join(',');
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', 'attachment; filename="waitlist-export.csv"');
        return res.status(200).send(emptyCSV);
      }
      console.error('[export-waitlist] Query error:', error);
      return res.status(500).json({ error: 'Failed to export waitlist' });
    }

    // -------------------------------------------------------------------------
    // STEP: Generate CSV
    // -------------------------------------------------------------------------
    const rows: WaitlistRow[] = (data || []).map((row) => ({
      email: row.email,
      wave_number: row.wave_number,
      status: row.status,
      is_founding_member: row.is_founding_member,
      is_founding_member_creator: row.is_founding_member_creator,
      created_at: row.created_at,
    }));

    const csv = toCSV(rows);

    // -------------------------------------------------------------------------
    // STEP: Log the export
    // -------------------------------------------------------------------------
    console.log(JSON.stringify({
      level: 'info',
      event: 'waitlist_exported',
      row_count: rows.length,
      filters: {
        wave_number: waveNumberFilter,
        status: statusFilter,
        is_founding_member: isFoundingMemberFilter,
        start_date: startDateFilter?.toISOString() ?? null,
        end_date: endDateFilter?.toISOString() ?? null,
        limit: limit,
      },
      timestamp: new Date().toISOString(),
    }));

    // -------------------------------------------------------------------------
    // STEP: Return CSV file
    // -------------------------------------------------------------------------
    const filename = `waitlist-export-${new Date().toISOString().split('T')[0]}.csv`;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.status(200).send(csv);

  } catch (error: unknown) {
    console.error('[export-waitlist] Unexpected error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
