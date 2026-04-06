import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { StatCard } from './components/StatCard';

// Types for API responses
interface WaveCount {
  wave_number: number;
  count: number;
}

interface RecentSignup {
  email: string;
  created_at: string;
  wave_number: number | null;
}

interface SummaryData {
  total_users: number;
  total_waves: number;
  users_per_wave: WaveCount[];
  recent_signups: RecentSignup[];
}

interface RecentFailure {
  email: string;
  template: string;
  status: 'bounced' | 'failed';
  created_at: string;
}

interface EmailSummaryData {
  total_emails_sent: number;
  total_bounced: number;
  total_failed: number;
  recent_failures: RecentFailure[];
}

interface HealthCheckData {
  database: { ok: boolean };
  email: { ok: boolean };
  magic_link: { ok: boolean };
  feature_flags: { ok: boolean };
  timestamp: string;
}

interface AdminActivityEvent {
  id: string;
  admin_email: string;
  action: string;
  target: string | null;
  created_at: string;
}

interface AdminActivityData {
  events: AdminActivityEvent[];
}

// Format number with commas
function formatNumber(num: number): string {
  return num.toLocaleString();
}

// Format timestamp for display
function formatTimestamp(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
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

// Get action badge color
function getActionColor(action: string): string {
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
  return 'bg-sage-50 text-sage-700';
}

// Section error component
function SectionError({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="bg-coral-50 border border-coral-100 rounded-lg p-4">
      <div className="flex items-center gap-2 text-coral-700">
        <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span className="text-sm">{message}</span>
        {onRetry && (
          <button onClick={onRetry} className="ml-auto text-xs font-medium hover:underline">
            Retry
          </button>
        )}
      </div>
    </div>
  );
}

// Quick link card component
function QuickLinkCard({ to, title, description, icon }: { to: string; title: string; description: string; icon: React.ReactNode }) {
  return (
    <Link
      to={to}
      className="bg-white rounded-lg border border-sage-100 p-4 hover:border-sage-300 hover:shadow-sm transition-all group"
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg bg-sage-100 group-hover:bg-sage-200 flex items-center justify-center transition-colors">
          {icon}
        </div>
        <div>
          <p className="text-sm font-medium text-sage-800 group-hover:text-sage-900">{title}</p>
          <p className="text-xs text-sage-500 mt-0.5">{description}</p>
        </div>
      </div>
    </Link>
  );
}

export default function AdminDashboardPage() {
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [emailSummary, setEmailSummary] = useState<EmailSummaryData | null>(null);
  const [health, setHealth] = useState<HealthCheckData | null>(null);
  const [activity, setActivity] = useState<AdminActivityData | null>(null);

  const [loadingSummary, setLoadingSummary] = useState(true);
  const [loadingEmail, setLoadingEmail] = useState(true);
  const [loadingHealth, setLoadingHealth] = useState(true);
  const [loadingActivity, setLoadingActivity] = useState(true);

  const [errorSummary, setErrorSummary] = useState<string | null>(null);
  const [errorEmail, setErrorEmail] = useState<string | null>(null);
  const [errorHealth, setErrorHealth] = useState<string | null>(null);
  const [errorActivity, setErrorActivity] = useState<string | null>(null);

  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const getAdminSecret = () => import.meta.env.VITE_ADMIN_SECRET;

  // Fetch summary data
  const fetchSummary = useCallback(async () => {
    try {
      setLoadingSummary(true);
      setErrorSummary(null);
      const adminSecret = getAdminSecret();
      if (!adminSecret) throw new Error('Admin credentials not configured');

      const response = await fetch('/api/admin/summary', {
        headers: {
          'Authorization': `Bearer ${adminSecret}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) throw new Error(`Failed to fetch summary (${response.status})`);
      const data: SummaryData = await response.json();
      setSummary(data);
    } catch (err) {
      console.error('[Dashboard] Summary fetch failed:', err);
      setErrorSummary(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoadingSummary(false);
    }
  }, []);

  // Fetch email summary
  const fetchEmailSummary = useCallback(async () => {
    try {
      setLoadingEmail(true);
      setErrorEmail(null);
      const adminSecret = getAdminSecret();
      if (!adminSecret) throw new Error('Admin credentials not configured');

      const response = await fetch('/api/admin/email-summary', {
        headers: {
          'Authorization': `Bearer ${adminSecret}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) throw new Error(`Failed to fetch email summary (${response.status})`);
      const data: EmailSummaryData = await response.json();
      setEmailSummary(data);
    } catch (err) {
      console.error('[Dashboard] Email summary fetch failed:', err);
      setErrorEmail(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoadingEmail(false);
    }
  }, []);

  // Fetch health checks
  const fetchHealth = useCallback(async () => {
    try {
      setLoadingHealth(true);
      setErrorHealth(null);
      const adminSecret = getAdminSecret();
      if (!adminSecret) throw new Error('Admin credentials not configured');

      const response = await fetch('/api/admin/health-checks', {
        headers: {
          'Authorization': `Bearer ${adminSecret}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) throw new Error(`Failed to fetch health (${response.status})`);
      const data: HealthCheckData = await response.json();
      setHealth(data);
    } catch (err) {
      console.error('[Dashboard] Health fetch failed:', err);
      setErrorHealth(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoadingHealth(false);
    }
  }, []);

  // Fetch admin activity
  const fetchActivity = useCallback(async () => {
    try {
      setLoadingActivity(true);
      setErrorActivity(null);
      const adminSecret = getAdminSecret();
      if (!adminSecret) throw new Error('Admin credentials not configured');

      const response = await fetch('/api/admin/admin-activity?limit=5', {
        headers: {
          'Authorization': `Bearer ${adminSecret}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) throw new Error(`Failed to fetch activity (${response.status})`);
      const data: AdminActivityData = await response.json();
      setActivity(data);
    } catch (err) {
      console.error('[Dashboard] Activity fetch failed:', err);
      setErrorActivity(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoadingActivity(false);
    }
  }, []);

  // Fetch all data
  const fetchAll = useCallback(() => {
    fetchSummary();
    fetchEmailSummary();
    fetchHealth();
    fetchActivity();
    setLastUpdated(new Date());
  }, [fetchSummary, fetchEmailSummary, fetchHealth, fetchActivity]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // Calculate overall health status
  const isHealthy = health
    ? health.database.ok && health.email.ok && health.magic_link.ok && health.feature_flags.ok
    : null;

  // Calculate email failures
  const emailFailures = emailSummary ? emailSummary.total_bounced + emailSummary.total_failed : 0;

  // Loading state for any section
  const isLoading = loadingSummary || loadingEmail || loadingHealth || loadingActivity;

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-sage-900">Admin Dashboard</h1>
          <p className="mt-1 text-sage-500">
            High-level overview of platform health and activity
          </p>
          {lastUpdated && (
            <p className="mt-1 text-xs text-sage-400">
              Last updated: {formatTimestamp(lastUpdated.toISOString())}
            </p>
          )}
        </div>
        <button
          onClick={fetchAll}
          disabled={isLoading}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-sage-700 bg-white border border-sage-200 rounded-lg hover:bg-sage-50 transition-colors disabled:opacity-50"
        >
          <svg
            className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh All
        </button>
      </div>

      {/* Summary Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="Total Waitlist Users"
          value={summary ? formatNumber(summary.total_users) : '—'}
          description="All-time signups"
          isLoading={loadingSummary}
        />
        <StatCard
          title="Total Waves"
          value={summary ? formatNumber(summary.total_waves) : '—'}
          description="Access waves created"
          isLoading={loadingSummary}
        />
        <StatCard
          title="Emails Sent"
          value={emailSummary ? formatNumber(emailSummary.total_emails_sent) : '—'}
          description="Total emails delivered"
          isLoading={loadingEmail}
        />
        <StatCard
          title="Email Failures"
          value={emailSummary ? formatNumber(emailFailures) : '—'}
          description={`${emailSummary?.total_bounced ?? 0} bounced, ${emailSummary?.total_failed ?? 0} failed`}
          isLoading={loadingEmail}
        />
        {/* System Health Card */}
        <Link to="/admin/health-checks" className="block">
          <div className={`bg-white rounded-xl border p-6 shadow-sm hover:shadow-md transition-all ${
            loadingHealth
              ? 'border-sage-100'
              : isHealthy
              ? 'border-forest-200 hover:border-forest-300'
              : 'border-coral-200 hover:border-coral-300'
          }`}>
            <p className="text-sm font-medium text-sage-500">System Health</p>
            {loadingHealth ? (
              <div className="h-9 bg-sage-100 rounded w-20 animate-pulse mt-1" />
            ) : (
              <div className="flex items-center gap-2 mt-1">
                <span className={`w-3 h-3 rounded-full ${isHealthy ? 'bg-forest-500' : 'bg-coral-500'}`} />
                <span className={`text-2xl font-semibold ${isHealthy ? 'text-forest-700' : 'text-coral-700'}`}>
                  {isHealthy ? 'OK' : 'Issues'}
                </span>
              </div>
            )}
            <p className="mt-3 text-sm text-sage-400">Click to view details</p>
          </div>
        </Link>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Users & Waves Section */}
        <div className="bg-white rounded-xl border border-sage-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-sage-100 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-medium text-sage-800">Users & Waves</h2>
              <p className="text-sm text-sage-500 mt-0.5">Distribution and recent signups</p>
            </div>
            <Link to="/admin/waves-management" className="text-sm text-sage-600 hover:text-sage-800 font-medium">
              Manage Waves →
            </Link>
          </div>

          {errorSummary ? (
            <div className="p-4">
              <SectionError message={errorSummary} onRetry={fetchSummary} />
            </div>
          ) : (
            <div className="p-6 space-y-6">
              {/* Users per wave */}
              <div>
                <h3 className="text-sm font-medium text-sage-700 mb-3">Users Per Wave</h3>
                {loadingSummary ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex items-center justify-between">
                        <div className="h-4 bg-sage-100 rounded w-20 animate-pulse" />
                        <div className="h-4 bg-sage-100 rounded w-12 animate-pulse" />
                      </div>
                    ))}
                  </div>
                ) : summary && summary.users_per_wave.length > 0 ? (
                  <div className="space-y-2">
                    {summary.users_per_wave.map((wave) => (
                      <div key={wave.wave_number} className="flex items-center justify-between py-1.5 border-b border-sage-50 last:border-0">
                        <span className="text-sm text-sage-700">Wave {wave.wave_number}</span>
                        <span className="text-sm font-medium text-sage-800">{formatNumber(wave.count)} users</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-sage-400 italic">No wave data</p>
                )}
              </div>

              {/* Recent signups */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-sage-700">Recent Signups</h3>
                  <Link to="/admin/search" className="text-xs text-sage-500 hover:text-sage-700">
                    Search users →
                  </Link>
                </div>
                {loadingSummary ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className="h-4 bg-sage-100 rounded w-40 animate-pulse" />
                        <div className="h-4 bg-sage-100 rounded w-16 animate-pulse" />
                      </div>
                    ))}
                  </div>
                ) : summary && summary.recent_signups.length > 0 ? (
                  <div className="space-y-2">
                    {summary.recent_signups.slice(0, 5).map((signup, idx) => (
                      <div key={idx} className="flex items-center justify-between py-1.5 border-b border-sage-50 last:border-0">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-sm text-sage-700 truncate">{signup.email}</span>
                          <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${
                            signup.wave_number ? 'bg-sage-100 text-sage-600' : 'bg-cream-100 text-cream-700'
                          }`}>
                            {signup.wave_number ? `Wave ${signup.wave_number}` : 'Fallback'}
                          </span>
                        </div>
                        <span className="text-xs text-sage-400 flex-shrink-0">{formatRelativeTime(signup.created_at)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-sage-400 italic">No recent signups</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Email Summary Section */}
        <div className="bg-white rounded-xl border border-sage-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-sage-100 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-medium text-sage-800">Email Summary</h2>
              <p className="text-sm text-sage-500 mt-0.5">Delivery status and recent failures</p>
            </div>
            <Link to="/admin/email-events" className="text-sm text-sage-600 hover:text-sage-800 font-medium">
              View Events →
            </Link>
          </div>

          {errorEmail ? (
            <div className="p-4">
              <SectionError message={errorEmail} onRetry={fetchEmailSummary} />
            </div>
          ) : (
            <div className="p-6 space-y-6">
              {/* Email stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-semibold text-sage-800">
                    {loadingEmail ? '—' : formatNumber(emailSummary?.total_emails_sent ?? 0)}
                  </p>
                  <p className="text-xs text-sage-500 mt-1">Sent</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-semibold text-cream-700">
                    {loadingEmail ? '—' : formatNumber(emailSummary?.total_bounced ?? 0)}
                  </p>
                  <p className="text-xs text-sage-500 mt-1">Bounced</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-semibold text-coral-700">
                    {loadingEmail ? '—' : formatNumber(emailSummary?.total_failed ?? 0)}
                  </p>
                  <p className="text-xs text-sage-500 mt-1">Failed</p>
                </div>
              </div>

              {/* Recent failures */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-sage-700">Recent Failures</h3>
                  <Link to="/admin/email-templates" className="text-xs text-sage-500 hover:text-sage-700">
                    Edit templates →
                  </Link>
                </div>
                {loadingEmail ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className="h-4 bg-sage-100 rounded w-40 animate-pulse" />
                        <div className="h-4 bg-sage-100 rounded w-16 animate-pulse" />
                      </div>
                    ))}
                  </div>
                ) : emailSummary && emailSummary.recent_failures.length > 0 ? (
                  <div className="space-y-2">
                    {emailSummary.recent_failures.slice(0, 5).map((failure, idx) => (
                      <div key={idx} className="flex items-center justify-between py-1.5 border-b border-sage-50 last:border-0">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-sm text-sage-700 truncate">{failure.email}</span>
                          <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${
                            failure.status === 'bounced' ? 'bg-cream-100 text-cream-700' : 'bg-coral-100 text-coral-700'
                          }`}>
                            {failure.status}
                          </span>
                        </div>
                        <span className="text-xs text-sage-400 flex-shrink-0">{formatRelativeTime(failure.created_at)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-forest-600 flex items-center gap-1.5">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    No recent failures
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Recent Admin Activity Section */}
      <div className="bg-white rounded-xl border border-sage-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-sage-100 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-medium text-sage-800">Recent Admin Activity</h2>
            <p className="text-sm text-sage-500 mt-0.5">Last 5 administrative actions</p>
          </div>
          <Link to="/admin/admin-activity" className="text-sm text-sage-600 hover:text-sage-800 font-medium">
            View All →
          </Link>
        </div>

        {errorActivity ? (
          <div className="p-4">
            <SectionError message={errorActivity} onRetry={fetchActivity} />
          </div>
        ) : loadingActivity ? (
          <div className="p-6">
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="h-4 bg-sage-100 rounded w-40 animate-pulse" />
                  <div className="h-4 bg-sage-100 rounded w-24 animate-pulse" />
                  <div className="h-4 bg-sage-100 rounded w-32 animate-pulse" />
                  <div className="h-4 bg-sage-100 rounded w-20 animate-pulse ml-auto" />
                </div>
              ))}
            </div>
          </div>
        ) : activity && activity.events.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-sage-50/50">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-sage-600 uppercase">Admin</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-sage-600 uppercase">Action</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-sage-600 uppercase">Target</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-sage-600 uppercase">When</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sage-100">
                {activity.events.map((event, index) => (
                  <tr key={event.id} className={index % 2 === 0 ? 'bg-white' : 'bg-sage-50/30'}>
                    <td className="px-6 py-3">
                      <span className="text-sm text-sage-700">{event.admin_email}</span>
                    </td>
                    <td className="px-6 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getActionColor(event.action)}`}>
                        {event.action}
                      </span>
                    </td>
                    <td className="px-6 py-3">
                      {event.target ? (
                        <span className="text-sm font-mono text-sage-600">{event.target}</span>
                      ) : (
                        <span className="text-xs text-sage-400 italic">—</span>
                      )}
                    </td>
                    <td className="px-6 py-3 text-right">
                      <span className="text-xs text-sage-500">{formatRelativeTime(event.created_at)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center">
            <p className="text-sm text-sage-500">No recent admin activity</p>
          </div>
        )}
      </div>

      {/* Quick Links */}
      <div>
        <h2 className="text-lg font-medium text-sage-800 mb-4">Quick Links</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <QuickLinkCard
            to="/admin/search"
            title="User Search"
            description="Find and manage users"
            icon={<svg className="w-5 h-5 text-sage-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>}
          />
          <QuickLinkCard
            to="/admin/waves-management"
            title="Waves Management"
            description="Manage access waves"
            icon={<svg className="w-5 h-5 text-sage-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>}
          />
          <QuickLinkCard
            to="/admin/email-templates"
            title="Email Templates"
            description="Edit email content"
            icon={<svg className="w-5 h-5 text-sage-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>}
          />
          <QuickLinkCard
            to="/admin/feature-flags"
            title="Feature Flags"
            description="Toggle features"
            icon={<svg className="w-5 h-5 text-sage-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" /></svg>}
          />
          <QuickLinkCard
            to="/admin/health-checks"
            title="Health Checks"
            description="System status"
            icon={<svg className="w-5 h-5 text-sage-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>}
          />
          <QuickLinkCard
            to="/admin/rate-limits"
            title="Rate Limits"
            description="Monitor throttling"
            icon={<svg className="w-5 h-5 text-sage-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
          />
          <QuickLinkCard
            to="/admin/admin-activity"
            title="Activity Log"
            description="Audit trail"
            icon={<svg className="w-5 h-5 text-sage-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>}
          />
          <QuickLinkCard
            to="/admin/tools"
            title="Admin Tools"
            description="Utilities & actions"
            icon={<svg className="w-5 h-5 text-sage-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
          />
        </div>
      </div>
    </div>
  );
}
