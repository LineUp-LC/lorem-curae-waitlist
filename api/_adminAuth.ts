import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { VercelRequest } from '@vercel/node';

// ----------------------------------------------------------------------------
// Admin JWT validation
// ----------------------------------------------------------------------------
// Validates the incoming Supabase session token and checks that the
// authenticated user's email is in the SUPABASE_ADMIN_EMAILS env var.
//
// Usage in API handlers:
//   const auth = await validateAdminRequest(req);
//   if (!auth.ok) return res.status(auth.status).json({ error: auth.error });
//   const { supabase } = auth; // reuse for subsequent DB queries
// ----------------------------------------------------------------------------

type AuthSuccess = {
  ok: true;
  supabase: SupabaseClient;
};

type AuthFailure = {
  ok: false;
  status: number;
  error: string;
};

export async function validateAdminRequest(
  req: VercelRequest
): Promise<AuthSuccess | AuthFailure> {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return { ok: false, status: 500, error: 'Server misconfiguration' };
  }

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return { ok: false, status: 401, error: 'Unauthorized' };
  }

  const token = authHeader.slice(7);

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);

  if (error || !user?.email) {
    return { ok: false, status: 401, error: 'Unauthorized' };
  }

  const adminEmails = (process.env.SUPABASE_ADMIN_EMAILS ?? '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  if (!adminEmails.includes(user.email.toLowerCase())) {
    return { ok: false, status: 401, error: 'Unauthorized' };
  }

  return { ok: true, supabase };
}
