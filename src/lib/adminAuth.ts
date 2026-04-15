import { supabase } from './supabase';

// ----------------------------------------------------------------------------
// Admin auth helper — frontend only
// ----------------------------------------------------------------------------
// Returns the current Supabase session access token for use as an
// Authorization: Bearer header in admin API calls.
//
// Throws if there is no active session (user is not signed in).
// Admin API endpoints validate the token server-side and check the caller's
// email against the SUPABASE_ADMIN_EMAILS server env var.
// ----------------------------------------------------------------------------

export async function getAdminToken(): Promise<string> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    throw new Error('Not authenticated — please sign in to access the admin panel');
  }

  return session.access_token;
}
