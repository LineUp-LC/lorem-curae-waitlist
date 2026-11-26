import { useState, useEffect, createContext, useContext, type FormEvent } from 'react';
import { Outlet } from 'react-router-dom';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../../../lib/supabase';
import { AdminSidebar } from './AdminSidebar';
import { AdminHeader } from './AdminHeader';

// ============================================================================
// Dark Mode Context
// ============================================================================

interface DarkModeContextValue {
  isDark: boolean;
  toggle: () => void;
}

const DarkModeContext = createContext<DarkModeContextValue>({
  isDark: false,
  toggle: () => {},
});

export function useDarkMode() {
  return useContext(DarkModeContext);
}

// ============================================================================
// Admin Login Form
// ============================================================================

type LoginStatus = 'idle' | 'sending' | 'sent' | 'error';

function AdminLoginForm({ notice }: { notice?: string }) {
  const [email, setEmail] = useState('');
  const [loginStatus, setLoginStatus] = useState<LoginStatus>('idle');
  const [loginError, setLoginError] = useState('');
  const [sentEmail, setSentEmail] = useState('');

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) return;

    setLoginStatus('sending');
    setLoginError('');

    let response: Response;
    try {
      response = await fetch('/api/request-magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: trimmed,
          type: 'login',
          // Same origin as this page: the server accepts only an exact list of allowed
          // origins plus the /auth/callback path, and auth_next lives in this origin's storage.
          redirectTo: `${window.location.origin}/auth/callback?next=/admin`,
        }),
      });
    } catch {
      // No reply at all (offline, DNS, blocked). Without this the button stayed
      // on "Sending..." for good.
      sessionStorage.removeItem('auth_next');
      setLoginStatus('error');
      setLoginError("Couldn't reach the server. Check your connection and try again.");
      return;
    }

    if (!response.ok) {
      sessionStorage.removeItem('auth_next');
      const data: unknown = await response.json().catch(() => ({}));
      const apiError = data !== null && typeof data === 'object' && 'error' in data ? (data as { error: unknown }).error : null;
      setLoginStatus('error');
      setLoginError(
        // Request limit (429 too_many_requests): nothing was sent. Draft wording.
        response.status === 429
          ? 'Too many tries. Please wait a few minutes and try again.'
          : apiError === 'not-on-waitlist'
          ? 'This email is not authorized for admin access.'
          : typeof apiError === 'string'
          ? apiError
          : 'Something went wrong. Please try again.',
      );
    } else {
      // The server answers a login with 200 and onWaitlist (#35): false means it
      // sent nothing (not an admin and not on the list), so the sent screen would
      // be untrue. Any other 2xx reply keeps the sent screen, as before.
      const data: unknown = await response.json().catch(() => ({}));
      const onWaitlist =
        data !== null && typeof data === 'object' && 'onWaitlist' in data
          ? (data as { onWaitlist: unknown }).onWaitlist
          : undefined;
      if (onWaitlist === false) {
        sessionStorage.removeItem('auth_next');
        setLoginStatus('error');
        setLoginError('This email is not authorized for admin access.');
      } else {
        // Store the destination only once a link is really on its way, so the
        // callback can restore it even if Supabase strips query params from the
        // redirect URL. A failed request leaves nothing behind.
        sessionStorage.setItem('auth_next', '/admin');
        setSentEmail(trimmed);
        setLoginStatus('sent');
      }
    }
  };

  if (loginStatus === 'sent') {
    return (
      <div className="min-h-screen bg-sage-50/50 flex items-center justify-center p-4">
        <div className="w-full max-w-sm bg-white rounded-2xl border border-sage-200 p-8 shadow-sm text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-sage-100 flex items-center justify-center mb-4">
            <svg
              className="w-6 h-6 text-sage-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          </div>
          <p className="text-sage-800 font-medium mb-1">Check your email</p>
          <p className="text-sage-500 text-sm">
            We sent a magic link to {sentEmail}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-sage-50/50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white rounded-2xl border border-sage-200 p-8 shadow-sm">
        <h1 className="text-sage-900 text-xl font-semibold mb-1">Admin sign in</h1>
        {notice && (
          <p role="status" className="text-sage-700 text-sm bg-sage-50 border border-sage-200 rounded-lg px-3 py-2 mb-3">
            {notice}
          </p>
        )}
        <p className="text-sage-500 text-sm mb-6">
          Enter your email to receive a magic link.
        </p>
        <form onSubmit={handleSubmit} noValidate>
          <div className="space-y-3">
            <input
              type="email"
              name="email"
              autoComplete="email"
              required
              placeholder="your@email.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (loginStatus === 'error') setLoginStatus('idle');
              }}
              disabled={loginStatus === 'sending'}
              className="w-full px-4 py-3 border border-sage-200 rounded-xl text-sage-800 placeholder-sage-400 focus:outline-none focus:ring-2 focus:ring-sage-400/40 focus:border-sage-400 transition-colors disabled:opacity-60"
            />
            {loginStatus === 'error' && (
              <p className="text-red-500 text-sm">{loginError}</p>
            )}
            <button
              type="submit"
              disabled={loginStatus === 'sending' || !email.trim()}
              className="w-full py-3 bg-sage-600 text-white rounded-xl font-medium hover:bg-sage-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loginStatus === 'sending' ? 'Sending...' : 'Send magic link'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ============================================================================
