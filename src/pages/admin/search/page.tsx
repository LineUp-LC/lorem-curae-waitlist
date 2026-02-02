import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';

// Types for API response
interface UserResult {
  email: string;
  wave_number: number | null;
  created_at: string;
}

interface EmailEventResult {
  id: string;
  email: string;
  template: string;
  status: string;
  created_at: string;
}

interface AdminActionResult {
  id: string;
  admin_email: string;
  action: string;
  target: string | null;
  created_at: string;
}

interface FeatureFlagResult {
  key: string;
  value: string | number | boolean;
  type: string;
}

interface RateLimitResult {
  key: string;
  count: number;
  limit: number;
}

interface WaveResult {
  wave_number: number;
  total_users: number;
}

interface SearchResults {
  users: UserResult[];
  email_events: EmailEventResult[];
  admin_actions: AdminActionResult[];
  feature_flags: FeatureFlagResult[];
  rate_limits: RateLimitResult[];
  waves: WaveResult[];
}

// Format timestamp for display
function formatTimestamp(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

// Format relative time
function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}

// Get status badge styles
function getStatusStyles(status: string): string {
  const statusLower = status.toLowerCase();
  if (statusLower === 'sent' || statusLower === 'delivered') {
    return 'bg-forest-50 text-forest-700';
  }
  if (statusLower === 'bounced') {
    return 'bg-cream-100 text-cream-700';
  }
  if (statusLower === 'failed') {
    return 'bg-coral-50 text-coral-700';
  }
  return 'bg-sage-100 text-sage-700';
}

// Get action badge styles
function getActionStyles(action: string): string {
  const actionLower = action.toLowerCase();
  if (actionLower.includes('delete') || actionLower.includes('remove')) {
    return 'bg-coral-50 text-coral-700';
  }
  if (actionLower.includes('create') || actionLower.includes('add')) {
    return 'bg-forest-50 text-forest-700';
  }
  if (actionLower.includes('update') || actionLower.includes('edit')) {
    return 'bg-cream-50 text-cream-700';
  }
  return 'bg-sage-100 text-sage-700';
}

// Format value for display
function formatValue(value: string | number | boolean): string {
  if (typeof value === 'boolean') {
    return value ? 'true' : 'false';
  }
  return String(value);
}

// Section header component
function SectionHeader({ title, count, linkTo, linkText }: { title: string; count: number; linkTo: string; linkText: string }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2">
        <h3 className="text-sm font-semibold text-sage-800 uppercase tracking-wider">{title}</h3>
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-sage-100 text-sage-600">
          {count}
        </span>
      </div>
      <Link to={linkTo} className="text-xs text-sage-500 hover:text-sage-700 font-medium">
        {linkText} →
      </Link>
    </div>
  );
}

// Result card component
function ResultCard({ children, to }: { children: React.ReactNode; to?: string }) {
  const content = (
    <div className="bg-white border border-sage-100 rounded-lg p-3 hover:border-sage-300 hover:shadow-sm transition-all">
      {children}
    </div>
  );

  if (to) {
    return <Link to={to} className="block">{content}</Link>;
  }

  return content;
}

