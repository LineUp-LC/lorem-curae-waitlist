import { useState, useEffect, useCallback } from 'react';

// Types for API response
interface RateLimitBucket {
  key: string;
  count: number;
  limit: number;
  window_seconds: number;
  resets_at: string;
  metadata: Record<string, unknown> | null;
}

interface RateLimitsResponse {
  buckets: RateLimitBucket[];
}

// Format timestamp for display
function formatTimestamp(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });
}

// Format window duration
function formatWindow(seconds: number): string {
  if (seconds < 60) {
    return `${seconds}s`;
  }
  if (seconds < 3600) {
    const mins = Math.floor(seconds / 60);
    return `${mins}m`;
  }
  const hours = Math.floor(seconds / 3600);
  return `${hours}h`;
}

// Get usage percentage color classes
function getUsageColorClass(count: number, limit: number): string {
  const percentage = (count / limit) * 100;
  if (percentage >= 90) {
    return 'text-coral-700 bg-coral-50';
  }
  if (percentage >= 50) {
    return 'text-cream-700 bg-cream-50';
  }
  return 'text-forest-700 bg-forest-50';
}

// Get progress bar color
function getProgressBarColor(count: number, limit: number): string {
  const percentage = (count / limit) * 100;
  if (percentage >= 90) {
    return 'bg-coral-500';
  }
  if (percentage >= 50) {
    return 'bg-cream-500';
  }
  return 'bg-forest-500';
}

// Get progress bar background
function getProgressBarBg(count: number, limit: number): string {
  const percentage = (count / limit) * 100;
  if (percentage >= 90) {
    return 'bg-coral-100';
  }
  if (percentage >= 50) {
    return 'bg-cream-100';
  }
  return 'bg-forest-100';
}

