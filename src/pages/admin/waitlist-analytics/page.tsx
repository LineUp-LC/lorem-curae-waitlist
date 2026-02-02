import { useState, useEffect, useCallback } from 'react';
import { StatCard } from '../components/StatCard';

// Types for API response
interface DayCount {
  day: string;
  count: number;
}

interface WaveCount {
  wave_number: number | null;
  count: number;
}

interface StatusCount {
  status: string;
  count: number;
}

interface WaitlistAnalytics {
  total_signups: number;
  signups_last_30_days: DayCount[];
  wave_distribution: WaveCount[];
  status_distribution: StatusCount[];
  founding_member_count: number;
  founding_member_creator_count: number;
}

// Format number with commas
function formatNumber(num: number): string {
  return num.toLocaleString();
}

// Format date for display
function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

// Format status for display
function formatStatus(status: string): string {
  return status
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function WaitlistAnalyticsPage() {
  const [analytics, setAnalytics] = useState<WaitlistAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const adminSecret = import.meta.env.VITE_ADMIN_SECRET;

      if (!adminSecret) {
        throw new Error('Admin credentials not configured');
      }

      const response = await fetch('/api/admin/waitlist-analytics', {
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
        throw new Error(`Failed to fetch analytics (${response.status})`);
      }

      const data: WaitlistAnalytics = await response.json();
      setAnalytics(data);
    } catch (err) {
      console.error('[WaitlistAnalytics] Failed to fetch:', err);
      setError(err instanceof Error ? err.message : 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  // Calculate derived stats
  const activeCount = analytics?.status_distribution.find(
    (s) => s.status === 'active'
  )?.count ?? 0;

  const waitingCount = analytics?.status_distribution.find(
    (s) => s.status === 'waiting_for_next_wave'
  )?.count ?? 0;

  // Stats for cards
  const stats = [
    {
      title: 'Total Signups',
      value: analytics ? formatNumber(analytics.total_signups) : '—',
      description: 'All-time waitlist registrations',
      isLoading: loading,
    },
    {
      title: 'Founding Members',
      value: analytics ? `${formatNumber(analytics.founding_member_count)} / 50` : '—',
      description: 'General founding pool (cap 50)',
      isLoading: loading,
    },
    {
      title: 'Founding Creators',
      value: analytics ? `${formatNumber(analytics.founding_member_creator_count)} / 20` : '—',
      description: 'Creator founding pool (cap 20)',
      isLoading: loading,
    },
    {
      title: 'Active Users',
      value: analytics ? formatNumber(activeCount) : '—',
      description: 'Users with active status',
      isLoading: loading,
    },
    {
      title: 'Waiting Users',
      value: analytics ? formatNumber(waitingCount) : '—',
      description: 'Waiting for next wave',
      isLoading: loading,
    },
  ];

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-sage-900">Waitlist Analytics</h1>
          <p className="mt-1 text-sage-500">
            Overview of signups, waves, and user activity
          </p>
        </div>
        <button
          onClick={fetchAnalytics}
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
              <p className="text-sm font-medium text-coral-800">Failed to load analytics</p>
              <p className="text-sm text-coral-600">{error}</p>
            </div>
            <button
              onClick={fetchAnalytics}
              className="text-sm text-coral-700 hover:text-coral-900 font-medium"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {stats.map((stat) => (
          <StatCard
            key={stat.title}
            title={stat.title}
            value={stat.value}
            description={stat.description}
            isLoading={stat.isLoading}
          />
        ))}
      </div>

      {/* Tables section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Wave Distribution Table */}
        <div className="bg-white rounded-xl border border-sage-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-sage-100">
            <h2 className="text-lg font-medium text-sage-800">Wave Distribution</h2>
            <p className="text-sm text-sage-500 mt-0.5">Users by wave assignment</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-sage-50/50">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-sage-600 uppercase tracking-wider">
                    Wave Number
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-sage-600 uppercase tracking-wider">
                    Count
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sage-50">
                {loading ? (
                  // Loading skeleton
                  Array.from({ length: 4 }).map((_, i) => (
                    <tr key={i}>
                      <td className="px-6 py-4">
                        <div className="h-4 bg-sage-100 rounded w-20 animate-pulse" />
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="h-4 bg-sage-100 rounded w-12 ml-auto animate-pulse" />
                      </td>
                    </tr>
                  ))
                ) : analytics?.wave_distribution && analytics.wave_distribution.length > 0 ? (
                  analytics.wave_distribution.map((wave, index) => (
                    <tr key={index} className="hover:bg-sage-50/50 transition-colors">
                      <td className="px-6 py-4 text-sm text-sage-800">
                        {wave.wave_number !== null ? (
                          <span className="inline-flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-sage-400" />
                            Wave {wave.wave_number}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-2 text-sage-500">
                            <span className="w-2 h-2 rounded-full bg-sage-300" />
                            Unassigned
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-sage-700 text-right font-medium">
                        {formatNumber(wave.count)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={2} className="px-6 py-8 text-center text-sm text-sage-400">
                      No wave data available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Status Distribution Table */}
        <div className="bg-white rounded-xl border border-sage-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-sage-100">
            <h2 className="text-lg font-medium text-sage-800">Status Distribution</h2>
            <p className="text-sm text-sage-500 mt-0.5">Users by current status</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-sage-50/50">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-sage-600 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-sage-600 uppercase tracking-wider">
                    Count
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sage-50">
                {loading ? (
                  // Loading skeleton
                  Array.from({ length: 3 }).map((_, i) => (
                    <tr key={i}>
                      <td className="px-6 py-4">
                        <div className="h-4 bg-sage-100 rounded w-32 animate-pulse" />
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="h-4 bg-sage-100 rounded w-12 ml-auto animate-pulse" />
                      </td>
                    </tr>
                  ))
                ) : analytics?.status_distribution && analytics.status_distribution.length > 0 ? (
                  analytics.status_distribution.map((status, index) => (
                    <tr key={index} className="hover:bg-sage-50/50 transition-colors">
                      <td className="px-6 py-4 text-sm">
                        <span
                          className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-medium ${
                            status.status === 'active'
                              ? 'bg-forest-50 text-forest-700'
                              : status.status === 'waiting_for_next_wave'
                              ? 'bg-cream-100 text-cream-800'
                              : 'bg-sage-100 text-sage-700'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              status.status === 'active'
                                ? 'bg-forest-500'
                                : status.status === 'waiting_for_next_wave'
                                ? 'bg-cream-600'
                                : 'bg-sage-500'
                            }`}
                          />
                          {formatStatus(status.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-sage-700 text-right font-medium">
                        {formatNumber(status.count)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={2} className="px-6 py-8 text-center text-sm text-sage-400">
                      No status data available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Signups Last 30 Days */}
      <div className="bg-white rounded-xl border border-sage-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-sage-100">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-medium text-sage-800">Signups Last 30 Days</h2>
              <p className="text-sm text-sage-500 mt-0.5">Daily signup activity</p>
            </div>
            <span className="text-xs text-sage-400 bg-sage-50 px-2 py-1 rounded">
              Chart coming soon
            </span>
          </div>
        </div>
        <div className="p-6">
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between py-2">
                  <div className="h-4 bg-sage-100 rounded w-24 animate-pulse" />
                  <div className="h-4 bg-sage-100 rounded w-12 animate-pulse" />
                </div>
              ))}
            </div>
          ) : analytics?.signups_last_30_days && analytics.signups_last_30_days.length > 0 ? (
            <div className="max-h-80 overflow-y-auto">
              <div className="space-y-1">
                {analytics.signups_last_30_days.map((day, index) => {
                  // Calculate bar width based on max count
                  const maxCount = Math.max(
                    ...analytics.signups_last_30_days.map((d) => d.count)
                  );
                  const barWidth = maxCount > 0 ? (day.count / maxCount) * 100 : 0;

                  return (
                    <div
                      key={index}
                      className="flex items-center gap-4 py-2 px-3 rounded-lg hover:bg-sage-50/50 transition-colors group"
                    >
                      <span className="text-sm text-sage-600 w-20 flex-shrink-0">
                        {formatDate(day.day)}
                      </span>
                      <div className="flex-1 h-6 bg-sage-50 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-sage-300 group-hover:bg-sage-400 rounded-full transition-all duration-300"
                          style={{ width: `${barWidth}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-sage-800 w-12 text-right">
                        {formatNumber(day.count)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-sage-400">
              <svg className="w-12 h-12 mx-auto mb-3 text-sage-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <p className="text-sm">No signup data available for the last 30 days</p>
            </div>
          )}
        </div>
        {analytics?.signups_last_30_days && analytics.signups_last_30_days.length > 0 && (
          <div className="px-6 py-3 bg-sage-50/50 border-t border-sage-100">
            <div className="flex items-center justify-between text-sm">
              <span className="text-sage-500">
                Total in period:{' '}
                <span className="font-medium text-sage-700">
                  {formatNumber(
                    analytics.signups_last_30_days.reduce((sum, d) => sum + d.count, 0)
                  )}
                </span>
              </span>
              <span className="text-sage-500">
                Daily average:{' '}
                <span className="font-medium text-sage-700">
                  {formatNumber(
                    Math.round(
                      analytics.signups_last_30_days.reduce((sum, d) => sum + d.count, 0) /
                        analytics.signups_last_30_days.length
                    )
                  )}
                </span>
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
