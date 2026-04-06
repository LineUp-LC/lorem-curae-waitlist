import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { EditUserPanel } from './EditUserPanel';
import { DeleteUserPanel } from './DeleteUserPanel';
import { AnonymizeUserPanel } from './AnonymizeUserPanel';
import { RegenerateTokenPanel } from './RegenerateTokenPanel';

// Types for API response
interface WaitlistUser {
  email: string;
  wave_number: number | null;
  status: string;
  is_founding_member: boolean;
  created_at: string;
}

interface ActivityLog {
  id: string;
  event_type: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

interface UserDetailResponse {
  user: WaitlistUser;
  recent_activity: ActivityLog[];
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
    second: '2-digit',
    hour12: true,
  });
}

// Format date only
function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

// Format status for display
function formatStatus(status: string): string {
  return status
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

// Format event type for display
function formatEventType(eventType: string): string {
  return eventType
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

// Format wave number for display
function formatWaveNumber(waveNumber: number | null): string {
  return waveNumber !== null ? `Wave ${waveNumber}` : 'Fallback';
}

// Get event type category
function getEventCategory(eventType: string): 'admin' | 'user' | 'system' | 'other' {
  if (eventType.startsWith('admin_')) return 'admin';
  if (eventType.startsWith('user_')) return 'user';
  if (eventType.startsWith('system_')) return 'system';
  return 'other';
}

// Get badge styles based on event category
function getEventBadgeStyles(eventType: string): string {
  const category = getEventCategory(eventType);
  switch (category) {
    case 'admin':
      return 'bg-purple-50 text-purple-700 border-purple-200';
    case 'user':
      return 'bg-forest-50 text-forest-700 border-forest-200';
    case 'system':
      return 'bg-cream-100 text-cream-800 border-cream-200';
    default:
      return 'bg-sage-100 text-sage-700 border-sage-200';
  }
}

// Get dot color based on event category
function getEventDotColor(eventType: string): string {
  const category = getEventCategory(eventType);
  switch (category) {
    case 'admin':
      return 'bg-purple-500';
    case 'user':
      return 'bg-forest-500';
    case 'system':
      return 'bg-cream-600';
    default:
      return 'bg-sage-500';
  }
}

// Format metadata for display
function formatMetadata(metadata: Record<string, unknown> | null): string {
  if (!metadata || Object.keys(metadata).length === 0) {
    return '—';
  }
  try {
    return JSON.stringify(metadata, null, 2);
  } catch {
    return '—';
  }
}

export default function UserDetailPage() {
  const { email } = useParams<{ email: string }>();
  const [data, setData] = useState<UserDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  const fetchUserData = useCallback(async () => {
    if (!email) {
      setError('No email provided');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setNotFound(false);

      const adminSecret = import.meta.env.VITE_ADMIN_SECRET;

      if (!adminSecret) {
        throw new Error('Admin credentials not configured');
      }

      const response = await fetch(`/api/admin/get-waitlist-user?email=${encodeURIComponent(email)}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${adminSecret}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          setNotFound(true);
          return;
        }
        if (response.status === 401) {
          throw new Error('Unauthorized - check admin credentials');
        }
        throw new Error(`Failed to fetch user (${response.status})`);
      }

      const result: UserDetailResponse = await response.json();
      setData(result);
    } catch (err) {
      console.error('[UserDetail] Failed to fetch:', err);
      setError(err instanceof Error ? err.message : 'Failed to load user details');
    } finally {
      setLoading(false);
    }
  }, [email]);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  // Not found state
  if (notFound) {
    return (
      <div className="space-y-8">
        <div className="bg-white rounded-xl border border-sage-100 px-6 py-12 text-center">
          <svg className="w-16 h-16 mx-auto mb-4 text-sage-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <h1 className="text-xl font-semibold text-sage-800 mb-2">User Not Found</h1>
          <p className="text-sage-500 mb-6">
            No waitlist user found with email: <span className="font-mono text-sm">{email}</span>
          </p>
          <Link
            to="/admin/search"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-sage-700 bg-sage-100 rounded-lg hover:bg-sage-200 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Search
          </Link>
        </div>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="space-y-8">
        {/* Header skeleton */}
        <div className="flex items-center justify-between">
          <div>
            <div className="h-8 bg-sage-100 rounded w-64 animate-pulse mb-2" />
            <div className="h-4 bg-sage-100 rounded w-40 animate-pulse" />
          </div>
        </div>

        {/* User info card skeleton */}
        <div className="bg-white rounded-xl border border-sage-100 p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 bg-sage-100 rounded w-24 animate-pulse" />
                <div className="h-5 bg-sage-100 rounded w-40 animate-pulse" />
              </div>
            ))}
          </div>
        </div>

        {/* Activity skeleton */}
        <div className="bg-white rounded-xl border border-sage-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-sage-100">
            <div className="h-5 bg-sage-100 rounded w-32 animate-pulse" />
          </div>
          <div className="p-6 space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex gap-4">
                <div className="h-4 bg-sage-100 rounded w-40 animate-pulse" />
                <div className="h-4 bg-sage-100 rounded w-28 animate-pulse" />
                <div className="h-4 bg-sage-100 rounded w-48 animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-8">
        <div className="bg-coral-50 border border-coral-200 rounded-lg p-6">
          <div className="flex items-start gap-4">
            <svg className="w-6 h-6 text-coral-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex-1">
              <h2 className="text-lg font-medium text-coral-800 mb-1">Failed to load user details</h2>
              <p className="text-coral-600">{error}</p>
              <button
                onClick={fetchUserData}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-coral-700 bg-coral-100 rounded-lg hover:bg-coral-200 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { user, recent_activity } = data;

  return (
    <div className="space-y-8">
      {/* Page header */}
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
            <h1 className="text-2xl font-semibold text-sage-900 font-mono">{user.email}</h1>
          </div>
          <p className="text-sage-500 ml-8">Waitlist User Details</p>
        </div>
        <button
          onClick={fetchUserData}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-sage-700 bg-white border border-sage-200 rounded-lg hover:bg-sage-50 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>

      {/* User Info Card */}
      <div className="bg-white rounded-xl border border-sage-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-sage-100">
          <h2 className="text-lg font-medium text-sage-800">User Information</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Email */}
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-sage-500 uppercase tracking-wider">Email</p>
              <p className="text-sm font-mono bg-sage-50 px-3 py-2 rounded-lg text-sage-800 break-all">
                {user.email}
              </p>
            </div>

            {/* Wave Number */}
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-sage-500 uppercase tracking-wider">Wave Number</p>
              <p className="text-sm text-sage-800">
                <span className="inline-flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${user.wave_number !== null ? 'bg-sage-500' : 'bg-sage-300'}`} />
                  {formatWaveNumber(user.wave_number)}
                </span>
              </p>
            </div>

            {/* Status */}
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-sage-500 uppercase tracking-wider">Status</p>
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                  user.status === 'active'
                    ? 'bg-forest-50 text-forest-700'
                    : user.status === 'waiting_for_next_wave'
                    ? 'bg-cream-100 text-cream-800'
                    : 'bg-sage-100 text-sage-700'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    user.status === 'active'
                      ? 'bg-forest-500'
                      : user.status === 'waiting_for_next_wave'
                      ? 'bg-cream-600'
                      : 'bg-sage-500'
                  }`}
                />
                {formatStatus(user.status)}
              </span>
            </div>

            {/* Founding Member */}
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-sage-500 uppercase tracking-wider">Founding Member</p>
              {user.is_founding_member ? (
                <span className="inline-flex items-center gap-1.5 text-sm text-forest-700">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Yes
                </span>
              ) : (
                <span className="text-sm text-sage-500">No</span>
              )}
            </div>

            {/* Created At */}
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-sage-500 uppercase tracking-wider">Joined</p>
              <p className="text-sm text-sage-800">{formatDate(user.created_at)}</p>
            </div>
          </div>
        </div>

      </div>

      {/* Edit User Panel */}
      <EditUserPanel user={user} onUserUpdated={fetchUserData} />

      {/* Regenerate Token Panel */}
      <RegenerateTokenPanel email={user.email} />

      {/* Delete User Panel */}
      <DeleteUserPanel email={user.email} />

      {/* Anonymize User Panel */}
      <AnonymizeUserPanel email={user.email} onUserAnonymized={fetchUserData} />

      {/* Recent Activity Section */}
      <div className="bg-white rounded-xl border border-sage-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-sage-100">
          <h2 className="text-lg font-medium text-sage-800">Recent Activity</h2>
          <p className="text-sm text-sage-500 mt-0.5">Activity log entries for this user</p>
        </div>

        {recent_activity.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-sage-50/50">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-sage-600 uppercase tracking-wider w-48">
                    Timestamp
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-sage-600 uppercase tracking-wider w-48">
                    Event Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-sage-600 uppercase tracking-wider">
                    Metadata
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sage-50">
                {recent_activity.map((activity, index) => {
                  const hasMetadata = activity.metadata && Object.keys(activity.metadata).length > 0;

                  return (
                    <tr
                      key={activity.id}
                      className={`${index % 2 === 0 ? 'bg-white' : 'bg-sage-50/30'} hover:bg-sage-50/50 transition-colors`}
                    >
                      <td className="px-6 py-4 text-sm text-sage-600 whitespace-nowrap">
                        {formatTimestamp(activity.created_at)}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${getEventBadgeStyles(activity.event_type)}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${getEventDotColor(activity.event_type)}`} />
                          {formatEventType(activity.event_type)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {hasMetadata ? (
                          <pre className="text-xs font-mono bg-sage-800 text-sage-100 p-2 rounded overflow-x-auto max-w-md">
                            {formatMetadata(activity.metadata)}
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
        ) : (
          <div className="px-6 py-12 text-center">
            <svg className="w-12 h-12 mx-auto mb-3 text-sage-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
            <p className="text-sm text-sage-500">No recent activity for this user</p>
          </div>
        )}
      </div>
    </div>
  );
}