// Custom hook for debounce
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export default function GlobalSearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const debouncedQuery = useDebounce(query, 300);

  // Fetch search results
  const fetchResults = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const adminSecret = import.meta.env.VITE_ADMIN_SECRET;

      if (!adminSecret) {
        throw new Error('Admin credentials not configured');
      }

      const response = await fetch(`/api/admin/search?q=${encodeURIComponent(searchQuery.trim())}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${adminSecret}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Unauthorized - check admin credentials');
        }
        throw new Error(`Search failed (${response.status})`);
      }

      const data: SearchResults = await response.json();
      setResults(data);
    } catch (err) {
      console.error('[GlobalSearch] Search failed:', err);
      setError(err instanceof Error ? err.message : 'Search failed');
      setResults(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Trigger search when debounced query changes
  useEffect(() => {
    fetchResults(debouncedQuery);
  }, [debouncedQuery, fetchResults]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Calculate total results
  const totalResults = results
    ? results.users.length +
      results.email_events.length +
      results.admin_actions.length +
      results.feature_flags.length +
      results.rate_limits.length +
      results.waves.length
    : 0;

  // Check if there are any results
  const hasResults = totalResults > 0;

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-semibold text-sage-900">Global Search</h1>
        <p className="mt-1 text-sage-500">
          Search users, emails, flags, waves, and more
        </p>
      </div>

      {/* Search input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          {loading ? (
            <svg className="w-5 h-5 text-sage-400 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          ) : (
            <svg className="w-5 h-5 text-sage-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          )}
        </div>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search across all entities..."
          className="w-full pl-12 pr-4 py-4 text-lg border border-sage-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sage-500 focus:border-transparent bg-white shadow-sm transition-shadow"
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            className="absolute inset-y-0 right-0 pr-4 flex items-center text-sage-400 hover:text-sage-600"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Error banner */}
      {error && (
        <div className="bg-coral-50 border border-coral-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-coral-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex-1">
              <p className="text-sm font-medium text-coral-800">Search failed</p>
              <p className="text-sm text-coral-600">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Results summary */}
      {query && !loading && results && (
        <div className="text-sm text-sage-500">
          Found <span className="font-medium text-sage-700">{totalResults}</span> result{totalResults !== 1 ? 's' : ''} for "<span className="font-medium text-sage-700">{query}</span>"
        </div>
      )}

      {/* No results state */}
      {query && !loading && results && !hasResults && (
        <div className="bg-white rounded-xl border border-sage-100 px-6 py-12 text-center">
          <svg className="w-12 h-12 mx-auto mb-3 text-sage-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <p className="text-sage-600 font-medium">No results found for "{query}"</p>
          <p className="text-sm text-sage-500 mt-1">Try a different search term</p>
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-3">
              <div className="h-5 bg-sage-100 rounded w-32 animate-pulse" />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {[1, 2, 3].map((j) => (
                  <div key={j} className="bg-white border border-sage-100 rounded-lg p-3">
                    <div className="h-4 bg-sage-100 rounded w-3/4 animate-pulse mb-2" />
                    <div className="h-3 bg-sage-50 rounded w-1/2 animate-pulse" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Results sections */}
      {!loading && results && hasResults && (
        <div className="space-y-8">
          {/* Users */}
          {results.users.length > 0 && (
            <div>
              <SectionHeader title="Users" count={results.users.length} linkTo="/admin/search" linkText="Advanced search" />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {results.users.map((user) => (
                  <ResultCard key={user.email} to={`/admin/user/${encodeURIComponent(user.email)}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-sage-800 truncate">{user.email}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${
                            user.wave_number !== null ? 'bg-sage-100 text-sage-600' : 'bg-cream-100 text-cream-700'
                          }`}>
                            {user.wave_number !== null ? `Wave ${user.wave_number}` : 'Fallback'}
                          </span>
                        </div>
                      </div>
                      <span className="text-xs text-sage-400 flex-shrink-0">{formatRelativeTime(user.created_at)}</span>
                    </div>
                  </ResultCard>
                ))}
              </div>
            </div>
          )}

          {/* Email Events */}
          {results.email_events.length > 0 && (
            <div>
              <SectionHeader title="Email Events" count={results.email_events.length} linkTo="/admin/email-events" linkText="View all events" />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {results.email_events.map((event) => (
                  <ResultCard key={event.id} to="/admin/email-events">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-sage-800 truncate">{event.email}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-sage-500">{event.template}</span>
                          <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${getStatusStyles(event.status)}`}>
                            {event.status}
                          </span>
                        </div>
                      </div>
                      <span className="text-xs text-sage-400 flex-shrink-0">{formatRelativeTime(event.created_at)}</span>
                    </div>
                  </ResultCard>
                ))}
              </div>
            </div>
          )}

          {/* Admin Actions */}
          {results.admin_actions.length > 0 && (
            <div>
              <SectionHeader title="Admin Actions" count={results.admin_actions.length} linkTo="/admin/admin-activity" linkText="View activity log" />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {results.admin_actions.map((action) => (
                  <ResultCard key={action.id} to="/admin/admin-activity">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-sage-800 truncate">{action.admin_email}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${getActionStyles(action.action)}`}>
                            {action.action}
                          </span>
                          {action.target && (
                            <span className="text-xs text-sage-500 font-mono truncate">{action.target}</span>
                          )}
                        </div>
                      </div>
                      <span className="text-xs text-sage-400 flex-shrink-0">{formatRelativeTime(action.created_at)}</span>
                    </div>
                  </ResultCard>
                ))}
              </div>
            </div>
          )}

          {/* Feature Flags */}
          {results.feature_flags.length > 0 && (
            <div>
              <SectionHeader title="Feature Flags" count={results.feature_flags.length} linkTo="/admin/feature-flags" linkText="Manage flags" />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {results.feature_flags.map((flag) => (
                  <ResultCard key={flag.key} to="/admin/feature-flags">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-medium font-mono text-sage-800 truncate">{flag.key}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-sage-100 text-sage-600">
                            {flag.type}
                          </span>
                          <span className={`text-xs font-mono ${
                            typeof flag.value === 'boolean'
                              ? flag.value ? 'text-forest-600' : 'text-coral-600'
                              : 'text-sage-600'
                          }`}>
                            {formatValue(flag.value)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </ResultCard>
                ))}
              </div>
            </div>
          )}

          {/* Rate Limits */}
          {results.rate_limits.length > 0 && (
            <div>
              <SectionHeader title="Rate Limits" count={results.rate_limits.length} linkTo="/admin/rate-limits" linkText="View all limits" />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {results.rate_limits.map((limit) => (
                  <ResultCard key={limit.key} to="/admin/rate-limits">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-medium font-mono text-sage-800 truncate">{limit.key}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${
                            (limit.count / limit.limit) >= 0.9
                              ? 'bg-coral-50 text-coral-700'
                              : (limit.count / limit.limit) >= 0.5
                              ? 'bg-cream-100 text-cream-700'
                              : 'bg-forest-50 text-forest-700'
                          }`}>
                            {limit.count} / {limit.limit}
                          </span>
                        </div>
                      </div>
                    </div>
                  </ResultCard>
                ))}
              </div>
            </div>
          )}

          {/* Waves */}
          {results.waves.length > 0 && (
            <div>
              <SectionHeader title="Waves" count={results.waves.length} linkTo="/admin/waves-management" linkText="Manage waves" />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {results.waves.map((wave) => (
                  <ResultCard key={wave.wave_number} to="/admin/waves-management">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-sage-800">Wave {wave.wave_number}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-sage-500">
                            {wave.total_users.toLocaleString()} user{wave.total_users !== 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>
                    </div>
                  </ResultCard>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Initial state - no query */}
      {!query && !loading && (
        <div className="bg-white rounded-xl border border-sage-100 px-6 py-12 text-center">
          <svg className="w-12 h-12 mx-auto mb-3 text-sage-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <p className="text-sage-600 font-medium">Start typing to search</p>
          <p className="text-sm text-sage-500 mt-1">Search across users, email events, admin actions, feature flags, rate limits, and waves</p>
        </div>
      )}
    </div>
  );
}
