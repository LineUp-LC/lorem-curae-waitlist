// ============================================================================
// UNSUBSCRIBE — Supabase Edge Function
// ============================================================================
// Handles one-click unsubscribe links embedded in all Curae emails.
// Accepts GET /functions/v1/unsubscribe?token=<unsubscribe_token>
//
// The token is the unsubscribe_token UUID stored on the waitlist row.
// On success, sets unsubscribed_at = now() on the matching row.
//
// Returns a minimal HTML page — no branding, no navigation, no redirect.
// ============================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

// ----------------------------------------------------------------------------
// HTML HELPERS
// ----------------------------------------------------------------------------

function htmlPage(message: string): Response {
  const body = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Unsubscribe</title>
</head>
<body style="font-family:sans-serif;display:flex;justify-content:center;align-items:center;min-height:100vh;margin:0;background:#fff;">
  <p style="font-size:16px;color:#333;text-align:center;max-width:400px;padding:0 16px;">${message}</p>
</body>
</html>`;

  return new Response(body, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}

function htmlError(message: string, status: number): Response {
  const body = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Unsubscribe</title>
</head>
<body style="font-family:sans-serif;display:flex;justify-content:center;align-items:center;min-height:100vh;margin:0;background:#fff;">
  <p style="font-size:16px;color:#333;text-align:center;max-width:400px;padding:0 16px;">${message}</p>
</body>
</html>`;

  return new Response(body, {
    status,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}

// ----------------------------------------------------------------------------
// HANDLER
// ----------------------------------------------------------------------------

serve(async (req: Request) => {
  if (req.method !== 'GET') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  const url = new URL(req.url);
  const token = url.searchParams.get('token');

  if (!token) {
    return htmlError('This unsubscribe link is invalid.', 400);
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

  if (!supabaseUrl || !serviceRoleKey) {
    console.error(JSON.stringify({ level: 'error', event: 'missing_env', fn: 'unsubscribe' }));
    return htmlError('Something went wrong. Please try again later.', 500);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Look up the token.
  // deno-lint-ignore no-explicit-any
  const { data, error } = await (supabase as any)
    .from('waitlist')
    .select('id, unsubscribed_at')
    .eq('unsubscribe_token', token)
    .maybeSingle();

  if (error) {
    console.error(JSON.stringify({ level: 'error', event: 'token_lookup_failed', error: error.message }));
    return htmlError('Something went wrong. Please try again later.', 500);
  }

  if (!data) {
    return htmlError('This unsubscribe link is invalid.', 404);
  }

  if (data.unsubscribed_at) {
    return htmlPage("You&#8217;re already unsubscribed.");
  }

  // Mark unsubscribed.
  // deno-lint-ignore no-explicit-any
  const { error: updateError } = await (supabase as any)
    .from('waitlist')
    .update({ unsubscribed_at: new Date().toISOString() })
    .eq('id', data.id);

  if (updateError) {
    console.error(JSON.stringify({ level: 'error', event: 'unsubscribe_update_failed', error: updateError.message }));
    return htmlError('Something went wrong. Please try again later.', 500);
  }

  console.log(JSON.stringify({ level: 'info', event: 'unsubscribed', userId: data.id }));

  return htmlPage("You&#8217;ve been unsubscribed. You won&#8217;t hear from us again.");
});

// deno-lint-ignore no-explicit-any
declare const Deno: any;
