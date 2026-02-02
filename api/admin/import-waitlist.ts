import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// ============================================================================
// POST /api/admin/import-waitlist
// ============================================================================
//
// Bulk-imports waitlist users from a CSV file.
// This is an admin-only endpoint.
//
// Headers:
//   Authorization: Bearer <ADMIN_SECRET>
//   Content-Type: text/csv (or multipart/form-data)
//
// Body:
//   Raw CSV content or multipart form with "file" field
//
// CSV format:
//   Required: email
//   Optional: wave_number, status, is_founding_member, is_founding_member_creator, wants_tester_access, is_creator, created_at
//
// Response:
//   {
//     imported_count: number,
//     updated_count: number,
//     errors: Array<{ row: number, message: string }>
//   }
//
// Environment variables required:
//   - ADMIN_SECRET
//   - SUPABASE_URL
//   - SUPABASE_SERVICE_ROLE_KEY
//
// ============================================================================

const MAX_ROWS = 10000;
const MAX_FOUNDING_MEMBERS = 50;
const MAX_FOUNDING_MEMBER_CREATORS = 20;
const MAX_TESTER_CREATORS = 10;
const MAX_TESTER_CONSUMERS = 20;
const VALID_STATUSES = ['active', 'waiting_for_next_wave'];
const VALID_WAVE_NUMBERS = [1, 2, 3, null];

interface ParsedRow {
  email: string;
  wave_number?: number | null;
  status?: string;
  is_founding_member?: boolean;
  is_founding_member_creator?: boolean;
  wants_tester_access?: boolean;
  is_creator?: boolean;
  created_at?: string;
}

interface ImportError {
  row: number;
  message: string;
}

interface ImportResult {
  imported_count: number;
  updated_count: number;
  errors: ImportError[];
}

// -----------------------------------------------------------------------------
// CSV Parsing Helpers
// -----------------------------------------------------------------------------

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (inQuotes) {
      if (char === '"' && nextChar === '"') {
        current += '"';
        i++; // Skip next quote
      } else if (char === '"') {
        inQuotes = false;
      } else {
        current += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
  }

  result.push(current.trim());
  return result;
}

function parseCsv(content: string): { headers: string[]; rows: string[][] } {
  const lines = content.split(/\r?\n/).filter((line) => line.trim());

  if (lines.length === 0) {
    return { headers: [], rows: [] };
  }

  const headers = parseCsvLine(lines[0]).map((h) => h.toLowerCase().trim());
  const rows = lines.slice(1).map((line) => parseCsvLine(line));

  return { headers, rows };
}

function extractCsvFromMultipart(body: string | Buffer): string | null {
  const content = typeof body === 'string' ? body : body.toString('utf-8');

  // Check if it's multipart
  if (!content.includes('Content-Disposition')) {
    // Not multipart, return as-is (raw CSV)
    return content;
  }

  // Extract CSV content from multipart
  const boundaryMatch = content.match(/^-+[\w-]+/);
  if (!boundaryMatch) {
    return null;
  }

  // Find the file content between headers and next boundary
  const parts = content.split(boundaryMatch[0]);

  for (const part of parts) {
    if (part.includes('filename=') && part.includes('.csv')) {
      // Find where headers end (double newline)
      const headerEndIndex = part.search(/\r?\n\r?\n/);
      if (headerEndIndex !== -1) {
        const csvContent = part.slice(headerEndIndex).trim();
        // Remove trailing boundary markers
        return csvContent.replace(/\r?\n--.*$/, '').trim();
      }
    }
  }

  return null;
}

// -----------------------------------------------------------------------------
// Validation Helpers
// -----------------------------------------------------------------------------

function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function parseBoolean(value: string): boolean | null {
  const lower = value.toLowerCase().trim();
  if (lower === 'true' || lower === '1' || lower === 'yes') return true;
  if (lower === 'false' || lower === '0' || lower === 'no') return false;
  return null;
}

function parseWaveNumber(value: string): number | null | undefined {
  const trimmed = value.trim();
  if (trimmed === '' || trimmed.toLowerCase() === 'null') return null;
  const num = parseInt(trimmed, 10);
  if (isNaN(num)) return undefined; // Invalid
  return num;
}

