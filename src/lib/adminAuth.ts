import { supabase } from './supabase';

// ----------------------------------------------------------------------------
// Admin auth helper — frontend only
// ----------------------------------------------------------------------------
// Returns a valid Supabase session access token for Authorization: Bearer
// headers in admin API calls. Refreshes the session if the token is within
// 60 seconds of expiry to avoid 401s from stale cached tokens.
//
// Throws if there is no active session (user is not signed in).
// ----------------------------------------------------------------------------

export async function getAdminToken(): Promise<string> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    throw new Error('Not authenticated — please sign in to access the admin panel');
  }

  // Refresh if token expires within 60 seconds
  if (session.expires_at && session.expires_at * 1000 < Date.now() + 60_000) {
    const { data: refreshed, error } = await supabase.auth.refreshSession();
    if (!error && refreshed.session?.access_token) {
      return refreshed.session.access_token;
    }
  }

  return session.access_token;
}
