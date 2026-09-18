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

function AdminLoginForm() {
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

    // Store destination before the magic link flow so the callback can restore
    // it even if Supabase strips query params from the redirect URL.
    sessionStorage.setItem('auth_next', '/admin');

    const response = await fetch('/api/request-magic-link', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: trimmed,
        type: 'login',
        redirectTo: 'https://lorem-curae-waitlist.vercel.app/auth/callback?next=/admin',
      }),
    });

    if (!response.ok) {
      const data: unknown = await response.json().catch(() => ({}));
      const apiError = data !== null && typeof data === 'object' && 'error' in data ? (data as { error: unknown }).error : null;
      setLoginStatus('error');
      setLoginError(
        apiError === 'not-on-waitlist'
          ? 'This email is not authorized for admin access.'
          : typeof apiError === 'string'
          ? apiError
          : 'Something went wrong. Please try again.',
      );
    } else {
      setSentEmail(trimmed);
      setLoginStatus('sent');
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
// validateAdminRequest and 401s, but drawing the console for them is wrong.
//
// Admin membership lives in SUPABASE_ADMIN_EMAILS, which is server-side only
// and deliberately unreadable from the browser, so the shell has to ask.
//
// 'forbidden' and 'error' are separate on purpose. A check that could not RUN
// is not a "no": it must not silently pass, and it must not show a login form
// to someone who is already signed in.
type AuthStatus =
  | 'loading'
  | 'unauthenticated'
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

    const resolve = async (session: Session | null) => {
      if (!session) {
        if (!cancelled) {
          setSignedInEmail(null);
          setAuthStatus('unauthenticated');
        }
        return;
      }

      if (!cancelled) {
        setSignedInEmail(session.user.email ?? null);
        setAuthStatus('loading');
      }

      try {
        const res = await fetch('/api/admin?action=whoami', {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        if (cancelled) return;
        if (res.ok) setAuthStatus('authorized');
        else if (res.status === 401) setAuthStatus('forbidden');
        else setAuthStatus('error');
      } catch {
        if (!cancelled) setAuthStatus('error');
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

  // Apply dark mode class to document
  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('admin-dark-mode', String(isDark));
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
        <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        {/* Main content area */}
        <div className="lg:flex-1 lg:min-w-0">
          {/* Header */}
          <AdminHeader onMenuClick={() => setSidebarOpen(true)} />

          {/* Page content */}
          <main className="p-4 sm:p-6 lg:p-8">
            <Outlet />
          </main>
        </div>
      </div>
    </DarkModeContext.Provider>
  );
}
