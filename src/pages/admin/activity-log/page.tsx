import { useState, useEffect, useCallback } from 'react';

// Types for API response
interface ActivityLog {
  id: string;
  event_type: string;
  email: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

interface ActivityLogResponse {
  logs: ActivityLog[];
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

// Format event type for display
function formatEventType(eventType: string): string {
  return eventType
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
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

// Truncate email for display
function formatEmail(email: string | null): string {
  if (!email) return '—';
  if (email.length > 30) {
    return email.substring(0, 27) + '...';
  }
  return email;
}

export default function ActivityLogPage() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const adminSecret = import.meta.env.VITE_ADMIN_SECRET;

      if (!adminSecret) {
        throw new Error('Admin credentials not configured');
      }

      const response = await fetch('/api/admin/activity-log', {
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
        throw new Error(`Failed to fetch activity log (${response.status})`);
      }

      const data: ActivityLogResponse = await response.json();
      setLogs(data.logs);
    } catch (err) {
      console.error('[ActivityLog] Failed to fetch:', err);
      setError(err instanceof Error ? err.message : 'Failed to load activity log');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Toggle expanded row for metadata
  const toggleExpanded = (id: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-sage-900">Activity Log</h1>
          <p className="mt-1 text-sage-500">
            Complete audit trail of system and admin actions
          </p>
        </div>
        <button
          onClick={fetchLogs}
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
              <p className="text-sm font-medium text-coral-800">Failed to load activity log</p>
              <p className="text-sm text-coral-600">{error}</p>
            </div>
            <button
              onClick={fetchLogs}
              className="text-sm text-coral-700 hover:text-coral-900 font-medium"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Summary stats */}
      {!loading && logs.length > 0 && (
        <div className="flex items-center gap-6 text-sm">
          <span className="text-sage-500">
            Showing <span className="font-medium text-sage-700">{logs.length}</span> log entries
          </span>
          <div className="flex items-center gap-4">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-purple-500" />
              <span className="text-sage-500">Admin</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-forest-500" />
              <span className="text-sage-500">User</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-cream-600" />
              <span className="text-sage-500">System</span>
            </span>
          </div>
        </div>
      )}

      {/* Activity Log Table */}
      <div className="bg-white rounded-xl border border-sage-100 overflow-hidden">
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
                <th className="px-6 py-3 text-left text-xs font-semibold text-sage-600 uppercase tracking-wider w-56">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-sage-600 uppercase tracking-wider">
                  Metadata
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sage-50">
              {loading ? (
                Array.from({ length: 10 }).map((_, i) => (
                  <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-sage-50/30'}>
                    <td className="px-6 py-4">
                      <div className="h-4 bg-sage-100 rounded w-36 animate-pulse" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-6 bg-sage-100 rounded w-28 animate-pulse" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-4 bg-sage-100 rounded w-40 animate-pulse" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-4 bg-sage-100 rounded w-48 animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : logs.length > 0 ? (
                logs.map((log, index) => {
                  const isExpanded = expandedRows.has(log.id);
                  const hasMetadata = log.metadata && Object.keys(log.metadata).length > 0;

                  return (
                    <tr
                      key={log.id}
                      className={`${index % 2 === 0 ? 'bg-white' : 'bg-sage-50/30'} hover:bg-sage-50/50 transition-colors`}
                    >
                      <td className="px-6 py-4 text-sm text-sage-600 whitespace-nowrap">
                        {formatTimestamp(log.created_at)}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${getEventBadgeStyles(log.event_type)}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${getEventDotColor(log.event_type)}`} />
                          {formatEventType(log.event_type)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-sage-700">
                        {log.email ? (
                          <span className="font-mono text-xs bg-sage-50 px-2 py-1 rounded" title={log.email}>
                            {formatEmail(log.email)}
                          </span>
                        ) : (
                          <span className="text-sage-400">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {hasMetadata ? (
                          <div className="space-y-2">
                            <button
                              onClick={() => toggleExpanded(log.id)}
                              className="inline-flex items-center gap-1.5 text-xs text-sage-500 hover:text-sage-700 transition-colors"
                            >
                              <svg
                                className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                              {isExpanded ? 'Hide' : 'Show'} details
                            </button>
                            {isExpanded && (
                              <pre className="text-xs font-mono bg-sage-800 text-sage-100 p-3 rounded-lg overflow-x-auto max-w-md">
                                {formatMetadata(log.metadata)}
                              </pre>
                            )}
                          </div>
                        ) : (
                          <span className="text-sm text-sage-400">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center">
                    <svg className="w-12 h-12 mx-auto mb-3 text-sage-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                    </svg>
                    <p className="text-sm text-sage-400">No activity log entries found</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination placeholder */}
        {logs.length > 0 && (
          <div className="px-6 py-4 bg-sage-50/50 border-t border-sage-100">
            <div className="flex items-center justify-between">
              <p className="text-sm text-sage-500">
                Displaying {logs.length} entries
              </p>
              <button
                disabled
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-sage-400 bg-sage-100 rounded-lg cursor-not-allowed"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
                Load more (coming soon)
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
