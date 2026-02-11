import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// ============================================================================
// PATCH /api/admin/update-waitlist-user
// ============================================================================
//
// Updates a single waitlist user's record.
// This is an admin-only endpoint with strict validation.
//
// Headers:
//   Authorization: Bearer <ADMIN_SECRET>
//
// Body:
//   {
//     email: string,                    // required, identifies the user
//     new_email?: string,               // optional, change user's email
//     wave_number?: 1 | 2 | 3 | null,   // optional
//     status?: 'active' | 'waiting_for_next_wave',  // optional
//     is_founding_member?: boolean,     // optional (cap 50)
//     is_founding_member_creator?: boolean,  // optional (cap 20, separate pool)
//     wants_tester_access?: boolean,    // optional
//     is_creator?: boolean              // optional
//   }
//
// Response:
//   {
//     updated: true,
//     user: {
//       email: string,
//       segment: string,
//       wave_number: number | null,
//       creator_wave_number: number | null,
//       status: string,
//       is_creator: boolean,
//       is_founding_member: boolean,
//       is_founding_member_creator: boolean,
//       wants_tester_access: boolean,
//       created_at: string,
//       updated_at: string | null
//     }
//   }
//
// Environment variables required:
//   - ADMIN_SECRET
//   - SUPABASE_URL
//   - SUPABASE_SERVICE_ROLE_KEY
//
// ============================================================================

const VALID_STATUSES = ['active', 'waiting_for_next_wave'] as const;
const VALID_WAVE_NUMBERS = [1, 2, 3] as const;
const MAX_FOUNDING_MEMBERS = 50;
const MAX_FOUNDING_MEMBER_CREATORS = 20;
const MAX_TESTER_CREATORS = 10;
const MAX_TESTER_CONSUMERS = 20;

type ValidStatus = (typeof VALID_STATUSES)[number];

interface UpdateRequestBody {
  email: string;
  new_email?: string;
  segment?: string;
  wave_number?: number | null;
  creator_wave_number?: number | null;
  status?: ValidStatus;
  is_creator?: boolean;
  is_founding_member?: boolean;
  is_founding_member_creator?: boolean;
  wants_tester_access?: boolean;
}

interface UpdatePayload {
  email?: string;
  segment?: string;
  wave_number?: number | null;
  creator_wave_number?: number | null;
  status?: ValidStatus;
  is_creator?: boolean;
  is_founding_member?: boolean;
  is_founding_member_creator?: boolean;
  wants_tester_access?: boolean;
}