// Admin Layout Component
// ============================================================================

// A SESSION IS NOT ADMIN ACCESS, and the shell used to treat them as the same
// thing. /api/request-magic-link only checks that the address is on the
// WAITLIST, so any waitlist member with an account could sign in and render
// the whole console. Nothing leaked, because every data call goes through
// validateAdminRequest and is refused, but drawing the console for them is wrong.
//
// Admin membership lives in SUPABASE_ADMIN_EMAILS, which is server-side only
// and deliberately unreadable from the browser, so the shell has to ask.
//
// 'forbidden' and 'error' are separate on purpose. A check that could not RUN
// is not a "no": it must not silently pass, and it must not show a login form
// to someone who is already signed in.
//
// 'expired' is the server's 401 (a bad or expired token), 'forbidden' its 403
// (a good session that is not an admin's).
type AuthStatus =
  | 'loading'
  | 'unauthenticated'
  | 'expired'
  | 'authorized'
  | 'forbidden'
  | 'error';

export function AdminLayout() {
  const [authStatus, setAuthStatus] = useState<AuthStatus>('loading');
  const [signedInEmail, setSignedInEmail] = useState<string | null>(null);
  const [recheck, setRecheck] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('admin-dark-mode');
      if (saved !== null) return saved === 'true';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  // Session check on mount + react to magic link sign-ins, then ask the server
  // whether that session is an ADMIN session.
  useEffect(() => {
    let cancelled = false;
    // Only the first check of this run shows the spinner. Later auth events
    // (token refresh, a second tab signing in) re-check quietly, so the
    // console and whatever is open in it stay put.
    let firstCheck = true;
    // Every call takes a number; a reply that is not the latest call's is
    // dropped, so a whoami answer landing after a sign-out cannot set
    // 'authorized' over it.
    let latestCheck = 0;

    const resolve = async (session: Session | null) => {
      const checkId = ++latestCheck;
      const quiet = !firstCheck;
      firstCheck = false;

      if (!session) {
        if (!cancelled) {
          setSignedInEmail(null);
          setAuthStatus('unauthenticated');
        }
        return;
      }

      if (!cancelled) {
        setSignedInEmail(session.user.email ?? null);
        if (!quiet) setAuthStatus('loading');
      }

      const isStale = () => cancelled || checkId !== latestCheck;

      try {
        const res = await fetch('/api/admin?action=whoami', {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        if (isStale()) return;
        if (res.ok) setAuthStatus('authorized');
        else if (res.status === 401) setAuthStatus('expired');
        else if (res.status === 403) setAuthStatus('forbidden');
        // A quiet re-check that could not run does not take down a console
        // that was already authorized; every data call is still checked
        // server-side.
        else setAuthStatus((prev) => (quiet && prev === 'authorized' ? prev : 'error'));
      } catch {
        if (isStale()) return;
        setAuthStatus((prev) => (quiet && prev === 'authorized' ? prev : 'error'));
      }
    };

    void supabase.auth.getSession().then(({ data: { session } }) => resolve(session));

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      // Not awaited, and it touches no Supabase client method of its own, so
      // the auth lock is never held across this work.
      void resolve(session);
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [recheck]);

  // While this shell is mounted in any state, answer a new admin sign-in tab
  // so it can show a close-this-tab note instead of a second dashboard.
  useEffect(() => {
    if (typeof BroadcastChannel === 'undefined') return;
    const channel = new BroadcastChannel('curae-admin-auth');
    channel.onmessage = (e: MessageEvent) => {
      const data: unknown = e.data;
      if (
        data !== null &&
        typeof data === 'object' &&
        (data as { type?: unknown }).type === 'admin-signed-in'
      ) {
        channel.postMessage({ type: 'admin-tab-here' });
      }
    };
    return () => channel.close();
  }, []);

  // Apply dark mode class to document
  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('admin-dark-mode', String(isDark));
    // Leaving the admin area must not hand dark mode to the public pages.
    return () => root.classList.remove('dark');
  }, [isDark]);

  const toggleDarkMode = () => setIsDark((prev) => !prev);

  // Loading — checking session before any child mounts
  if (authStatus === 'loading') {
    return (
      <div className="min-h-screen bg-sage-50/50 flex items-center justify-center">
        <div className="h-8 w-8 border-2 border-sage-300 border-t-sage-600 rounded-full animate-spin" />
      </div>
    );
  }

  // Unauthenticated — show magic link login form
  if (authStatus === 'unauthenticated') {
    return <AdminLoginForm />;
  }

  // The server could not accept this session's token (401): bad or expired.
  if (authStatus === 'expired') {
    return <AdminLoginForm notice="Your session expired. Please sign in again." />;
  }

  // Signed in, but not an admin. Deliberately not the login form: they are
  // already signed in, and offering the form again would read as a failed
  // sign-in rather than the refusal it is.
  if (authStatus === 'forbidden') {
    return (
      <div className="min-h-screen bg-sage-50/50 flex items-center justify-center px-4">
        <div className="w-full max-w-md bg-white rounded-xl border border-sage-100 p-8 text-center">
          <h1 className="text-xl font-semibold text-sage-800 mb-2">
            Not an admin account
          </h1>
          <p className="text-sm text-sage-500 mb-6">
            {signedInEmail ? (
              <>
                You are signed in as{' '}
                <span className="font-medium text-sage-700">{signedInEmail}</span>, which
                does not have admin access.
              </>
            ) : (
              'This account does not have admin access.'
            )}
          </p>
          <button
            type="button"
            onClick={() => void supabase.auth.signOut()}
            className="px-4 py-2 text-sm font-medium text-sage-700 bg-sage-100 rounded-lg hover:bg-sage-200 transition-colors"
          >
            Sign out
          </button>
        </div>
      </div>
    );
  }

  // The check could not run. Not a refusal, and not a pass.
  if (authStatus === 'error') {
    return (
      <div className="min-h-screen bg-sage-50/50 flex items-center justify-center px-4">
        <div className="w-full max-w-md bg-white rounded-xl border border-sage-100 p-8 text-center">
          <h1 className="text-xl font-semibold text-sage-800 mb-2">
            Could not check admin access
          </h1>
          <p className="text-sm text-sage-500 mb-6">
            You are signed in, but we could not reach the server to confirm
            whether this account is an admin. This is not a refusal.
          </p>
          <div className="flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => setRecheck((n) => n + 1)}
              className="px-4 py-2 text-sm font-medium text-white bg-forest-600 rounded-lg hover:bg-forest-700 transition-colors"
            >
              Try again
            </button>
            <button
              type="button"
              onClick={() => void supabase.auth.signOut()}
              className="px-4 py-2 text-sm font-medium text-sage-700 bg-sage-100 rounded-lg hover:bg-sage-200 transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Authenticated — render existing layout unchanged
  return (
    <DarkModeContext.Provider value={{ isDark, toggle: toggleDarkMode }}>
      <div className="min-h-screen bg-sage-50/50 dark:bg-sage-900 transition-colors lg:flex">
        {/* Sidebar */}
        <AdminSidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          signedInEmail={signedInEmail}
        />

        {/* Main content area */}
        <div className="lg:flex-1 lg:min-w-0">
          {/* Header */}
          <AdminHeader onMenuClick={() => setSidebarOpen(true)} signedInEmail={signedInEmail} />

          {/* Page content */}
          <main className="p-4 sm:p-6 lg:p-8">
            <Outlet />
          </main>
        </div>
      </div>
    </DarkModeContext.Provider>
  );
}
