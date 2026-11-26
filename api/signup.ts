import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { MAX_FOUNDING_MEMBER_CREATORS } from '../src/lib/foundingMembers.js';
import { NOT_REMOVED_VIEW } from './_outreach.js';
import { firstForwardedFor, underRequestLimit } from './_rateLimit.js';
import { greetingHtml, validateFirstName } from './_greeting.js';
import { sendTextOfferEmail } from '../supabase/functions/_shared/textOfferEmail.js';

// ----------------------------------------------------------------------------
// API HANDLER - Waitlist Signup
// ----------------------------------------------------------------------------

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
    const supabaseUrl = process.env.SUPABASE_URL;
    if (!supabaseUrl) {
      console.error('[signup] Missing environment variable: SUPABASE_URL');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceRoleKey) {
      console.error('[signup] Missing environment variable: SUPABASE_SERVICE_ROLE_KEY');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    // -------------------------------------------------------------------------
    // STEP: Validate request body
    // -------------------------------------------------------------------------
    // C13 (2026-09-26): creator signups are closed. Curae has no creator product (apps/mobile/PRODUCT.md),
    // so an `is_creator` in the request body is ignored and every signup is a consumer signup. The
    // column and the admin checkbox stay; they no longer change a role or an email.
    const { email, segment, wants_tester_access, first_name } = req.body || {};

    // Required first name (waitlist #40). The same check, and the same wording, as
    // the form (validateFirstName in api/_greeting.ts). Refused below, once the
    // email is known, so that a DUPLICATE still gets its 409 (see there).
    const firstName = validateFirstName(first_name);

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const trimmedEmail = email.trim().toLowerCase();

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // -------------------------------------------------------------------------
    // STEP: Create Supabase admin client
    // -------------------------------------------------------------------------
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // -------------------------------------------------------------------------
    // STEP: Request limit, network key (before any read or write)
    // Over the limit: 429 and nothing is written or sent. If the counter cannot
    // be reached, the signup goes through (fail open).
    // -------------------------------------------------------------------------
    const forwardedFor = firstForwardedFor(req);
    if (forwardedFor && !(await underRequestLimit(supabase, 'ip', forwardedFor))) {
      return res.status(429).json({ error: 'too_many_requests' });
    }

    // DUPLICATE: identical response wherever it is detected. Before #40 every
    // signup for an email already on the list got this 409; it still does,
    // with or without a name (see the first-name step below).
    const respondDuplicate = async () => {
      // RE-SIGNUP FLAG (#26). If the existing record is Removed, count the
      // attempt so admin sees it. The status is never reset, and the response
      // is identical either way, so it reveals nothing. A failed flag is
      // logged and never fails the response.
      const { error: flagError } = await supabase.rpc('flag_removed_resignup', { p_email: trimmedEmail });
      if (flagError) {
        console.error(JSON.stringify({ level: 'error', event: 'resignup_flag_failed', error: flagError.message }));
      }
      return res.status(409).json({ error: 'duplicate', message: 'Email already on waitlist' });
    };

    // -------------------------------------------------------------------------
    // STEP: Refuse a missing or invalid first name (#40)
    //
    // Unless the email is already on the list: then the answer is the same 409
    // a duplicate always got, so the name check changes nothing for duplicates
    // (an old cached form that sends no name, say). If that lookup fails, the
    // name error stands, since the name is invalid either way.
    // -------------------------------------------------------------------------
    if (!firstName.ok) {
      const { data: existing, error: existingErr } = await supabase
        .from('waitlist')
        .select('id')
        .eq('email', trimmedEmail)
        .maybeSingle();
      if (existingErr) {
        console.error(JSON.stringify({ level: 'error', event: 'signup_duplicate_lookup_failed', error: existingErr.message }));
      } else if (existing) {
        return respondDuplicate();
      }
      return res.status(400).json({ error: 'invalid_first_name', message: firstName.error });
    }
    const firstNameValue = firstName.value;

    // -------------------------------------------------------------------------
    // STEP: Check founding member caps (separate pools)
    // -------------------------------------------------------------------------
    // The GENERAL founding decision is not made here any more (waitlist #43). The
    // assign_founding_number() BEFORE INSERT trigger makes it and stamps
    // founding_number in one locked step (migration 20261125024242_founding_number.sql),
    // so two signups at once cannot both take the 100th spot. This handler reads the
    // result back from the inserted row. Only the creator pool is still checked here.
    const MAX_TESTER_CREATORS = 10;
    const MAX_TESTER_CONSUMERS = 20;

    const isCreator = false;

    let foundingCreatorCapReached = false;

    if (isCreator) {
      // Creator signup: check the founding member creator pool
      const { count, error: countError } = await supabase
        .from('waitlist')
        .select('*', { count: 'exact', head: true })
        .eq('is_founding_member_creator', true);

      if (countError) {
        console.error('[signup] Error counting founding member creators:', countError);
        return res.status(500).json({ error: 'Server error during signup' });
      }

      foundingCreatorCapReached = (count ?? 0) >= MAX_FOUNDING_MEMBER_CREATORS;
    }

    // -------------------------------------------------------------------------
    // STEP: Check if tester cap is reached
    // -------------------------------------------------------------------------
    let testerCapReached = false;

    if (wants_tester_access) {
      const maxTesterCap = isCreator ? MAX_TESTER_CREATORS : MAX_TESTER_CONSUMERS;

      // Removed people are left out of the tester count (#26), filtered in the
      // database (waitlist 32). A failed read fails the signup rather than guess.
      const { count: testerCount, error: testerCountError } = await supabase
        .from(NOT_REMOVED_VIEW)
        .select('*', { count: 'exact', head: true })
        .eq('wants_tester_access', true)
        .eq('is_creator', isCreator);

      if (testerCountError) {
        console.error('[signup] Error counting testers:', testerCountError);
        return res.status(500).json({ error: 'Server error during signup' });
      }

      testerCapReached = (testerCount ?? 0) >= maxTesterCap;
    }

    // -------------------------------------------------------------------------
    // STEP: Insert into waitlist
    // -------------------------------------------------------------------------
    const insertPayload: Record<string, unknown> = {
      email: trimmedEmail,
      first_name: firstNameValue,
      segment: segment || 'regular',
      wants_tester_access: testerCapReached ? false : (wants_tester_access || false),
      is_creator: isCreator,
    };

    // Auto-assign founding status based on creator type and cap availability
    if (isCreator) {
      if (!foundingCreatorCapReached) {
        // Auto-assign as Founding Member Creator
        insertPayload.is_founding_member_creator = true;
      } else {
        // Creator founding cap reached, assign to wave 1
        insertPayload.wave_number = 1;
        insertPayload.status = 'active';
      }
    }
    // Non-creator: nothing is set here. The trigger decides is_founding_member and
    // founding_number, and gives a non-founder wave 1 / active as this code used to.

    const { data, error } = await supabase
      .from('waitlist')
      .insert([insertPayload])
      .select('id, created_at, status, wave_number, is_founding_member, is_founding_member_creator, founding_number, unsubscribe_token')
      .single();

    if (error) {
      // Handle duplicate email (unique constraint violation)
      const isDuplicate =
        error.code === '23505' ||
        error.message?.includes('duplicate') ||
        (error as { status?: number }).status === 409;

      if (isDuplicate) {
        return respondDuplicate();
      }

      // Code and message only, never the error object: a row-level error's
      // details quote the failing row, which holds the name and email (#40).
      console.error(JSON.stringify({ level: 'error', event: 'signup_insert_failed', code: error.code, error: error.message }));
      return res.status(500).json({ error: 'Failed to join waitlist' });
    }

    // -------------------------------------------------------------------------
    // STEP: Log founding member auto-assignment
    // -------------------------------------------------------------------------
    if (data.is_founding_member) {
      console.log(JSON.stringify({
        level: 'info',
        event: 'founding_member_auto_assigned',
        pool: 'general',
        email: trimmedEmail.substring(0, 3) + '***',
        timestamp: new Date().toISOString(),
      }));
    }
    if (data.is_founding_member_creator) {
      console.log(JSON.stringify({
        level: 'info',
        event: 'founding_member_auto_assigned',
        pool: 'creator',
        email: trimmedEmail.substring(0, 3) + '***',
        timestamp: new Date().toISOString(),
      }));
    }

    // -------------------------------------------------------------------------
    // STEP: Text opt-in offer for first 100 signups
    // THE 100 BELOW IS THE TEXT POOL, NOT THE FOUNDING CAP. They are unrelated and
    // coincidentally equal since 2026-09-18, when the founding cap moved 1000 -> 100.
    // This one is text_opt_in_config.slots_remaining: a mutable counter, decremented on
    // accept, that cascades to the next person when someone declines. The founding cap is
    // MAX_FOUNDING_MEMBERS (src/lib/foundingMembers.ts) and the founding_member_slots view.
    // Do not merge them, and do not replace either number with the other constant.
    // -------------------------------------------------------------------------
    // Fire-and-forget: do not block or fail the signup response if this errors.
    // NOTE: Sent immediately — a proper 24h delay queue is deferred (no
    // scheduler infrastructure exists yet).
    const resendApiKey = process.env.RESEND_API_KEY;
    if (resendApiKey && data.created_at) {
      (async () => {
        try {
          const { count: priorCount } = await supabase
            .from('waitlist')
            .select('id', { count: 'exact', head: true })
            .lt('created_at', data.created_at as string);

          const position = (priorCount ?? 0) + 1;

          // NOT the founding cap. This gates the TEXT offer, whose real bound is
          // text_opt_in_config.slots_remaining (100). The offer is deliberately
          // allowed to cascade past position 100 when someone declines, so this
          // outer filter stays at 1000 on purpose. Do not "align" it with
          // MAX_FOUNDING_MEMBERS -- they are different pools.
          if (position <= 1000) {
            const { data: config } = await supabase
              .from('text_opt_in_config')
              .select('slots_remaining')
              .single();

            if (config && (config as { slots_remaining: number }).slots_remaining > 0) {
              const now = new Date();
              const expiresAt = new Date(now.getTime() + 48 * 60 * 60 * 1000);

              await supabase
                .from('waitlist')
                .update({
                  text_opt_in_offer_sent_at: now.toISOString(),
                  text_opt_in_expires_at: expiresAt.toISOString(),
                })
                .eq('id', data.id);

              // The one copy of this email (#35 item 6), shared with the pass-on
              // and the unsubscribe edge function. It never throws.
              const sent = await sendTextOfferEmail(
                resendApiKey,
                trimmedEmail,
                greetingHtml(firstNameValue),
                (data.unsubscribe_token as string | null) ?? null,
              );
              if (!sent.ok) {
                console.error('[signup] Text opt-in offer email failed (non-fatal):', sent.status ?? '', sent.error);
              }
            }
          }
        } catch (err) {
          console.error('[signup] Text opt-in offer failed (non-fatal):', err);
        }
      })();
    }

    // -------------------------------------------------------------------------
    // STEP: Return response based on wave-cap logic
    // -------------------------------------------------------------------------
    if (data.status === 'waiting_for_next_wave') {
      return res.status(200).json({
        status: 'fallback',
        wave: null,
        message: 'You have a reserved spot. The next wave is not open yet.',
      });
    }

    // The founding number is the stored one, read back from the inserted row
    // (waitlist #43). It is never counted: every surface prints this same number.
    const foundingNumber =
      data.is_founding_member && Number.isInteger(data.founding_number) && (data.founding_number as number) > 0
        ? (data.founding_number as number)
        : undefined;

    return res.status(200).json({
      status: 'active',
      wave: data.wave_number,
      ...(foundingNumber !== undefined && { founding_number: foundingNumber }),
      ...(testerCapReached && { testerCapReached: true }),
      ...(data.is_founding_member && { is_founding_member: true }),
      ...(data.is_founding_member_creator && { is_founding_member_creator: true }),
    });

  } catch (error: unknown) {
    console.error('[signup] Unexpected error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