// Simple email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isValidEmail(email: string): boolean {
  return EMAIL_REGEX.test(email);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // -------------------------------------------------------------------------
    // STEP: Validate request method
    // -------------------------------------------------------------------------
    if (req.method !== 'PATCH') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    // -------------------------------------------------------------------------
    // STEP: Validate environment variables
    // -------------------------------------------------------------------------
    const adminSecret = process.env.ADMIN_SECRET;
    if (!adminSecret) {
      console.error('[update-waitlist-user] Missing ADMIN_SECRET');
      return res.status(500).json({ error: 'Server misconfigured: missing ADMIN_SECRET' });
    }

    const supabaseUrl = process.env.SUPABASE_URL;
    if (!supabaseUrl) {
      console.error('[update-waitlist-user] Missing SUPABASE_URL');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceRoleKey) {
      console.error('[update-waitlist-user] Missing SUPABASE_SERVICE_ROLE_KEY');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    // -------------------------------------------------------------------------
    // STEP: Validate admin authorization
    // -------------------------------------------------------------------------
    const authHeader = req.headers.authorization;
    if (!authHeader || authHeader !== `Bearer ${adminSecret}`) {
      console.warn('[update-waitlist-user] Unauthorized request attempt');
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // -------------------------------------------------------------------------
    // STEP: Validate request body
    // -------------------------------------------------------------------------
    const body = req.body as UpdateRequestBody | undefined;

    if (!body || typeof body !== 'object') {
      return res.status(400).json({ error: 'Request body is required' });
    }

    const { email, new_email, wave_number, status, is_founding_member, is_founding_member_creator, wants_tester_access, is_creator } = body;

    // Validate email (required, identifies the user)
    if (!email || typeof email !== 'string') {
      return res.status(400).json({ error: 'email is required and must be a string' });
    }

    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail) {
      return res.status(400).json({ error: 'email cannot be empty' });
    }

    if (!isValidEmail(trimmedEmail)) {
      return res.status(400).json({ error: 'email must be a valid email address' });
    }

    // Build update payload and validate fields
    const updatePayload: UpdatePayload = {};
    let hasUpdateField = false;

    // Validate new_email if provided
    if (new_email !== undefined) {
      if (typeof new_email !== 'string') {
        return res.status(400).json({ error: 'new_email must be a string' });
      }
      const trimmedNewEmail = new_email.trim().toLowerCase();
      if (!trimmedNewEmail) {
        return res.status(400).json({ error: 'new_email cannot be empty' });
      }
      if (!isValidEmail(trimmedNewEmail)) {
        return res.status(400).json({ error: 'new_email must be a valid email address' });
      }
      updatePayload.email = trimmedNewEmail;
      hasUpdateField = true;
    }

    // Validate wave_number if provided
    if (wave_number !== undefined) {
      if (wave_number !== null) {
        if (typeof wave_number !== 'number' || !VALID_WAVE_NUMBERS.includes(wave_number as (typeof VALID_WAVE_NUMBERS)[number])) {
          return res.status(400).json({ error: 'wave_number must be 1, 2, 3, or null' });
        }
      }
      updatePayload.wave_number = wave_number;
      hasUpdateField = true;
    }

    // Validate status if provided
    if (status !== undefined) {
      if (typeof status !== 'string' || !VALID_STATUSES.includes(status as ValidStatus)) {
        return res.status(400).json({ error: `status must be one of: ${VALID_STATUSES.join(', ')}` });
      }
      updatePayload.status = status as ValidStatus;
      hasUpdateField = true;
    }

    // Validate is_founding_member if provided
    if (is_founding_member !== undefined) {
      if (typeof is_founding_member !== 'boolean') {
        return res.status(400).json({ error: 'is_founding_member must be a boolean' });
      }
      updatePayload.is_founding_member = is_founding_member;
      hasUpdateField = true;
    }

    // Validate is_founding_member_creator if provided
    if (is_founding_member_creator !== undefined) {
      if (typeof is_founding_member_creator !== 'boolean') {
        return res.status(400).json({ error: 'is_founding_member_creator must be a boolean' });
      }
      updatePayload.is_founding_member_creator = is_founding_member_creator;
      hasUpdateField = true;
    }

    // Validate wants_tester_access if provided
    if (wants_tester_access !== undefined) {
      if (typeof wants_tester_access !== 'boolean') {
        return res.status(400).json({ error: 'wants_tester_access must be a boolean' });
      }
      updatePayload.wants_tester_access = wants_tester_access;
      hasUpdateField = true;
    }

    // Validate is_creator if provided
    if (is_creator !== undefined) {
      if (typeof is_creator !== 'boolean') {
        return res.status(400).json({ error: 'is_creator must be a boolean' });
      }
      updatePayload.is_creator = is_creator;
      hasUpdateField = true;
    }

    // Ensure at least one field to update
    if (!hasUpdateField) {
      return res.status(400).json({
        error: 'At least one field to update must be provided (new_email, wave_number, status, is_founding_member, is_founding_member_creator, wants_tester_access, or is_creator)'
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
    // STEP: Check if user exists
    // -------------------------------------------------------------------------
    const { data: existingUser, error: lookupError } = await supabase
      .from('waitlist')
      .select('email')
      .eq('email', trimmedEmail)
      .single();

    if (lookupError || !existingUser) {
      if (lookupError?.code === 'PGRST116' || !existingUser) {
        return res.status(404).json({ error: 'User not found' });
      }
      console.error('[update-waitlist-user] Lookup error:', lookupError);
      return res.status(500).json({ error: 'Failed to look up user' });
    }

    // -------------------------------------------------------------------------
    // STEP: Enforce founding member cap (50 max)
    // -------------------------------------------------------------------------
    if (updatePayload.is_founding_member === true) {
      // Check if user is already a founding member (no net change)
      const { data: currentUser, error: currentUserError } = await supabase
        .from('waitlist')
        .select('is_founding_member')
        .eq('email', trimmedEmail)
        .single();

      if (currentUserError) {
        console.error('[update-waitlist-user] Error checking current founding status:', currentUserError);
        return res.status(500).json({ error: 'Failed to verify founding member status' });
      }

      if (!currentUser?.is_founding_member) {
        const { count, error: countError } = await supabase
          .from('waitlist')
          .select('*', { count: 'exact', head: true })
          .eq('is_founding_member', true);

        if (countError) {
          console.error('[update-waitlist-user] Error counting founding members:', countError);
          return res.status(500).json({ error: 'Failed to verify founding member count' });
        }

        if ((count ?? 0) >= MAX_FOUNDING_MEMBERS) {
          return res.status(409).json({
            error: `Founding member cap reached (${count}/${MAX_FOUNDING_MEMBERS}). Cannot add more founding members.`
          });
        }
      }
    }

    // -------------------------------------------------------------------------
    // STEP: Enforce founding member creator cap (20 max)
    // -------------------------------------------------------------------------
    if (updatePayload.is_founding_member_creator === true) {
      // Check if user is already a founding member creator (no net change)
      const { data: currentCreatorUser, error: currentCreatorUserError } = await supabase
        .from('waitlist')
        .select('is_founding_member_creator')
        .eq('email', trimmedEmail)
        .single();

      if (currentCreatorUserError) {
        console.error('[update-waitlist-user] Error checking current founding creator status:', currentCreatorUserError);
        return res.status(500).json({ error: 'Failed to verify founding member creator status' });
      }

      if (!currentCreatorUser?.is_founding_member_creator) {
        const { count, error: countError } = await supabase
          .from('waitlist')
          .select('*', { count: 'exact', head: true })
          .eq('is_founding_member_creator', true);

        if (countError) {
          console.error('[update-waitlist-user] Error counting founding member creators:', countError);
          return res.status(500).json({ error: 'Failed to verify founding member creator count' });
        }

        if ((count ?? 0) >= MAX_FOUNDING_MEMBER_CREATORS) {
          return res.status(409).json({
            error: `Founding member creator cap reached (${count}/${MAX_FOUNDING_MEMBER_CREATORS}). Cannot add more founding member creators.`
          });
        }
      }
    }

    // -------------------------------------------------------------------------
    // STEP: Enforce tester caps (10 creator testers, 20 consumer testers)
    // -------------------------------------------------------------------------
    const needsTesterCapCheck =
      updatePayload.wants_tester_access === true ||
      (updatePayload.is_creator !== undefined && updatePayload.wants_tester_access !== false);

    if (needsTesterCapCheck) {
      // Fetch current user state to determine the effective tester type after update
      const { data: currentTesterUser, error: testerUserError } = await supabase
        .from('waitlist')
        .select('wants_tester_access, is_creator')
        .eq('email', trimmedEmail)
        .single();

      if (testerUserError) {
        console.error('[update-waitlist-user] Error checking current tester status:', testerUserError);
        return res.status(500).json({ error: 'Failed to verify tester status' });
      }

      const effectiveWantsTester = updatePayload.wants_tester_access ?? currentTesterUser?.wants_tester_access ?? false;
      const effectiveIsCreator = updatePayload.is_creator ?? currentTesterUser?.is_creator ?? false;
      const wasAlreadyTesterOfSameType =
        currentTesterUser?.wants_tester_access === true &&
        currentTesterUser?.is_creator === effectiveIsCreator;

      if (effectiveWantsTester && !wasAlreadyTesterOfSameType) {
        const maxCap = effectiveIsCreator ? MAX_TESTER_CREATORS : MAX_TESTER_CONSUMERS;
        const testerType = effectiveIsCreator ? 'creator' : 'consumer';

        const { count: testerCount, error: testerCountError } = await supabase
          .from('waitlist')
          .select('*', { count: 'exact', head: true })
          .eq('wants_tester_access', true)
          .eq('is_creator', effectiveIsCreator);

        if (testerCountError) {
          console.error('[update-waitlist-user] Error counting testers:', testerCountError);
          return res.status(500).json({ error: 'Failed to verify tester count' });
        }

        if ((testerCount ?? 0) >= maxCap) {
          return res.status(409).json({
            error: `Tester ${testerType} cap reached (${testerCount}/${maxCap}). Cannot add more ${testerType} testers.`
          });
        }
      }
    }

    // -------------------------------------------------------------------------
    // STEP: Check for email conflict if changing email
    // -------------------------------------------------------------------------
    if (updatePayload.email && updatePayload.email !== trimmedEmail) {
      const { data: conflictUser } = await supabase
        .from('waitlist')
        .select('email')
        .eq('email', updatePayload.email)
        .single();

      if (conflictUser) {
        return res.status(409).json({ error: 'new_email already exists in waitlist' });
      }
    }

    // -------------------------------------------------------------------------
    // STEP: Update the waitlist record
    // -------------------------------------------------------------------------
    const { data, error } = await supabase
      .from('waitlist')
      .update(updatePayload)
      .eq('email', trimmedEmail)
      .select('email, segment, wave_number, creator_wave_number, status, is_creator, is_founding_member, is_founding_member_creator, wants_tester_access, created_at, updated_at')
      .single();

    if (error) {
      // Unique constraint violation (email already exists)
      if (error.code === '23505') {
        return res.status(409).json({ error: 'new_email already exists in waitlist' });
      }
      console.error('[update-waitlist-user] Update error:', error);
      return res.status(500).json({ error: 'Failed to update user' });
    }

    if (!data) {
      return res.status(404).json({ error: 'User not found' });
    }

    // -------------------------------------------------------------------------
    // STEP: Log the update
    // -------------------------------------------------------------------------
    console.log(JSON.stringify({
      level: 'info',
      event: 'waitlist_user_updated',
      original_email: trimmedEmail,
      updates: updatePayload,
      timestamp: new Date().toISOString(),
    }));

    // -------------------------------------------------------------------------
    // STEP: Return updated record
    // -------------------------------------------------------------------------
    return res.status(200).json({
      updated: true,
      user: {
        email: data.email,
        segment: data.segment,
        wave_number: data.wave_number,
        creator_wave_number: data.creator_wave_number,
        status: data.status,
        is_creator: data.is_creator,
        is_founding_member: data.is_founding_member,
        is_founding_member_creator: data.is_founding_member_creator,
        wants_tester_access: data.wants_tester_access,
        created_at: data.created_at,
        updated_at: data.updated_at,
      },
    });

  } catch (error: unknown) {
    console.error('[update-waitlist-user] Unexpected error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
