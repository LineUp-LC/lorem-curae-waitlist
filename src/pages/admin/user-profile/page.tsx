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

interface EmailEvent {
  id: string;
  template: string;
  status: string;
  created_at: string;
}

interface RateLimitBucket {
  key: string;
  count: number;
  limit: number;
  resets_at: string;
}

interface ActivityEvent {
  id: string;
  event_type: string;
  timestamp: string;
  metadata: Record<string, unknown> | null;
}

interface MagicLinkRequest {
  id: string;
  created_at: string;
  ip: string | null;
  user_agent: string | null;
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
    second: '2-digit',
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

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffMins = Math.round(diffMs / 60000);

  if (diffMins < 0) return 'Expired';
  if (diffMins < 60) return `${diffMins}m`;
  const diffHours = Math.round(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h`;
  return `${Math.round(diffHours / 24)}d`;
}

function formatStatus(status: string): string {
  return status
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatEventType(eventType: string): string {
  return eventType
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatWaveNumber(waveNumber: number | null): string {
  return waveNumber !== null ? `Wave ${waveNumber}` : 'Not assigned';
}

function formatMetadata(metadata: Record<string, unknown> | null): string {
  if (!metadata || Object.keys(metadata).length === 0) return '';
  try {
    return JSON.stringify(metadata, null, 2);
  } catch {
    return '';
  }
}

function truncateUserAgent(ua: string | null): string {
  if (!ua) return '—';
  if (ua.length > 60) return ua.substring(0, 57) + '...';
  return ua;
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

function EmailStatusBadge({ status }: { status: string }) {
  const getStyles = () => {
    const s = status.toLowerCase();
    if (s === 'delivered' || s === 'sent') {
      return 'bg-forest-50 text-forest-700 border-forest-200';
    }
    if (s === 'opened' || s === 'clicked') {
      return 'bg-sky-50 text-sky-700 border-sky-200';
    }
    if (s === 'bounced' || s === 'failed') {
      return 'bg-coral-50 text-coral-700 border-coral-200';
    }
    if (s === 'pending' || s === 'queued') {
      return 'bg-cream-100 text-cream-800 border-cream-200';
    }
    return 'bg-sage-100 text-sage-700 border-sage-200';
  };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${getStyles()}`}>
      {formatStatus(status)}
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
// Main Component
// ============================================================================

export default function UserProfilePage() {
  const { email } = useParams<{ email: string }>();
  const decodedEmail = email ? decodeURIComponent(email) : '';

  // State for each data source
  const [user, setUser] = useState<FetchState<UserProfile>>({
    data: null,
    loading: true,
    error: null,
  });
  const [emailEvents, setEmailEvents] = useState<FetchState<EmailEvent[]>>({
    data: null,
    loading: true,
    error: null,
  });
  const [rateLimits, setRateLimits] = useState<FetchState<RateLimitBucket[]>>({
    data: null,
    loading: true,
    error: null,
  });
  const [activity, setActivity] = useState<FetchState<ActivityEvent[]>>({
    data: null,
    loading: true,
    error: null,
  });
  const [magicLinks, setMagicLinks] = useState<FetchState<MagicLinkRequest[]>>({
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

  // Fetch email events
  const fetchEmailEvents = useCallback(async () => {
    if (!decodedEmail) return;
    setEmailEvents((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const res = await fetch(
        `/api/admin/user-email-events?email=${encodeURIComponent(decodedEmail)}`,
        { headers: getAuthHeaders() }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setEmailEvents({ data: data.events || [], loading: false, error: null });
    } catch (err) {
      setEmailEvents({
        data: null,
        loading: false,
        error: err instanceof Error ? err.message : 'Unknown error',
      });
    }
  }, [decodedEmail, getAuthHeaders]);

  // Fetch rate limits
  const fetchRateLimits = useCallback(async () => {
    if (!decodedEmail) return;
    setRateLimits((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const res = await fetch(
        `/api/admin/user-rate-limits?email=${encodeURIComponent(decodedEmail)}`,
        { headers: getAuthHeaders() }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setRateLimits({ data: data.buckets || [], loading: false, error: null });
    } catch (err) {
      setRateLimits({
        data: null,
        loading: false,
        error: err instanceof Error ? err.message : 'Unknown error',
      });
    }
  }, [decodedEmail, getAuthHeaders]);

  // Fetch activity
  const fetchActivity = useCallback(async () => {
    if (!decodedEmail) return;
    setActivity((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const res = await fetch(
        `/api/admin/user-activity?email=${encodeURIComponent(decodedEmail)}`,
        { headers: getAuthHeaders() }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setActivity({ data: data.events || [], loading: false, error: null });
    } catch (err) {
      setActivity({
        data: null,
        loading: false,
        error: err instanceof Error ? err.message : 'Unknown error',
      });
    }
  }, [decodedEmail, getAuthHeaders]);

  // Fetch magic links
  const fetchMagicLinks = useCallback(async () => {
    if (!decodedEmail) return;
    setMagicLinks((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const res = await fetch(
        `/api/admin/user-magic-links?email=${encodeURIComponent(decodedEmail)}`,
        { headers: getAuthHeaders() }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setMagicLinks({ data: data.requests || [], loading: false, error: null });
    } catch (err) {
      setMagicLinks({
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
      fetchEmailEvents();
      fetchRateLimits();
      fetchActivity();
      fetchMagicLinks();
    }
  }, [decodedEmail, fetchUser, fetchEmailEvents, fetchRateLimits, fetchActivity, fetchMagicLinks]);

  // Refresh all data
  const refreshAll = () => {
    fetchUser();
    fetchEmailEvents();
    fetchRateLimits();
    fetchActivity();
    fetchMagicLinks();
  };

  // Filter admin actions from activity
  const adminActions = activity.data?.filter((e) =>
    e.event_type.startsWith('admin_')
  ) || [];

  // Filter non-admin activity for timeline
  const userActivity = activity.data?.filter((e) =>
    !e.event_type.startsWith('admin_')
  ) || [];

  // Check if all loading
  const isFullyLoading =
    user.loading &&
    emailEvents.loading &&
    rateLimits.loading &&
    activity.loading &&
    magicLinks.loading;

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
            <h1 className="text-2xl font-semibold text-sage-900 font-mono break-all">
              {decodedEmail}
            </h1>
          </div>
          <p className="text-sage-500 ml-8">User Profile</p>
        </div>
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
          Refresh All
        </button>
      </div>

      {/* ================================================================== */}
      {/* Profile Summary Card */}
      {/* ================================================================== */}
      <SectionCard
        title="Profile Summary"
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
      {/* Magic Link Requests Section */}
      {/* ================================================================== */}
      <SectionCard
        title="Magic Link Requests"
        subtitle="History of magic link authentication requests"
        loading={magicLinks.loading}
        error={magicLinks.error}
        isEmpty={!magicLinks.data || magicLinks.data.length === 0}
        emptyMessage="No magic link requests found"
      >
        {magicLinks.data && magicLinks.data.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-sage-50/50">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-sage-600 uppercase tracking-wider">
                    Created At
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-sage-600 uppercase tracking-wider">
                    IP Address
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-sage-600 uppercase tracking-wider">
                    User Agent
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sage-50">
                {magicLinks.data.map((req, idx) => (
                  <tr
                    key={req.id}
                    className={`${idx % 2 === 0 ? 'bg-white' : 'bg-sage-50/30'} hover:bg-sage-50/50 transition-colors`}
                  >
                    <td className="px-6 py-4 text-sm text-sage-600 whitespace-nowrap">
                      {formatTimestamp(req.created_at)}
                    </td>
                    <td className="px-6 py-4 text-sm font-mono text-sage-700">
                      {req.ip || '—'}
                    </td>
                    <td className="px-6 py-4 text-sm text-sage-600" title={req.user_agent || undefined}>
                      {truncateUserAgent(req.user_agent)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      {/* ================================================================== */}
      {/* Email Events Section */}
      {/* ================================================================== */}
      <SectionCard
        title="Email Events"
        subtitle="Email delivery and engagement history"
        loading={emailEvents.loading}
        error={emailEvents.error}
        isEmpty={!emailEvents.data || emailEvents.data.length === 0}
        emptyMessage="No email events found"
      >
        {emailEvents.data && emailEvents.data.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-sage-50/50">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-sage-600 uppercase tracking-wider">
                    Template
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-sage-600 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-sage-600 uppercase tracking-wider">
                    Created At
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sage-50">
                {emailEvents.data.map((event, idx) => (
                  <tr
                    key={event.id}
                    className={`${idx % 2 === 0 ? 'bg-white' : 'bg-sage-50/30'} hover:bg-sage-50/50 transition-colors`}
                  >
                    <td className="px-6 py-4 text-sm font-medium text-sage-800">
                      {formatEventType(event.template)}
                    </td>
                    <td className="px-6 py-4">
                      <EmailStatusBadge status={event.status} />
                    </td>
                    <td className="px-6 py-4 text-sm text-sage-600 whitespace-nowrap">
                      {formatTimestamp(event.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      {/* ================================================================== */}
      {/* Rate Limit Buckets Section */}
      {/* ================================================================== */}
      <SectionCard
        title="Rate Limit Buckets"
        subtitle="Current rate limit status for this user"
        loading={rateLimits.loading}
        error={rateLimits.error}
        isEmpty={!rateLimits.data || rateLimits.data.length === 0}
        emptyMessage="No rate limit buckets found"
      >
        {rateLimits.data && rateLimits.data.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-sage-50/50">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-sage-600 uppercase tracking-wider">
                    Key
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-sage-600 uppercase tracking-wider">
                    Usage
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-sage-600 uppercase tracking-wider">
                    Resets At
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sage-50">
                {rateLimits.data.map((bucket, idx) => {
                  const usagePercent = (bucket.count / bucket.limit) * 100;
                  const isNearLimit = usagePercent >= 80;
                  const isAtLimit = bucket.count >= bucket.limit;

                  return (
                    <tr
                      key={bucket.key}
                      className={`${idx % 2 === 0 ? 'bg-white' : 'bg-sage-50/30'} hover:bg-sage-50/50 transition-colors`}
                    >
                      <td className="px-6 py-4 text-sm font-mono text-sage-800">
                        {bucket.key}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex-1 max-w-32">
                            <div className="h-2 bg-sage-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${
                                  isAtLimit
                                    ? 'bg-coral-500'
                                    : isNearLimit
                                    ? 'bg-amber-500'
                                    : 'bg-forest-500'
                                }`}
                                style={{ width: `${Math.min(usagePercent, 100)}%` }}
                              />
                            </div>
                          </div>
                          <span
                            className={`text-sm font-medium ${
                              isAtLimit
                                ? 'text-coral-600'
                                : isNearLimit
                                ? 'text-amber-600'
                                : 'text-sage-700'
                            }`}
                          >
                            {bucket.count} / {bucket.limit}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-sage-600 whitespace-nowrap">
                        <span className="inline-flex items-center gap-2">
                          <span>{formatTimestamp(bucket.resets_at)}</span>
                          <span className="text-xs text-sage-400">
                            ({formatRelativeTime(bucket.resets_at)})
                          </span>
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      {/* ================================================================== */}
      {/* Activity Timeline Section */}
      {/* ================================================================== */}
      <SectionCard
        title="Activity Timeline"
        subtitle="User activity events"
        loading={activity.loading}
        error={activity.error}
        isEmpty={userActivity.length === 0}
        emptyMessage="No user activity found"
      >
        {userActivity.length > 0 && (
          <div className="p-6">
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-sage-200" />

              {/* Timeline items */}
              <div className="space-y-6">
                {userActivity.map((event) => {
                  const hasMetadata = event.metadata && Object.keys(event.metadata).length > 0;

                  return (
                    <div key={event.id} className="relative pl-10">
                      {/* Timeline dot */}
                      <div className="absolute left-2.5 top-1.5 w-3 h-3 rounded-full bg-forest-500 border-2 border-white shadow-sm" />

                      {/* Event content */}
                      <div className="bg-sage-50/50 rounded-lg p-4 border border-sage-100">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-forest-50 text-forest-700 border border-forest-200">
                              {formatEventType(event.event_type)}
                            </span>
                            <p className="text-xs text-sage-500 mt-1">
                              {formatTimestamp(event.timestamp)}
                            </p>
                          </div>
                        </div>

                        {hasMetadata && (
                          <pre className="mt-3 text-xs font-mono bg-sage-800 text-sage-100 p-3 rounded-lg overflow-x-auto max-w-full">
                            {formatMetadata(event.metadata)}
                          </pre>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </SectionCard>

      {/* ================================================================== */}
      {/* Admin Actions Section */}
      {/* ================================================================== */}
      <SectionCard
        title="Admin Actions"
        subtitle="Administrative actions performed on this user"
        loading={activity.loading}
        error={activity.error}
        isEmpty={adminActions.length === 0}
        emptyMessage="No admin actions found"
      >
        {adminActions.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-sage-50/50">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-sage-600 uppercase tracking-wider">
                    Action
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-sage-600 uppercase tracking-wider">
                    Timestamp
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-sage-600 uppercase tracking-wider">
                    Metadata
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sage-50">
                {adminActions.map((action, idx) => {
                  const hasMetadata = action.metadata && Object.keys(action.metadata).length > 0;

                  return (
                    <tr
                      key={action.id}
                      className={`${idx % 2 === 0 ? 'bg-white' : 'bg-sage-50/30'} hover:bg-sage-50/50 transition-colors`}
                    >
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200">
                          {formatEventType(action.event_type.replace('admin_', ''))}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-sage-600 whitespace-nowrap">
                        {formatTimestamp(action.timestamp)}
                      </td>
                      <td className="px-6 py-4">
                        {hasMetadata ? (
                          <pre className="text-xs font-mono bg-sage-800 text-sage-100 p-2 rounded overflow-x-auto max-w-md">
                            {formatMetadata(action.metadata)}
                          </pre>
                        ) : (
                          <span className="text-sm text-sage-400">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>
    </div>
  );
}
