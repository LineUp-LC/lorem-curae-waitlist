import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';

// ============================================================================
// Types
// ============================================================================

interface UserProfile {
  email: string;
  wave_number: number | null;
  created_at: string;
  status: 'active' | 'pending' | 'disabled';
}

interface UserState {
  onboarding_step: string;
  has_completed_onboarding: boolean;
  has_verified_email: boolean;
  last_login_at: string | null;
}

interface FeatureFlag {
  key: string;
  value: string | number | boolean;
  type: string;
}

interface VisiblePage {
  path: string;
  label: string;
  visible: boolean;
}

interface FetchState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

// ============================================================================
// Utility Functions
// ============================================================================

function formatTimestamp(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatStatus(status: string): string {
  return status
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatWaveNumber(waveNumber: number | null): string {
  return waveNumber !== null ? `Wave ${waveNumber}` : 'Not assigned';
}

function formatOnboardingStep(step: string): string {
  return step
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatFlagValue(value: string | number | boolean): string {
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  return String(value);
}

// ============================================================================
// Badge Components
// ============================================================================

function StatusBadge({ status }: { status: string }) {
  const getStyles = () => {
    switch (status) {
      case 'active':
        return 'bg-forest-50 text-forest-700 border-forest-200';
      case 'pending':
        return 'bg-cream-100 text-cream-800 border-cream-200';
      case 'disabled':
        return 'bg-coral-50 text-coral-700 border-coral-200';
      default:
        return 'bg-sage-100 text-sage-700 border-sage-200';
    }
  };

  const getDotColor = () => {
    switch (status) {
      case 'active':
        return 'bg-forest-500';
      case 'pending':
        return 'bg-cream-600';
      case 'disabled':
        return 'bg-coral-500';
      default:
        return 'bg-sage-500';
    }
  };

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${getStyles()}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${getDotColor()}`} />
      {formatStatus(status)}
    </span>
  );
}

function BooleanBadge({ value, trueLabel = 'Yes', falseLabel = 'No' }: { value: boolean; trueLabel?: string; falseLabel?: string }) {
  return value ? (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-forest-50 text-forest-700 border border-forest-200">
      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
      </svg>
      {trueLabel}
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-sage-100 text-sage-600 border border-sage-200">
      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
      </svg>
      {falseLabel}
    </span>
  );
}

function VisibilityBadge({ visible }: { visible: boolean }) {
  return visible ? (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium bg-forest-50 text-forest-700 border border-forest-200">
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
      </svg>
      Visible
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium bg-coral-50 text-coral-700 border border-coral-200">
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
      </svg>
      Hidden
    </span>
  );
}

function TypeBadge({ type }: { type: string }) {
  const getStyles = () => {
    switch (type.toLowerCase()) {
      case 'boolean':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'string':
        return 'bg-sky-50 text-sky-700 border-sky-200';
      case 'number':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      default:
        return 'bg-sage-100 text-sage-700 border-sage-200';
    }
  };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-mono border ${getStyles()}`}>
      {type}
    </span>
  );
}

// ============================================================================
// Section Components
// ============================================================================

function SectionCard({
  title,
  subtitle,
  children,
  error,
  loading,
  emptyMessage,
  isEmpty,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  error?: string | null;
  loading?: boolean;
  emptyMessage?: string;
  isEmpty?: boolean;
}) {
  return (
    <div className="bg-white rounded-xl border border-sage-100 overflow-hidden">
      <div className="px-6 py-4 border-b border-sage-100">
        <h2 className="text-lg font-medium text-sage-800">{title}</h2>
        {subtitle && <p className="text-sm text-sage-500 mt-0.5">{subtitle}</p>}
      </div>

      {error ? (
        <div className="px-6 py-8">
          <div className="flex items-center gap-3 text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <p className="text-sm font-medium">Failed to load this section</p>
              <p className="text-xs text-amber-500 mt-0.5">{error}</p>
            </div>
          </div>
        </div>
      ) : loading ? (
        <div className="p-6">
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex gap-4">
                <div className="h-4 bg-sage-100 rounded w-32 animate-pulse" />
                <div className="h-4 bg-sage-100 rounded w-48 animate-pulse" />
                <div className="h-4 bg-sage-100 rounded w-24 animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      ) : isEmpty ? (
        <div className="px-6 py-12 text-center">
          <svg className="w-12 h-12 mx-auto mb-3 text-sage-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
          <p className="text-sm text-sage-500">{emptyMessage || 'No data available'}</p>
        </div>
      ) : (
        children
      )}
    </div>
  );
}

// ============================================================================
// Mock Sidebar Component
// ============================================================================

function MockSidebar({ pages, currentStep }: { pages: VisiblePage[]; currentStep: string }) {
  const visiblePages = pages.filter((p) => p.visible);

  // Group pages by category (inferred from path)
  const getCategory = (path: string): string => {
    if (path.startsWith('/settings')) return 'Settings';
    if (path.startsWith('/admin')) return 'Admin';
    if (path.startsWith('/profile')) return 'Profile';
    if (path.startsWith('/dashboard')) return 'Dashboard';
    return 'Main';
  };

  const groupedPages = visiblePages.reduce((acc, page) => {
    const category = getCategory(page.path);
    if (!acc[category]) acc[category] = [];
    acc[category].push(page);
    return acc;
  }, {} as Record<string, VisiblePage[]>);

  return (
    <div className="w-56 bg-sage-800 text-sage-100 flex flex-col">
      {/* Mock logo */}
      <div className="px-4 py-4 border-b border-sage-700">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-forest-500 flex items-center justify-center">
            <span className="text-white font-bold text-sm">L</span>
          </div>
          <span className="font-semibold text-sm">Lorem Curae</span>
        </div>
      </div>

      {/* Navigation items */}
      <nav className="flex-1 py-4 px-2 space-y-4 overflow-y-auto">
        {Object.entries(groupedPages).map(([category, categoryPages]) => (
          <div key={category}>
            <p className="px-3 text-xs font-semibold text-sage-400 uppercase tracking-wider mb-2">
              {category}
            </p>
            <ul className="space-y-1">
              {categoryPages.map((page) => (
                <li key={page.path}>
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-sage-300 hover:bg-sage-700/50 cursor-default">
                    <svg className="w-4 h-4 text-sage-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    <span>{page.label}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ))}

        {visiblePages.length === 0 && (
          <div className="px-3 py-4 text-center text-sage-400 text-sm">
            No pages visible
          </div>
        )}
      </nav>

      {/* Onboarding step indicator */}
      <div className="px-4 py-3 border-t border-sage-700 bg-sage-900/50">
        <p className="text-xs text-sage-400 mb-1">Current Step</p>
        <p className="text-sm font-medium text-sage-200 truncate">
          {formatOnboardingStep(currentStep)}
        </p>
      </div>
    </div>
  );
}

// ============================================================================
// Mock Content Area Component
// ============================================================================

function MockContentArea({
  userState,
  pages,
  email
}: {
  userState: UserState | null;
  pages: VisiblePage[];
  email: string;
}) {
  const visiblePages = pages.filter((p) => p.visible);
  const showOnboarding = userState && !userState.has_completed_onboarding;

  return (
    <div className="flex-1 bg-sage-50 flex flex-col">
      {/* Mock header */}
      <div className="bg-white border-b border-sage-200 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="h-4 bg-sage-200 rounded w-24" />
          <div className="h-4 bg-sage-200 rounded w-32" />
        </div>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-sage-200" />
          <div className="text-sm text-sage-600 font-mono truncate max-w-32">
            {email.split('@')[0]}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-6 overflow-auto">
        {showOnboarding ? (
          // Onboarding overlay
          <div className="max-w-lg mx-auto">
            <div className="bg-white rounded-xl border border-sage-200 shadow-sm overflow-hidden">
              <div className="bg-forest-500 px-6 py-4">
                <h3 className="text-lg font-semibold text-white">Welcome to Lorem Curae</h3>
                <p className="text-forest-100 text-sm mt-1">Complete your setup to get started</p>
              </div>
              <div className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-full bg-forest-100 flex items-center justify-center">
                    <svg className="w-5 h-5 text-forest-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-sage-800">Current Step</p>
                    <p className="text-lg font-semibold text-forest-600">
                      {formatOnboardingStep(userState?.onboarding_step || 'unknown')}
                    </p>
                  </div>
                </div>

                {/* Mock progress steps */}
                <div className="space-y-3">
                  {['welcome', 'profile', 'preferences', 'complete'].map((step, idx) => {
                    const currentIdx = ['welcome', 'profile', 'preferences', 'complete'].indexOf(
                      userState?.onboarding_step?.toLowerCase() || ''
                    );
                    const isCompleted = idx < currentIdx;
                    const isCurrent = userState?.onboarding_step?.toLowerCase() === step;

                    return (
                      <div
                        key={step}
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg border ${
                          isCurrent
                            ? 'bg-forest-50 border-forest-200'
                            : isCompleted
                            ? 'bg-sage-50 border-sage-200'
                            : 'bg-white border-sage-100'
                        }`}
                      >
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                            isCurrent
                              ? 'bg-forest-500 text-white'
                              : isCompleted
                              ? 'bg-forest-100 text-forest-600'
                              : 'bg-sage-100 text-sage-400'
                          }`}
                        >
                          {isCompleted ? (
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          ) : (
                            idx + 1
                          )}
                        </div>
                        <span
                          className={`text-sm ${
                            isCurrent ? 'font-medium text-forest-700' : 'text-sage-600'
                          }`}
                        >
                          {formatOnboardingStep(step)}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-6 pt-4 border-t border-sage-100">
                  <div className="h-10 bg-forest-500/20 rounded-lg flex items-center justify-center">
                    <span className="text-sm text-forest-600 font-medium">Continue Button (Simulated)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          // Regular dashboard view
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-sage-200 p-6">
              <h3 className="text-lg font-semibold text-sage-800 mb-4">Dashboard</h3>
              <div className="grid grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-sage-50 rounded-lg p-4">
                    <div className="h-4 bg-sage-200 rounded w-20 mb-2" />
                    <div className="h-8 bg-sage-200 rounded w-16" />
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-sage-200 p-6">
              <h3 className="text-lg font-semibold text-sage-800 mb-4">Available Pages</h3>
              <div className="grid grid-cols-2 gap-3">
                {visiblePages.slice(0, 6).map((page) => (
                  <div
                    key={page.path}
                    className="flex items-center gap-2 px-4 py-3 bg-sage-50 rounded-lg border border-sage-100"
                  >
                    <svg className="w-4 h-4 text-sage-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span className="text-sm text-sage-700">{page.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export default function UserSimulatePage() {
  const { email } = useParams<{ email: string }>();
  const decodedEmail = email ? decodeURIComponent(email) : '';

  // State for each data source
  const [user, setUser] = useState<FetchState<UserProfile>>({
    data: null,
    loading: true,
    error: null,
  });
  const [userState, setUserState] = useState<FetchState<UserState>>({
    data: null,
    loading: true,
    error: null,
  });
  const [flags, setFlags] = useState<FetchState<FeatureFlag[]>>({
    data: null,
    loading: true,
    error: null,
  });
  const [pages, setPages] = useState<FetchState<VisiblePage[]>>({
    data: null,
    loading: true,
    error: null,
  });

  const getAuthHeaders = useCallback(() => {
    const adminSecret = import.meta.env.VITE_ADMIN_SECRET;
    return {
      Authorization: `Bearer ${adminSecret}`,
      'Content-Type': 'application/json',
    };
  }, []);

  // Fetch user profile
  const fetchUser = useCallback(async () => {
    if (!decodedEmail) return;
    setUser((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const res = await fetch(
        `/api/admin/user?email=${encodeURIComponent(decodedEmail)}`,
        { headers: getAuthHeaders() }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setUser({ data, loading: false, error: null });
    } catch (err) {
      setUser({
        data: null,
        loading: false,
        error: err instanceof Error ? err.message : 'Unknown error',
      });
    }
  }, [decodedEmail, getAuthHeaders]);

  // Fetch user state
  const fetchUserState = useCallback(async () => {
    if (!decodedEmail) return;
    setUserState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const res = await fetch(
        `/api/admin/user-state?email=${encodeURIComponent(decodedEmail)}`,
        { headers: getAuthHeaders() }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setUserState({ data, loading: false, error: null });
    } catch (err) {
      setUserState({
        data: null,
        loading: false,
        error: err instanceof Error ? err.message : 'Unknown error',
      });
    }
  }, [decodedEmail, getAuthHeaders]);

  // Fetch feature flags
  const fetchFlags = useCallback(async () => {
    if (!decodedEmail) return;
    setFlags((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const res = await fetch(
        `/api/admin/user-visible-flags?email=${encodeURIComponent(decodedEmail)}`,
        { headers: getAuthHeaders() }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setFlags({ data: data.flags || [], loading: false, error: null });
    } catch (err) {
      setFlags({
        data: null,
        loading: false,
        error: err instanceof Error ? err.message : 'Unknown error',
      });
    }
  }, [decodedEmail, getAuthHeaders]);

  // Fetch visible pages
  const fetchPages = useCallback(async () => {
    if (!decodedEmail) return;
    setPages((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const res = await fetch(
        `/api/admin/user-visible-pages?email=${encodeURIComponent(decodedEmail)}`,
        { headers: getAuthHeaders() }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setPages({ data: data.pages || [], loading: false, error: null });
    } catch (err) {
      setPages({
        data: null,
        loading: false,
        error: err instanceof Error ? err.message : 'Unknown error',
      });
    }
  }, [decodedEmail, getAuthHeaders]);

  // Fetch all data on mount
  useEffect(() => {
    if (decodedEmail) {
      fetchUser();
      fetchUserState();
      fetchFlags();
      fetchPages();
    }
  }, [decodedEmail, fetchUser, fetchUserState, fetchFlags, fetchPages]);

  // Refresh all data
  const refreshAll = () => {
    fetchUser();
    fetchUserState();
    fetchFlags();
    fetchPages();
  };

  // Check if all loading
  const isFullyLoading =
    user.loading && userState.loading && flags.loading && pages.loading;

  // Check if user not found
  const userNotFound = !user.loading && !user.data && user.error;

  if (!decodedEmail) {
    return (
      <div className="space-y-8">
        <div className="bg-coral-50 border border-coral-200 rounded-lg p-6 text-center">
          <p className="text-coral-700">No email address provided</p>
          <Link
            to="/admin/search"
            className="inline-flex items-center gap-2 mt-4 px-4 py-2 text-sm font-medium text-sage-700 bg-white border border-sage-200 rounded-lg hover:bg-sage-50"
          >
            Go to Search
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* ================================================================== */}
      {/* Header */}
      {/* ================================================================== */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <Link
              to="/admin/search"
              className="text-sage-400 hover:text-sage-600 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </Link>
            <h1 className="text-2xl font-semibold text-sage-900">View As User</h1>
          </div>
          <p className="text-sage-500 ml-8 font-mono break-all">{decodedEmail}</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to={`/admin/user-profile/${encodeURIComponent(decodedEmail)}`}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-sage-700 bg-white border border-sage-200 rounded-lg hover:bg-sage-50 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            Full Profile
          </Link>
          <button
            onClick={refreshAll}
            disabled={isFullyLoading}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-sage-700 bg-white border border-sage-200 rounded-lg hover:bg-sage-50 transition-colors disabled:opacity-50"
          >
            <svg
              className={`w-4 h-4 ${isFullyLoading ? 'animate-spin' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>
      </div>

      {/* Simulation notice */}
      <div className="bg-purple-50 border border-purple-200 rounded-lg px-4 py-3 flex items-center gap-3">
        <svg className="w-5 h-5 text-purple-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-sm text-purple-700">
          <span className="font-medium">Read-only simulation.</span>{' '}
          This is a visual preview of what the user sees. No real actions are performed.
        </p>
      </div>

      {/* ================================================================== */}
      {/* User Summary Card */}
      {/* ================================================================== */}
      <SectionCard
        title="User Summary"
        subtitle="Basic user information"
        loading={user.loading}
        error={userNotFound ? user.error : null}
        isEmpty={false}
      >
        {user.data && (
          <div className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Email */}
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-sage-500 uppercase tracking-wider">Email</p>
                <p className="text-sm font-mono bg-sage-50 px-3 py-2 rounded-lg text-sage-800 break-all">
                  {user.data.email}
                </p>
              </div>

              {/* Wave Number */}
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-sage-500 uppercase tracking-wider">Wave</p>
                <p className="text-sm text-sage-800">
                  <span className="inline-flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${user.data.wave_number !== null ? 'bg-forest-500' : 'bg-sage-300'}`} />
                    {formatWaveNumber(user.data.wave_number)}
                  </span>
                </p>
              </div>

              {/* Status */}
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-sage-500 uppercase tracking-wider">Status</p>
                <StatusBadge status={user.data.status} />
              </div>

              {/* Created At */}
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-sage-500 uppercase tracking-wider">Created</p>
                <p className="text-sm text-sage-800">{formatDate(user.data.created_at)}</p>
              </div>
            </div>
          </div>
        )}
      </SectionCard>

      {/* ================================================================== */}
      {/* Onboarding State Section */}
      {/* ================================================================== */}
      <SectionCard
        title="Onboarding State"
        subtitle="Current onboarding progress and verification status"
        loading={userState.loading}
        error={userState.error}
        isEmpty={false}
      >
        {userState.data && (
          <div className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Onboarding Step */}
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-sage-500 uppercase tracking-wider">Current Step</p>
                <p className="text-sm font-medium text-sage-800 bg-sage-50 px-3 py-2 rounded-lg">
                  {formatOnboardingStep(userState.data.onboarding_step)}
                </p>
              </div>

              {/* Completed Onboarding */}
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-sage-500 uppercase tracking-wider">Onboarding</p>
                <BooleanBadge
                  value={userState.data.has_completed_onboarding}
                  trueLabel="Completed"
                  falseLabel="In Progress"
                />
              </div>

              {/* Email Verified */}
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-sage-500 uppercase tracking-wider">Email</p>
                <BooleanBadge
                  value={userState.data.has_verified_email}
                  trueLabel="Verified"
                  falseLabel="Not Verified"
                />
              </div>

              {/* Last Login */}
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-sage-500 uppercase tracking-wider">Last Login</p>
                <p className="text-sm text-sage-800">
                  {userState.data.last_login_at
                    ? formatTimestamp(userState.data.last_login_at)
                    : <span className="text-sage-400">Never</span>}
                </p>
              </div>
            </div>
          </div>
        )}
      </SectionCard>

      {/* ================================================================== */}
      {/* Visible Feature Flags Section */}
      {/* ================================================================== */}
      <SectionCard
        title="Visible Feature Flags"
        subtitle="Feature flags visible to this user"
        loading={flags.loading}
        error={flags.error}
        isEmpty={!flags.data || flags.data.length === 0}
        emptyMessage="No feature flags configured for this user"
      >
        {flags.data && flags.data.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-sage-50/50">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-sage-600 uppercase tracking-wider">
                    Key
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-sage-600 uppercase tracking-wider">
                    Value
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-sage-600 uppercase tracking-wider">
                    Type
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sage-50">
                {flags.data.map((flag, idx) => (
                  <tr
                    key={flag.key}
                    className={`${idx % 2 === 0 ? 'bg-white' : 'bg-sage-50/30'} hover:bg-sage-50/50 transition-colors`}
                  >
                    <td className="px-6 py-4 text-sm font-mono text-sage-800">
                      {flag.key}
                    </td>
                    <td className="px-6 py-4 text-sm text-sage-700">
                      {typeof flag.value === 'boolean' ? (
                        <BooleanBadge value={flag.value} />
                      ) : (
                        <span className="font-mono bg-sage-50 px-2 py-1 rounded">
                          {formatFlagValue(flag.value)}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <TypeBadge type={flag.type} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      {/* ================================================================== */}
      {/* Visible Pages Section */}
      {/* ================================================================== */}
      <SectionCard
        title="Visible Pages"
        subtitle="Pages this user can access"
        loading={pages.loading}
        error={pages.error}
        isEmpty={!pages.data || pages.data.length === 0}
        emptyMessage="No page visibility data available"
      >
        {pages.data && pages.data.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-sage-50/50">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-sage-600 uppercase tracking-wider">
                    Label
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-sage-600 uppercase tracking-wider">
                    Path
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-sage-600 uppercase tracking-wider">
                    Visibility
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sage-50">
                {pages.data.map((page, idx) => (
                  <tr
                    key={page.path}
                    className={`${
                      !page.visible
                        ? 'bg-coral-50/30'
                        : idx % 2 === 0
                        ? 'bg-white'
                        : 'bg-sage-50/30'
                    } hover:bg-sage-50/50 transition-colors`}
                  >
                    <td className="px-6 py-4 text-sm font-medium text-sage-800">
                      {page.label}
                    </td>
                    <td className="px-6 py-4 text-sm font-mono text-sage-600">
                      {page.path}
                    </td>
                    <td className="px-6 py-4">
                      <VisibilityBadge visible={page.visible} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      {/* ================================================================== */}
      {/* Simulated User Experience Panel */}
      {/* ================================================================== */}
      <div className="bg-white rounded-xl border border-sage-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-sage-100 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-medium text-sage-800">Simulated User Experience</h2>
            <p className="text-sm text-sage-500 mt-0.5">
              Visual preview of what this user sees (read-only)
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            Preview Mode
          </span>
        </div>

        {/* Loading state */}
        {(userState.loading || pages.loading) && (
          <div className="p-6">
            <div className="h-96 bg-sage-100 rounded-lg animate-pulse flex items-center justify-center">
              <div className="text-sage-400">Loading simulation...</div>
            </div>
          </div>
        )}

        {/* Error state */}
        {!userState.loading && !pages.loading && (userState.error || pages.error) && (
          <div className="px-6 py-8">
            <div className="flex items-center gap-3 text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <p className="text-sm font-medium">Unable to render simulation</p>
                <p className="text-xs text-amber-500 mt-0.5">
                  Required data failed to load. Refresh to try again.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Simulated UI */}
        {!userState.loading && !pages.loading && !userState.error && !pages.error && (
          <div className="border-t border-sage-100">
            <div className="h-[500px] flex overflow-hidden bg-sage-100 rounded-b-xl">
              {/* Mock sidebar */}
              <MockSidebar
                pages={pages.data || []}
                currentStep={userState.data?.onboarding_step || 'unknown'}
              />

              {/* Mock content area */}
              <MockContentArea
                userState={userState.data}
                pages={pages.data || []}
                email={decodedEmail}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