function validateRow(
  row: string[],
  headers: string[],
  rowIndex: number
): { data: ParsedRow | null; error: ImportError | null } {
  const getValue = (col: string): string => {
    const idx = headers.indexOf(col);
    return idx >= 0 && idx < row.length ? row[idx].trim() : '';
  };

  // Email is required
  const email = getValue('email').toLowerCase();
  if (!email) {
    return { data: null, error: { row: rowIndex, message: 'Missing email' } };
  }
  if (!validateEmail(email)) {
    return { data: null, error: { row: rowIndex, message: `Invalid email: ${email}` } };
  }

  const parsed: ParsedRow = { email };

  // wave_number (optional)
  const waveStr = getValue('wave_number');
  if (waveStr) {
    const wave = parseWaveNumber(waveStr);
    if (wave === undefined) {
      return { data: null, error: { row: rowIndex, message: `Invalid wave_number: ${waveStr}` } };
    }
    if (wave !== null && !VALID_WAVE_NUMBERS.includes(wave)) {
      return { data: null, error: { row: rowIndex, message: `wave_number must be 1, 2, 3, or null` } };
    }
    parsed.wave_number = wave;
  }

  // status (optional)
  const status = getValue('status');
  if (status) {
    if (!VALID_STATUSES.includes(status)) {
      return { data: null, error: { row: rowIndex, message: `Invalid status: ${status}` } };
    }
    parsed.status = status;
  }

  // is_founding_member (optional)
  const foundingStr = getValue('is_founding_member');
  if (foundingStr) {
    const founding = parseBoolean(foundingStr);
    if (founding === null) {
      return { data: null, error: { row: rowIndex, message: `Invalid is_founding_member: ${foundingStr}` } };
    }
    parsed.is_founding_member = founding;
  }

  // is_founding_member_creator (optional)
  const foundingCreatorStr = getValue('is_founding_member_creator');
  if (foundingCreatorStr) {
    const foundingCreator = parseBoolean(foundingCreatorStr);
    if (foundingCreator === null) {
      return { data: null, error: { row: rowIndex, message: `Invalid is_founding_member_creator: ${foundingCreatorStr}` } };
    }
    parsed.is_founding_member_creator = foundingCreator;
  }

  // wants_tester_access (optional)
  const testerStr = getValue('wants_tester_access');
  if (testerStr) {
    const tester = parseBoolean(testerStr);
    if (tester === null) {
      return { data: null, error: { row: rowIndex, message: `Invalid wants_tester_access: ${testerStr}` } };
    }
    parsed.wants_tester_access = tester;
  }

  // is_creator (optional)
  const creatorStr = getValue('is_creator');
  if (creatorStr) {
    const creator = parseBoolean(creatorStr);
    if (creator === null) {
      return { data: null, error: { row: rowIndex, message: `Invalid is_creator: ${creatorStr}` } };
    }
    parsed.is_creator = creator;
  }

  // created_at (optional)
  const createdAt = getValue('created_at');
  if (createdAt) {
    const date = new Date(createdAt);
    if (isNaN(date.getTime())) {
      return { data: null, error: { row: rowIndex, message: `Invalid created_at: ${createdAt}` } };
    }
    parsed.created_at = date.toISOString();
  }

  return { data: parsed, error: null };
}