export default function RateLimitsPage() {
  const [buckets, setBuckets] = useState<RateLimitBucket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resettingKey, setResettingKey] = useState<string | null>(null);
  const [resetSuccess, setResetSuccess] = useState<string | null>(null);
  const [resetError, setResetError] = useState<string | null>(null);

  // Fetch rate limit buckets
  const fetchBuckets = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const adminSecret = import.meta.env.VITE_ADMIN_SECRET;

      if (!adminSecret) {
        throw new Error('Admin credentials not configured');
      }

      const response = await fetch('/api/admin/rate-limits', {
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
        throw new Error(`Failed to fetch rate limits (${response.status})`);
      }

      const data: RateLimitsResponse = await response.json();
      setBuckets(data.buckets || []);
    } catch (err) {
      console.error('[RateLimits] Failed to fetch:', err);
      setError(err instanceof Error ? err.message : 'Failed to load rate limits');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBuckets();
  }, [fetchBuckets]);

  // Reset a rate limit bucket
  const handleReset = async (key: string) => {
    try {
      setResettingKey(key);
      setResetError(null);
      setResetSuccess(null);

      const adminSecret = import.meta.env.VITE_ADMIN_SECRET;

      if (!adminSecret) {
        throw new Error('Admin credentials not configured');
      }

      const response = await fetch('/api/admin/reset-rate-limit', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${adminSecret}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ key }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to reset rate limit (${response.status})`);
      }

      setResetSuccess(key);

      // Clear success message after 3 seconds
      setTimeout(() => {
        setResetSuccess(null);
      }, 3000);

      // Re-fetch buckets to update the list
      await fetchBuckets();
    } catch (err) {
      console.error('[RateLimits] Failed to reset:', err);
      setResetError(err instanceof Error ? err.message : 'Failed to reset rate limit');
    } finally {
      setResettingKey(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-sage-900">Rate Limit Dashboard</h1>
          <p className="mt-1 text-sage-500">
            Monitor and manage API throttling
          </p>
        </div>
        <button
          onClick={fetchBuckets}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-sage-700 bg-white border border-sage-200 rounded-lg hover:bg-sage-50 transition-colors disabled:opacity-50"
        >
          <svg
            className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>

      {/* Error banner */}
      {error && (
        <div className="bg-coral-50 border border-coral-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-coral-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex-1">
              <p className="text-sm font-medium text-coral-800">Failed to load rate limits</p>
              <p className="text-sm text-coral-600">{error}</p>
            </div>
            <button
              onClick={fetchBuckets}
              className="text-sm text-coral-700 hover:text-coral-900 font-medium"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Reset error banner */}
      {resetError && (
        <div className="bg-coral-50 border border-coral-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-coral-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex-1">
              <p className="text-sm font-medium text-coral-800">Failed to reset rate limit</p>
              <p className="text-sm text-coral-600">{resetError}</p>
            </div>
            <button
              onClick={() => setResetError(null)}
              className="text-sage-400 hover:text-sage-600"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Success banner */}
      {resetSuccess && (
        <div className="bg-forest-50 border border-forest-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-forest-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <p className="text-sm text-forest-700">
              Rate limit for <span className="font-mono font-medium">{resetSuccess}</span> has been reset
            </p>
          </div>
        </div>
      )}

      {/* Summary stats */}
      {!loading && buckets.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-sage-100 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-sage-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-sage-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-semibold text-sage-900">{buckets.length}</p>
                <p className="text-sm text-sage-500">Active Buckets</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-sage-100 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-cream-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-cream-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-semibold text-sage-900">
                  {buckets.filter((b) => (b.count / b.limit) >= 0.5 && (b.count / b.limit) < 0.9).length}
                </p>
                <p className="text-sm text-sage-500">Approaching Limit</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-sage-100 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-coral-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-coral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-semibold text-sage-900">
                  {buckets.filter((b) => (b.count / b.limit) >= 0.9).length}
                </p>
                <p className="text-sm text-sage-500">At Limit</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Buckets table */}
      <div className="bg-white rounded-xl border border-sage-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-sage-100">
          <h2 className="text-lg font-medium text-sage-800">Rate Limit Buckets</h2>
          <p className="text-sm text-sage-500 mt-0.5">
            {loading ? 'Loading...' : `${buckets.length} bucket${buckets.length !== 1 ? 's' : ''} tracked`}
          </p>
        </div>

        {loading ? (
          <div className="p-6">
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="h-4 bg-sage-100 rounded w-48 animate-pulse" />
                  <div className="h-4 bg-sage-100 rounded w-20 animate-pulse" />
                  <div className="h-4 bg-sage-100 rounded w-16 animate-pulse" />
                  <div className="h-4 bg-sage-100 rounded w-32 animate-pulse" />
                  <div className="h-4 bg-sage-100 rounded w-24 animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        ) : buckets.length === 0 ? (
          <div className="p-12 text-center">
            <svg className="w-12 h-12 mx-auto mb-4 text-sage-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            <p className="text-sage-600 font-medium">No rate limit buckets</p>
            <p className="text-sm text-sage-500 mt-1">Rate limits will appear here when API requests are throttled</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-sage-50/50">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-sage-600 uppercase tracking-wider">
                    Key
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-sage-600 uppercase tracking-wider">
                    Count / Limit
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-sage-600 uppercase tracking-wider">
                    Window
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-sage-600 uppercase tracking-wider">
                    Resets At
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-sage-600 uppercase tracking-wider">
                    Metadata
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-sage-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sage-100">
                {buckets.map((bucket, index) => (
                  <tr
                    key={bucket.key}
                    className={`${
                      index % 2 === 0 ? 'bg-white' : 'bg-sage-50/30'
                    } hover:bg-sage-50 transition-colors`}
                  >
                    {/* Key */}
                    <td className="px-6 py-4">
                      <span className="font-mono text-sm text-sage-800 break-all">
                        {bucket.key}
                      </span>
                    </td>

                    {/* Count / Limit */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getUsageColorClass(
                            bucket.count,
                            bucket.limit
                          )}`}
                        >
                          {bucket.count} / {bucket.limit}
                        </span>
                        <div className={`w-16 h-1.5 rounded-full ${getProgressBarBg(bucket.count, bucket.limit)}`}>
                          <div
                            className={`h-full rounded-full transition-all ${getProgressBarColor(
                              bucket.count,
                              bucket.limit
                            )}`}
                            style={{ width: `${Math.min((bucket.count / bucket.limit) * 100, 100)}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Window */}
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-sage-100 text-sage-700">
                        {formatWindow(bucket.window_seconds)}
                      </span>
                    </td>

                    {/* Resets At */}
                    <td className="px-6 py-4">
                      <span className="text-sm text-sage-600">
                        {formatTimestamp(bucket.resets_at)}
                      </span>
                    </td>

                    {/* Metadata */}
                    <td className="px-6 py-4">
                      {bucket.metadata ? (
                        <pre className="text-xs font-mono text-sage-600 bg-sage-50 rounded px-2 py-1 max-w-xs overflow-auto whitespace-pre-wrap">
                          {JSON.stringify(bucket.metadata, null, 2)}
                        </pre>
                      ) : (
                        <span className="text-xs text-sage-400 italic">None</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleReset(bucket.key)}
                        disabled={resettingKey !== null}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-sage-700 bg-white border border-sage-200 rounded-lg hover:bg-sage-50 hover:border-sage-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {resettingKey === bucket.key ? (
                          <>
                            <svg className="w-3.5 h-3.5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            Resetting...
                          </>
                        ) : (
                          <>
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            Reset
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Footer hint */}
      <div className="text-center text-xs text-sage-400 py-2">
        Rate limit buckets are automatically cleaned up when they expire
      </div>
    </div>
  );
}
