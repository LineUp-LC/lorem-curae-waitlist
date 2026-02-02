import { useState, useEffect, useCallback } from 'react';
import { StatCard } from '../components/StatCard';

// Types for API response
interface WaveCount {
  wave_number: number | null;
  count: number;
}

interface StatusPerWave {
  wave_number: number | null;
  status: string;
  count: number;
}

interface SignupPerDay {
  wave_number: number | null;
  day: string;
  count: number;
}

interface WaveAnalytics {
  total_per_wave: WaveCount[];
  status_per_wave: StatusPerWave[];
  founding_members_per_wave: WaveCount[];
  signups_last_30_days_per_wave: SignupPerDay[];
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

// Format wave number for display
function formatWaveNumber(waveNumber: number | null): string {
  return waveNumber !== null ? `Wave ${waveNumber}` : 'Fallback';
}

// Group signups by wave number
function groupSignupsByWave(signups: SignupPerDay[]): Map<number | null, SignupPerDay[]> {
  const grouped = new Map<number | null, SignupPerDay[]>();

  for (const signup of signups) {
    const existing = grouped.get(signup.wave_number) || [];
    existing.push(signup);
    grouped.set(signup.wave_number, existing);
  }

  return grouped;
}

export default function WaveAnalyticsPage() {
  const [analytics, setAnalytics] = useState<WaveAnalytics | null>(null);
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

      const response = await fetch('/api/admin/wave-analytics', {
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
        throw new Error(`Failed to fetch wave analytics (${response.status})`);
      }

      const data: WaveAnalytics = await response.json();
      setAnalytics(data);
    } catch (err) {
      console.error('[WaveAnalytics] Failed to fetch:', err);
      setError(err instanceof Error ? err.message : 'Failed to load wave analytics');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  // Helper to get count for specific wave
  const getWaveCount = (waveNumber: number | null): number => {
    return analytics?.total_per_wave.find((w) => w.wave_number === waveNumber)?.count ?? 0;
  };

  // Stats for cards
  const stats = [
    {
      title: 'Wave 1 Users',
      value: analytics ? formatNumber(getWaveCount(1)) : '—',
      description: 'First wave participants',
      isLoading: loading,
    },
    {
      title: 'Wave 2 Users',
      value: analytics ? formatNumber(getWaveCount(2)) : '—',
      description: 'Second wave participants',
      isLoading: loading,
    },
    {
      title: 'Wave 3 Users',
      value: analytics ? formatNumber(getWaveCount(3)) : '—',
      description: 'Third wave participants',
      isLoading: loading,
    },
    {
      title: 'Fallback Users',
      value: analytics ? formatNumber(getWaveCount(null)) : '—',
      description: 'Unassigned to any wave',
      isLoading: loading,
    },
  ];

  // Group signups by wave for the last section
  const signupsByWave = analytics
    ? groupSignupsByWave(analytics.signups_last_30_days_per_wave)
    : new Map();

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-sage-900">Wave Analytics</h1>
          <p className="mt-1 text-sage-500">
            Detailed breakdown of wave performance and user distribution
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
              <p className="text-sm font-medium text-coral-800">Failed to load wave analytics</p>
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

      {/* Summary stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
            <p className="text-sm text-sage-500 mt-0.5">Total users per wave</p>
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
                ) : analytics?.total_per_wave && analytics.total_per_wave.length > 0 ? (
                  analytics.total_per_wave.map((wave, index) => (
                    <tr key={index} className="hover:bg-sage-50/50 transition-colors">
                      <td className="px-6 py-4 text-sm text-sage-800">
                        <span className="inline-flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${wave.wave_number !== null ? 'bg-sage-400' : 'bg-sage-300'}`} />
                          {formatWaveNumber(wave.wave_number)}
                        </span>
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

        {/* Founding Members Per Wave Table */}
        <div className="bg-white rounded-xl border border-sage-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-sage-100">
            <h2 className="text-lg font-medium text-sage-800">Founding Members Per Wave</h2>
            <p className="text-sm text-sage-500 mt-0.5">Priority access members by wave</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-sage-50/50">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-sage-600 uppercase tracking-wider">
                    Wave Number
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-sage-600 uppercase tracking-wider">
                    Founding Members
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sage-50">
                {loading ? (
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
                ) : analytics?.founding_members_per_wave && analytics.founding_members_per_wave.length > 0 ? (
                  analytics.founding_members_per_wave.map((wave, index) => (
                    <tr key={index} className="hover:bg-sage-50/50 transition-colors">
                      <td className="px-6 py-4 text-sm text-sage-800">
                        <span className="inline-flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${wave.wave_number !== null ? 'bg-forest-400' : 'bg-sage-300'}`} />
                          {formatWaveNumber(wave.wave_number)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-sage-700 text-right font-medium">
                        {formatNumber(wave.count)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={2} className="px-6 py-8 text-center text-sm text-sage-400">
                      No founding member data available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Status Per Wave Table - Full width */}
      <div className="bg-white rounded-xl border border-sage-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-sage-100">
          <h2 className="text-lg font-medium text-sage-800">Status Per Wave</h2>
          <p className="text-sm text-sage-500 mt-0.5">User status breakdown by wave</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-sage-50/50">
                <th className="px-6 py-3 text-left text-xs font-semibold text-sage-600 uppercase tracking-wider">
                  Wave Number
                </th>
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
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-6 py-4">
                      <div className="h-4 bg-sage-100 rounded w-20 animate-pulse" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-4 bg-sage-100 rounded w-32 animate-pulse" />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="h-4 bg-sage-100 rounded w-12 ml-auto animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : analytics?.status_per_wave && analytics.status_per_wave.length > 0 ? (
                analytics.status_per_wave.map((item, index) => (
                  <tr key={index} className="hover:bg-sage-50/50 transition-colors">
                    <td className="px-6 py-4 text-sm text-sage-800">
                      <span className="inline-flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${item.wave_number !== null ? 'bg-sage-400' : 'bg-sage-300'}`} />
                        {formatWaveNumber(item.wave_number)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span
                        className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-medium ${
                          item.status === 'active'
                            ? 'bg-forest-50 text-forest-700'
                            : item.status === 'waiting_for_next_wave'
                            ? 'bg-cream-100 text-cream-800'
                            : 'bg-sage-100 text-sage-700'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            item.status === 'active'
                              ? 'bg-forest-500'
                              : item.status === 'waiting_for_next_wave'
                              ? 'bg-cream-600'
                              : 'bg-sage-500'
                          }`}
                        />
                        {formatStatus(item.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-sage-700 text-right font-medium">
                      {formatNumber(item.count)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="px-6 py-8 text-center text-sm text-sage-400">
                    No status data available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Signups Last 30 Days Per Wave */}
      <div className="bg-white rounded-xl border border-sage-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-sage-100">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-medium text-sage-800">Signups Last 30 Days Per Wave</h2>
              <p className="text-sm text-sage-500 mt-0.5">Daily signup activity by wave</p>
            </div>
            <span className="text-xs text-sage-400 bg-sage-50 px-2 py-1 rounded">
              Chart coming soon
            </span>
          </div>
        </div>
        <div className="p-6">
          {loading ? (
            <div className="space-y-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="space-y-3">
                  <div className="h-5 bg-sage-100 rounded w-24 animate-pulse" />
                  <div className="space-y-2 pl-4">
                    {Array.from({ length: 4 }).map((_, j) => (
                      <div key={j} className="flex items-center justify-between py-1">
                        <div className="h-4 bg-sage-50 rounded w-20 animate-pulse" />
                        <div className="h-4 bg-sage-50 rounded w-12 animate-pulse" />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : signupsByWave.size > 0 ? (
            <div className="space-y-6 max-h-[500px] overflow-y-auto">
              {Array.from(signupsByWave.entries())
                .sort((a, b) => {
                  // Sort by wave number, null (fallback) last
                  if (a[0] === null) return 1;
                  if (b[0] === null) return -1;
                  return a[0] - b[0];
                })
                .map(([waveNumber, signups]) => {
                  const totalForWave = signups.reduce((sum, s) => sum + s.count, 0);
                  const maxCount = Math.max(...signups.map((s) => s.count));

                  return (
                    <div key={waveNumber ?? 'fallback'} className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-sage-800 flex items-center gap-2">
                          <span className={`w-2.5 h-2.5 rounded-full ${waveNumber !== null ? 'bg-sage-500' : 'bg-sage-300'}`} />
                          {formatWaveNumber(waveNumber)}
                        </h3>
                        <span className="text-xs text-sage-500">
                          {formatNumber(totalForWave)} total
                        </span>
                      </div>
                      <div className="space-y-1 pl-4 border-l-2 border-sage-100">
                        {signups
                          .sort((a, b) => new Date(b.day).getTime() - new Date(a.day).getTime())
                          .slice(0, 10) // Show latest 10 days per wave
                          .map((signup, index) => {
                            const barWidth = maxCount > 0 ? (signup.count / maxCount) * 100 : 0;

                            return (
                              <div
                                key={index}
                                className="flex items-center gap-4 py-1.5 px-2 rounded hover:bg-sage-50/50 transition-colors"
                              >
                                <span className="text-xs text-sage-500 w-16 flex-shrink-0">
                                  {formatDate(signup.day)}
                                </span>
                                <div className="flex-1 h-4 bg-sage-50 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-sage-300 rounded-full transition-all duration-300"
                                    style={{ width: `${barWidth}%` }}
                                  />
                                </div>
                                <span className="text-xs font-medium text-sage-700 w-10 text-right">
                                  {formatNumber(signup.count)}
                                </span>
                              </div>
                            );
                          })}
                        {signups.length > 10 && (
                          <p className="text-xs text-sage-400 pl-2 pt-1">
                            +{signups.length - 10} more days
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
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
      </div>
    </div>
  );
}
