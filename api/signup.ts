import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

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
    const { email, segment, wants_tester_access, is_creator } = req.body || {};

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
    // STEP: Check founding member caps (separate pools)
    // -------------------------------------------------------------------------
    const MAX_FOUNDING_MEMBERS = 1000;          // General founding members
    const MAX_FOUNDING_MEMBER_CREATORS = 25;   // Founding member creators (separate pool)
    const MAX_TESTER_CREATORS = 10;
    const MAX_TESTER_CONSUMERS = 20;

    const isCreator = is_creator === true;

    let foundingCapReached = false;
    let foundingCreatorCapReached = false;

    if (isCreator) {
      // Creator signup: check founding member creator pool (cap 20)
      const { count, error: countError } = await supabase
        .from('waitlist')
        .select('*', { count: 'exact', head: true })
        .eq('is_founding_member_creator', true);

      if (countError) {
        console.error('[signup] Error counting founding member creators:', countError);
        return res.status(500).json({ error: 'Server error during signup' });
      }

      foundingCreatorCapReached = (count ?? 0) >= MAX_FOUNDING_MEMBER_CREATORS;
    } else {
      // Non-creator signup: check general founding member pool (cap 50)
      const { count, error: countError } = await supabase
        .from('waitlist')
        .select('*', { count: 'exact', head: true })
        .eq('is_founding_member', true);

      if (countError) {
        console.error('[signup] Error counting founding members:', countError);
        return res.status(500).json({ error: 'Server error during signup' });
      }

      foundingCapReached = (count ?? 0) >= MAX_FOUNDING_MEMBERS;
    }

    // -------------------------------------------------------------------------
    // STEP: Check if tester cap is reached
    // -------------------------------------------------------------------------
    let testerCapReached = false;

    if (wants_tester_access) {
      const maxTesterCap = isCreator ? MAX_TESTER_CREATORS : MAX_TESTER_CONSUMERS;

      const { count: testerCount, error: testerCountError } = await supabase
        .from('waitlist')
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
    } else {
      if (!foundingCapReached) {
        // Auto-assign as general Founding Member
        insertPayload.is_founding_member = true;
      } else {
        // General founding cap reached, assign to wave 1
        insertPayload.wave_number = 1;
        insertPayload.status = 'active';
      }
    }

    const { data, error } = await supabase
      .from('waitlist')
      .insert([insertPayload])
      .select('id, created_at, status, wave_number, is_founding_member, is_founding_member_creator')
      .single();

    if (error) {
      // Handle duplicate email (unique constraint violation)
      const isDuplicate =
        error.code === '23505' ||
        error.message?.includes('duplicate') ||
        (error as { status?: number }).status === 409;

      if (isDuplicate) {
        return res.status(409).json({ error: 'duplicate', message: 'Email already on waitlist' });
      }

      console.error('[signup] Insert error:', error);
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

              const claimUrl = 'https://lorem-curae-waitlist.vercel.app/member';
              const html = `<p>Hi there,</p>
<p>You're one of our first 100 founding members on Curae.</p>
<p>I personally text the first 100 — it's the fastest way to tell me what's working, what isn't, and what you want built next.</p>
<p><strong><a href="${claimUrl}">Claim your spot</a></strong></p>
<p>This offer expires in 48 hours. If you'd rather not, no worries — just ignore this email.</p>
<p>— Ethan Jones<br/>Founder, Curae</p>`;

              await fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: {
                  Authorization: `Bearer ${resendApiKey}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  from: 'Curae <hello@loremcurae.com>',
                  to: trimmedEmail,
                  subject: "A personal note from Ethan — you're in the first 100",
                  html,
                }),
              });
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

    // Spot number: count rows created before this one, then add 1 (same method
    // as the member dashboard). Surfaced so the confirmation screen can greet
    // founding members by their existing spot number.
    let position: number | undefined;
    if (data.created_at) {
      const { count: priorCount } = await supabase
        .from('waitlist')
        .select('id', { count: 'exact', head: true })
        .lt('created_at', data.created_at as string);
      position = (priorCount ?? 0) + 1;
    }

    return res.status(200).json({
      status: 'active',
      wave: data.wave_number,
      ...(position !== undefined && { position }),
      ...(testerCapReached && { testerCapReached: true }),
      ...(data.is_founding_member && { is_founding_member: true }),
      ...(data.is_founding_member_creator && { is_founding_member_creator: true }),
    });

  } catch (error: unknown) {
    console.error('[signup] Unexpected error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
