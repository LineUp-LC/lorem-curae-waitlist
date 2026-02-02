import { useState, useEffect, useCallback } from 'react';
import { StatCard } from '../components/StatCard';

// Types for API response
interface TemplateStats {
  template: string;
  sent: number;
  bounced: number;
}

interface DayStats {
  day: string;
  sent: number;
  bounced: number;
}

interface EmailAnalytics {
  total_emails_sent: number;
  total_bounced: number;
  bounce_rate: number;
  template_stats: TemplateStats[];
  last_30_days: DayStats[];
}

// Format number with commas
function formatNumber(num: number): string {
  return num.toLocaleString();
}

// Format percentage
function formatPercentage(num: number): string {
  return `${num.toFixed(2)}%`;
}

// Format date for display
function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

// Format template name for display
function formatTemplateName(template: string): string {
  return template
    .replace(/_/g, ' ')
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

// Calculate bounce rate for a template
function calculateBounceRate(sent: number, bounced: number): number {
  if (sent === 0) return 0;
  return (bounced / sent) * 100;
}

export default function EmailAnalyticsPage() {
  const [analytics, setAnalytics] = useState<EmailAnalytics | null>(null);
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

      const response = await fetch('/api/admin/email-analytics', {
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
        throw new Error(`Failed to fetch email analytics (${response.status})`);
      }

      const data: EmailAnalytics = await response.json();
      setAnalytics(data);
    } catch (err) {
      console.error('[EmailAnalytics] Failed to fetch:', err);
      setError(err instanceof Error ? err.message : 'Failed to load email analytics');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  // Stats for cards
  const stats = [
    {
      title: 'Total Emails Sent',
      value: analytics ? formatNumber(analytics.total_emails_sent) : '—',
      description: 'All-time email deliveries',
      isLoading: loading,
    },
    {
      title: 'Total Bounced',
      value: analytics ? formatNumber(analytics.total_bounced) : '—',
      description: 'Failed delivery attempts',
      isLoading: loading,
    },
    {
      title: 'Bounce Rate',
      value: analytics ? formatPercentage(analytics.bounce_rate) : '—',
      description: 'Overall bounce percentage',
      isLoading: loading,
    },
    {
      title: 'Templates Used',
      value: analytics ? formatNumber(analytics.template_stats.length) : '—',
      description: 'Active email templates',
      isLoading: loading,
    },
  ];

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-sage-900">Email Analytics</h1>
          <p className="mt-1 text-sage-500">
            Delivery performance and template-level insights
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
              <p className="text-sm font-medium text-coral-800">Failed to load email analytics</p>
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

      {/* Template Performance Table */}
      <div className="bg-white rounded-xl border border-sage-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-sage-100">
          <h2 className="text-lg font-medium text-sage-800">Template Performance</h2>
          <p className="text-sm text-sage-500 mt-0.5">Delivery stats by email template</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-sage-50/50">
                <th className="px-6 py-3 text-left text-xs font-semibold text-sage-600 uppercase tracking-wider">
                  Template
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-sage-600 uppercase tracking-wider">
                  Sent
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-sage-600 uppercase tracking-wider">
                  Bounced
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-sage-600 uppercase tracking-wider">
                  Bounce Rate
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sage-50">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-6 py-4">
                      <div className="h-4 bg-sage-100 rounded w-40 animate-pulse" />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="h-4 bg-sage-100 rounded w-16 ml-auto animate-pulse" />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="h-4 bg-sage-100 rounded w-12 ml-auto animate-pulse" />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="h-4 bg-sage-100 rounded w-16 ml-auto animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : analytics?.template_stats && analytics.template_stats.length > 0 ? (
                analytics.template_stats.map((template, index) => {
                  const bounceRate = calculateBounceRate(template.sent, template.bounced);
                  const isHighBounce = bounceRate > 5;

                  return (
                    <tr key={index} className="hover:bg-sage-50/50 transition-colors">
                      <td className="px-6 py-4 text-sm text-sage-800">
                        <span className="inline-flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-sage-400" />
                          {formatTemplateName(template.template)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-sage-700 text-right font-medium">
                        {formatNumber(template.sent)}
                      </td>
                      <td className="px-6 py-4 text-sm text-right">
                        <span className={template.bounced > 0 ? 'text-coral-600 font-medium' : 'text-sage-500'}>
                          {formatNumber(template.bounced)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-right">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            isHighBounce
                              ? 'bg-coral-50 text-coral-700'
                              : bounceRate > 0
                              ? 'bg-cream-100 text-cream-800'
                              : 'bg-forest-50 text-forest-700'
                          }`}
                        >
                          {formatPercentage(bounceRate)}
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-sm text-sage-400">
                    No template data available
                  </td>
                </tr>
              )}
            </tbody>
            {analytics?.template_stats && analytics.template_stats.length > 0 && (
              <tfoot className="bg-sage-50/30">
                <tr>
                  <td className="px-6 py-3 text-sm font-semibold text-sage-700">
                    Total
                  </td>
                  <td className="px-6 py-3 text-sm font-semibold text-sage-700 text-right">
                    {formatNumber(analytics.total_emails_sent)}
                  </td>
                  <td className="px-6 py-3 text-sm font-semibold text-sage-700 text-right">
                    {formatNumber(analytics.total_bounced)}
                  </td>
                  <td className="px-6 py-3 text-sm font-semibold text-sage-700 text-right">
                    {formatPercentage(analytics.bounce_rate)}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Last 30 Days Activity */}
      <div className="bg-white rounded-xl border border-sage-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-sage-100">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-medium text-sage-800">Last 30 Days Activity</h2>
              <p className="text-sm text-sage-500 mt-0.5">Daily email delivery performance</p>
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
                  <div className="flex gap-6">
                    <div className="h-4 bg-sage-100 rounded w-16 animate-pulse" />
                    <div className="h-4 bg-sage-100 rounded w-12 animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          ) : analytics?.last_30_days && analytics.last_30_days.length > 0 ? (
            <div className="max-h-96 overflow-y-auto">
              <div className="space-y-1">
                {analytics.last_30_days.map((day, index) => {
                  const maxSent = Math.max(...analytics.last_30_days.map((d) => d.sent));
                  const sentBarWidth = maxSent > 0 ? (day.sent / maxSent) * 100 : 0;
                  const bounceBarWidth = day.sent > 0 ? (day.bounced / day.sent) * 100 : 0;

                  return (
                    <div
                      key={index}
                      className="flex items-center gap-4 py-2.5 px-3 rounded-lg hover:bg-sage-50/50 transition-colors group"
                    >
                      <span className="text-sm text-sage-600 w-20 flex-shrink-0">
                        {formatDate(day.day)}
                      </span>
                      <div className="flex-1 space-y-1">
                        {/* Sent bar */}
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-4 bg-sage-50 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-forest-300 group-hover:bg-forest-400 rounded-full transition-all duration-300"
                              style={{ width: `${sentBarWidth}%` }}
                            />
                          </div>
                          <span className="text-xs font-medium text-forest-700 w-14 text-right">
                            {formatNumber(day.sent)} sent
                          </span>
                        </div>
                        {/* Bounced indicator (only if > 0) */}
                        {day.bounced > 0 && (
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 bg-sage-50 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-coral-300 rounded-full transition-all duration-300"
                                style={{ width: `${bounceBarWidth}%` }}
                              />
                            </div>
                            <span className="text-xs text-coral-600 w-14 text-right">
                              {formatNumber(day.bounced)} fail
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-sage-400">
              <svg className="w-12 h-12 mx-auto mb-3 text-sage-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <p className="text-sm">No email activity in the last 30 days</p>
            </div>
          )}
        </div>
        {analytics?.last_30_days && analytics.last_30_days.length > 0 && (
          <div className="px-6 py-3 bg-sage-50/50 border-t border-sage-100">
            <div className="flex items-center justify-between text-sm">
              <span className="text-sage-500">
                Total sent:{' '}
                <span className="font-medium text-sage-700">
                  {formatNumber(analytics.last_30_days.reduce((sum, d) => sum + d.sent, 0))}
                </span>
              </span>
              <span className="text-sage-500">
                Total bounced:{' '}
                <span className="font-medium text-coral-600">
                  {formatNumber(analytics.last_30_days.reduce((sum, d) => sum + d.bounced, 0))}
                </span>
              </span>
              <span className="text-sage-500">
                Daily average:{' '}
                <span className="font-medium text-sage-700">
                  {formatNumber(
                    Math.round(
                      analytics.last_30_days.reduce((sum, d) => sum + d.sent, 0) /
                        analytics.last_30_days.length
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