// -----------------------------------------------------------------------------
// Handler
// -----------------------------------------------------------------------------

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
      console.error('[import-waitlist] Missing ADMIN_SECRET');
      return res.status(500).json({ error: 'Server misconfigured: missing ADMIN_SECRET' });
    }

    const supabaseUrl = process.env.SUPABASE_URL;
    if (!supabaseUrl) {
      console.error('[import-waitlist] Missing SUPABASE_URL');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceRoleKey) {
      console.error('[import-waitlist] Missing SUPABASE_SERVICE_ROLE_KEY');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    // -------------------------------------------------------------------------
    // STEP: Validate admin authorization
    // -------------------------------------------------------------------------
    const authHeader = req.headers.authorization;
    if (!authHeader || authHeader !== `Bearer ${adminSecret}`) {
      console.warn('[import-waitlist] Unauthorized request attempt');
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // -------------------------------------------------------------------------
    // STEP: Extract CSV content
    // -------------------------------------------------------------------------
    if (!req.body) {
      return res.status(400).json({ error: 'Request body is required' });
    }

    const csvContent = extractCsvFromMultipart(req.body);
    if (!csvContent) {
      return res.status(400).json({ error: 'Could not parse CSV from request body' });
    }

    // -------------------------------------------------------------------------
    // STEP: Parse CSV
    // -------------------------------------------------------------------------
    const { headers, rows } = parseCsv(csvContent);

    if (!headers.includes('email')) {
      return res.status(400).json({ error: 'CSV must have an "email" column' });
    }

    if (rows.length === 0) {
      return res.status(400).json({ error: 'CSV has no data rows' });
    }

    if (rows.length > MAX_ROWS) {
      return res.status(400).json({ error: `CSV exceeds maximum of ${MAX_ROWS} rows` });
    }

    // -------------------------------------------------------------------------
    // STEP: Validate all rows
    // -------------------------------------------------------------------------
    const validRows: ParsedRow[] = [];
    const errors: ImportError[] = [];

    for (let i = 0; i < rows.length; i++) {
      const { data, error } = validateRow(rows[i], headers, i + 2); // +2 for 1-indexed + header row
      if (error) {
        errors.push(error);
      } else if (data) {
        validRows.push(data);
      }
    }

    // If too many errors, abort early
    if (errors.length > 100) {
      return res.status(400).json({
        error: 'Too many validation errors',
        errors: errors.slice(0, 100),
      });
    }

    if (validRows.length === 0) {
      return res.status(400).json({
        error: 'No valid rows to import',
        errors,
      });
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
    // STEP: Check which emails already exist
    // -------------------------------------------------------------------------
    const emails = validRows.map((r) => r.email);
    const { data: existingUsers, error: fetchError } = await supabase
      .from('waitlist')
      .select('email')
      .in('email', emails);

    if (fetchError) {
      console.error('[import-waitlist] Fetch error:', fetchError);
      return res.status(500).json({ error: 'Failed to check existing users' });
    }

    const existingEmails = new Set((existingUsers || []).map((u) => u.email));

    // -------------------------------------------------------------------------
    // STEP: Separate inserts and updates
    // -------------------------------------------------------------------------
    const toInsert: ParsedRow[] = [];
    const toUpdate: ParsedRow[] = [];

    for (const row of validRows) {
      if (existingEmails.has(row.email)) {
        toUpdate.push(row);
      } else {
        toInsert.push(row);
      }
    }

    // -------------------------------------------------------------------------
    // STEP: Enforce founding member cap (50 max)
    // -------------------------------------------------------------------------
    const newFoundingInserts = toInsert.filter((r) => r.is_founding_member === true).length;

    // For updates, check which users being set to founding member aren't already one
    const updatingToFounding = toUpdate.filter((r) => r.is_founding_member === true);
    let newFoundingUpgrades = 0;

    if (updatingToFounding.length > 0) {
      const upgradeEmails = updatingToFounding.map((r) => r.email);
      const { data: alreadyFounding, error: checkError } = await supabase
        .from('waitlist')
        .select('email')
        .in('email', upgradeEmails)
        .eq('is_founding_member', true);

      if (checkError) {
        console.error('[import-waitlist] Error checking founding status:', checkError);
        return res.status(500).json({ error: 'Failed to verify founding member status' });
      }

      const alreadyFoundingEmails = new Set((alreadyFounding || []).map((u) => u.email));
      newFoundingUpgrades = updatingToFounding.filter((r) => !alreadyFoundingEmails.has(r.email)).length;
    }

    if (newFoundingInserts + newFoundingUpgrades > 0) {
      const { count: currentFoundingCount, error: countError } = await supabase
        .from('waitlist')
        .select('*', { count: 'exact', head: true })
        .eq('is_founding_member', true);

      if (countError) {
        console.error('[import-waitlist] Error counting founding members:', countError);
        return res.status(500).json({ error: 'Failed to verify founding member count' });
      }

      const totalAfterImport = (currentFoundingCount ?? 0) + newFoundingInserts + newFoundingUpgrades;
      if (totalAfterImport > MAX_FOUNDING_MEMBERS) {
        const slotsRemaining = MAX_FOUNDING_MEMBERS - (currentFoundingCount ?? 0);
        return res.status(409).json({
          error: `Founding member cap would be exceeded. Current: ${currentFoundingCount}/${MAX_FOUNDING_MEMBERS}. Import wants to add ${newFoundingInserts + newFoundingUpgrades} more. Slots remaining: ${slotsRemaining}.`
        });
      }
    }

    // -------------------------------------------------------------------------
    // STEP: Enforce founding member creator cap (20 max)
    // -------------------------------------------------------------------------
    const newFoundingCreatorInserts = toInsert.filter((r) => r.is_founding_member_creator === true).length;

    // For updates, check which users being set to founding member creator aren't already one
    const updatingToFoundingCreator = toUpdate.filter((r) => r.is_founding_member_creator === true);
    let newFoundingCreatorUpgrades = 0;

    if (updatingToFoundingCreator.length > 0) {
      const upgradeEmails = updatingToFoundingCreator.map((r) => r.email);
      const { data: alreadyFoundingCreator, error: checkError } = await supabase
        .from('waitlist')
        .select('email')
        .in('email', upgradeEmails)
        .eq('is_founding_member_creator', true);

      if (checkError) {
        console.error('[import-waitlist] Error checking founding creator status:', checkError);
        return res.status(500).json({ error: 'Failed to verify founding member creator status' });
      }

      const alreadyFoundingCreatorEmails = new Set((alreadyFoundingCreator || []).map((u) => u.email));
      newFoundingCreatorUpgrades = updatingToFoundingCreator.filter((r) => !alreadyFoundingCreatorEmails.has(r.email)).length;
    }

    if (newFoundingCreatorInserts + newFoundingCreatorUpgrades > 0) {
      const { count: currentFoundingCreatorCount, error: countError } = await supabase
        .from('waitlist')
        .select('*', { count: 'exact', head: true })
        .eq('is_founding_member_creator', true);

      if (countError) {
        console.error('[import-waitlist] Error counting founding member creators:', countError);
        return res.status(500).json({ error: 'Failed to verify founding member creator count' });
      }

      const totalAfterImport = (currentFoundingCreatorCount ?? 0) + newFoundingCreatorInserts + newFoundingCreatorUpgrades;
      if (totalAfterImport > MAX_FOUNDING_MEMBER_CREATORS) {
        const slotsRemaining = MAX_FOUNDING_MEMBER_CREATORS - (currentFoundingCreatorCount ?? 0);
        return res.status(409).json({
          error: `Founding member creator cap would be exceeded. Current: ${currentFoundingCreatorCount}/${MAX_FOUNDING_MEMBER_CREATORS}. Import wants to add ${newFoundingCreatorInserts + newFoundingCreatorUpgrades} more. Slots remaining: ${slotsRemaining}.`
        });
      }
    }

    // -------------------------------------------------------------------------
    // STEP: Enforce tester caps (10 creator testers, 20 consumer testers)
    // -------------------------------------------------------------------------
    const newTesterCreatorInserts = toInsert.filter((r) => r.wants_tester_access === true && r.is_creator === true).length;
    const newTesterConsumerInserts = toInsert.filter((r) => r.wants_tester_access === true && r.is_creator !== true).length;

    const updatingToTesterCreator = toUpdate.filter((r) => r.wants_tester_access === true && r.is_creator === true);
    const updatingToTesterConsumer = toUpdate.filter((r) => r.wants_tester_access === true && r.is_creator !== true);

    let newTesterCreatorUpgrades = 0;
    let newTesterConsumerUpgrades = 0;

    if (updatingToTesterCreator.length > 0) {
      const upgradeEmails = updatingToTesterCreator.map((r) => r.email);
      const { data: alreadyTesterCreators, error: checkError } = await supabase
        .from('waitlist')
        .select('email')
        .in('email', upgradeEmails)
        .eq('wants_tester_access', true)
        .eq('is_creator', true);

      if (checkError) {
        console.error('[import-waitlist] Error checking tester creator status:', checkError);
        return res.status(500).json({ error: 'Failed to verify tester creator status' });
      }

      const alreadyEmails = new Set((alreadyTesterCreators || []).map((u) => u.email));
      newTesterCreatorUpgrades = updatingToTesterCreator.filter((r) => !alreadyEmails.has(r.email)).length;
    }

    if (updatingToTesterConsumer.length > 0) {
      const upgradeEmails = updatingToTesterConsumer.map((r) => r.email);
      const { data: alreadyTesterConsumers, error: checkError } = await supabase
        .from('waitlist')
        .select('email')
        .in('email', upgradeEmails)
        .eq('wants_tester_access', true)
        .eq('is_creator', false);

      if (checkError) {
        console.error('[import-waitlist] Error checking tester consumer status:', checkError);
        return res.status(500).json({ error: 'Failed to verify tester consumer status' });
      }

      const alreadyEmails = new Set((alreadyTesterConsumers || []).map((u) => u.email));
      newTesterConsumerUpgrades = updatingToTesterConsumer.filter((r) => !alreadyEmails.has(r.email)).length;
    }

    const totalNewTesterCreators = newTesterCreatorInserts + newTesterCreatorUpgrades;
    const totalNewTesterConsumers = newTesterConsumerInserts + newTesterConsumerUpgrades;

    if (totalNewTesterCreators > 0 || totalNewTesterConsumers > 0) {
      if (totalNewTesterCreators > 0) {
        const { count: currentCreatorTesters, error: countError } = await supabase
          .from('waitlist')
          .select('*', { count: 'exact', head: true })
          .eq('wants_tester_access', true)
          .eq('is_creator', true);

        if (countError) {
          console.error('[import-waitlist] Error counting creator testers:', countError);
          return res.status(500).json({ error: 'Failed to verify tester creator count' });
        }

        const totalAfterImport = (currentCreatorTesters ?? 0) + totalNewTesterCreators;
        if (totalAfterImport > MAX_TESTER_CREATORS) {
          const slotsRemaining = MAX_TESTER_CREATORS - (currentCreatorTesters ?? 0);
          return res.status(409).json({
            error: `Tester creator cap would be exceeded. Current: ${currentCreatorTesters}/${MAX_TESTER_CREATORS}. Import wants to add ${totalNewTesterCreators} more. Slots remaining: ${slotsRemaining}.`
          });
        }
      }

      if (totalNewTesterConsumers > 0) {
        const { count: currentConsumerTesters, error: countError } = await supabase
          .from('waitlist')
          .select('*', { count: 'exact', head: true })
          .eq('wants_tester_access', true)
          .eq('is_creator', false);

        if (countError) {
          console.error('[import-waitlist] Error counting consumer testers:', countError);
          return res.status(500).json({ error: 'Failed to verify tester consumer count' });
        }

        const totalAfterImport = (currentConsumerTesters ?? 0) + totalNewTesterConsumers;
        if (totalAfterImport > MAX_TESTER_CONSUMERS) {
          const slotsRemaining = MAX_TESTER_CONSUMERS - (currentConsumerTesters ?? 0);
          return res.status(409).json({
            error: `Tester consumer cap would be exceeded. Current: ${currentConsumerTesters}/${MAX_TESTER_CONSUMERS}. Import wants to add ${totalNewTesterConsumers} more. Slots remaining: ${slotsRemaining}.`
          });
        }
      }
    }

    // -------------------------------------------------------------------------
    // STEP: Insert new users
    // -------------------------------------------------------------------------
    let importedCount = 0;

    if (toInsert.length > 0) {
      const insertData = toInsert.map((row) => ({
        email: row.email,
        wave_number: row.wave_number ?? null,
        status: row.status ?? 'waiting_for_next_wave',
        is_founding_member: row.is_founding_member ?? false,
        is_founding_member_creator: row.is_founding_member_creator ?? false,
        wants_tester_access: row.wants_tester_access ?? false,
        is_creator: row.is_creator ?? false,
        created_at: row.created_at ?? new Date().toISOString(),
      }));

      const { error: insertError } = await supabase
        .from('waitlist')
        .insert(insertData);

      if (insertError) {
        console.error('[import-waitlist] Insert error:', insertError);
        errors.push({ row: 0, message: `Batch insert failed: ${insertError.message}` });
      } else {
        importedCount = toInsert.length;
      }
    }

    // -------------------------------------------------------------------------
    // STEP: Update existing users
    // -------------------------------------------------------------------------
    let updatedCount = 0;

    for (const row of toUpdate) {
      const updateData: Record<string, unknown> = {};

      if (row.wave_number !== undefined) updateData.wave_number = row.wave_number;
      if (row.status !== undefined) updateData.status = row.status;
      if (row.is_founding_member !== undefined) updateData.is_founding_member = row.is_founding_member;
      if (row.is_founding_member_creator !== undefined) updateData.is_founding_member_creator = row.is_founding_member_creator;
      if (row.wants_tester_access !== undefined) updateData.wants_tester_access = row.wants_tester_access;
      if (row.is_creator !== undefined) updateData.is_creator = row.is_creator;
      if (row.created_at !== undefined) updateData.created_at = row.created_at;

      if (Object.keys(updateData).length > 0) {
        const { error: updateError } = await supabase
          .from('waitlist')
          .update(updateData)
          .eq('email', row.email);

        if (updateError) {
          errors.push({ row: 0, message: `Update failed for ${row.email}: ${updateError.message}` });
        } else {
          updatedCount++;
        }
      }
    }

    // -------------------------------------------------------------------------
    // STEP: Log the import
    // -------------------------------------------------------------------------
    console.log(JSON.stringify({
      level: 'info',
      event: 'waitlist_import',
      imported_count: importedCount,
      updated_count: updatedCount,
      error_count: errors.length,
      timestamp: new Date().toISOString(),
    }));

    // -------------------------------------------------------------------------
    // STEP: Return result
    // -------------------------------------------------------------------------
    const result: ImportResult = {
      imported_count: importedCount,
      updated_count: updatedCount,
      errors,
    };

    return res.status(200).json(result);

  } catch (error: unknown) {
    console.error('[import-waitlist] Unexpected error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// Enable raw body parsing for multipart
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};
