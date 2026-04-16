import { useState, useEffect, createContext, useContext, type FormEvent } from 'react';
import { Outlet } from 'react-router-dom';
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

    const response = await fetch('/api/request-magic-link', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: trimmed,
        type: 'login',
        redirectTo: window.location.origin + '/auth/callback?next=/admin',
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
              placeholder="lineupdownbiz@gmail.com"
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

type AuthStatus = 'loading' | 'unauthenticated' | 'authenticated';

export function AdminLayout() {
  const [authStatus, setAuthStatus] = useState<AuthStatus>('loading');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('admin-dark-mode');
      if (saved !== null) return saved === 'true';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  // Session check on mount + react to magic link sign-ins
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setAuthStatus(session ? 'authenticated' : 'unauthenticated');
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthStatus(session ? 'authenticated' : 'unauthenticated');
    });

    return () => subscription.unsubscribe();
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
