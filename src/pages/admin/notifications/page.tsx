import { useState, useEffect, useCallback, useMemo } from 'react';

// ============================================================================
// Types
// ============================================================================

type NotificationCategory = 'incident' | 'email' | 'rate_limit' | 'health' | 'system' | 'admin_action';
type NotificationSeverity = 'info' | 'warning' | 'error' | 'critical';

interface Notification {
  id: string;
  title: string;
  body: string;
  category: NotificationCategory;
  severity: NotificationSeverity;
  created_at: string;
  read: boolean;
  link: string | null;
}

interface Filters {
  category: NotificationCategory | 'all';
  severity: NotificationSeverity | 'all';
  readStatus: 'all' | 'unread' | 'read';
}

interface FetchState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

// ============================================================================
// Constants
// ============================================================================

const CATEGORIES: { value: NotificationCategory | 'all'; label: string }[] = [
  { value: 'all', label: 'All Categories' },
  { value: 'incident', label: 'Incident' },
  { value: 'email', label: 'Email' },
  { value: 'rate_limit', label: 'Rate Limit' },
  { value: 'health', label: 'Health' },
  { value: 'system', label: 'System' },
  { value: 'admin_action', label: 'Admin Action' },
];

const SEVERITIES: { value: NotificationSeverity | 'all'; label: string }[] = [
  { value: 'all', label: 'All Severities' },
  { value: 'info', label: 'Info' },
  { value: 'warning', label: 'Warning' },
  { value: 'error', label: 'Error' },
  { value: 'critical', label: 'Critical' },
];

const READ_STATUSES: { value: Filters['readStatus']; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'unread', label: 'Unread' },
  { value: 'read', label: 'Read' },
];

// ============================================================================
// Utility Functions
// ============================================================================

function formatTimestamp(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
}

function formatCategory(category: NotificationCategory): string {
  return category
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

// ============================================================================
// Badge Components
// ============================================================================

function SeverityBadge({ severity }: { severity: NotificationSeverity }) {
  const getStyles = () => {
    switch (severity) {
      case 'info':
        return 'bg-sky-50 text-sky-700 border-sky-200';
      case 'warning':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'error':
        return 'bg-coral-50 text-coral-700 border-coral-200';
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-sage-100 text-sage-700 border-sage-200';
    }
  };

  const getIcon = () => {
    switch (severity) {
      case 'info':
        return (
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        );
      case 'warning':
        return (
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        );
      case 'error':
      case 'critical':
        return (
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${getStyles()}`}>
      {getIcon()}
      {severity.charAt(0).toUpperCase() + severity.slice(1)}
    </span>
  );
}

function CategoryBadge({ category }: { category: NotificationCategory }) {
  const getStyles = () => {
    switch (category) {
      case 'incident':
        return 'bg-coral-50 text-coral-700';
      case 'email':
        return 'bg-purple-50 text-purple-700';
      case 'rate_limit':
        return 'bg-amber-50 text-amber-700';
      case 'health':
        return 'bg-forest-50 text-forest-700';
      case 'system':
        return 'bg-sage-100 text-sage-700';
      case 'admin_action':
        return 'bg-sky-50 text-sky-700';
      default:
        return 'bg-sage-100 text-sage-700';
    }
  };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getStyles()}`}>
      {formatCategory(category)}
    </span>
  );
}

// ============================================================================
// Filter Select Component
// ============================================================================

interface FilterSelectProps<T extends string> {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
}

function FilterSelect<T extends string>({
  label,
  value,
  options,
  onChange,
}: FilterSelectProps<T>) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-sage-600">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className="px-3 py-2 text-sm bg-white border border-sage-200 rounded-lg text-sage-800 focus:outline-none focus:ring-2 focus:ring-forest-500/20 focus:border-forest-500"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

// ============================================================================
// Notification Card Component
// ============================================================================

interface NotificationCardProps {
  notification: Notification;
  onMarkRead: (id: string) => Promise<void>;
  isMarkingRead: boolean;
}

function NotificationCard({ notification, onMarkRead, isMarkingRead }: NotificationCardProps) {
  const getBorderColor = () => {
    if (notification.read) return 'border-l-sage-200';
    switch (notification.severity) {
      case 'info':
        return 'border-l-sky-500';
      case 'warning':
        return 'border-l-amber-500';
      case 'error':
        return 'border-l-coral-500';
      case 'critical':
        return 'border-l-red-600';
      default:
        return 'border-l-sage-400';
    }
  };

  return (
    <div
      className={`bg-white rounded-xl border border-sage-100 shadow-sm overflow-hidden transition-all ${
        !notification.read ? 'ring-1 ring-forest-100' : ''
      }`}
    >
      <div className={`border-l-4 ${getBorderColor()}`}>
        <div className="p-5">
          {/* Header */}
          <div className="flex items-start justify-between gap-4 mb-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h3 className={`text-sm font-semibold ${notification.read ? 'text-sage-700' : 'text-sage-900'}`}>
                  {notification.title}
                </h3>
                {!notification.read && (
                  <span className="w-2 h-2 rounded-full bg-forest-500 flex-shrink-0" />
                )}
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <CategoryBadge category={notification.category} />
                <SeverityBadge severity={notification.severity} />
                <span className="text-xs text-sage-500">
                  {formatTimestamp(notification.created_at)}
                </span>
              </div>
            </div>
          </div>

          {/* Body */}
          <p className={`text-sm leading-relaxed mb-4 ${notification.read ? 'text-sage-500' : 'text-sage-700'}`}>
            {notification.body}
          </p>

          {/* Actions */}
          <div className="flex items-center gap-3">
            {!notification.read && (
              <button
                onClick={() => onMarkRead(notification.id)}
                disabled={isMarkingRead}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-forest-700 bg-forest-50 border border-forest-200 rounded-lg hover:bg-forest-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isMarkingRead ? (
                  <>
                    <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Marking...
                  </>
                ) : (
                  <>
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Mark as Read
                  </>
                )}
              </button>
            )}

            {notification.link && (
              <a
                href={notification.link}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-sage-700 bg-sage-50 border border-sage-200 rounded-lg hover:bg-sage-100 transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                View Details
              </a>
            )}

            {notification.read && !notification.link && (
              <span className="text-xs text-sage-400 italic">Read</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<FetchState<Notification[]>>({
    data: null,
    loading: true,
    error: null,
  });

  const [filters, setFilters] = useState<Filters>({
    category: 'all',
    severity: 'all',
    readStatus: 'all',
  });

  const [markingReadIds, setMarkingReadIds] = useState<Set<string>>(new Set());

  const getAuthHeaders = useCallback(() => {
    const adminSecret = import.meta.env.VITE_ADMIN_SECRET;
    return {
      Authorization: `Bearer ${adminSecret}`,
      'Content-Type': 'application/json',
    };
  }, []);

  const fetchNotifications = useCallback(async () => {
    setNotifications((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const res = await fetch('/api/admin/notifications', {
        headers: getAuthHeaders(),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      setNotifications({
        data: data.notifications || [],
        loading: false,
        error: null,
      });
    } catch (err) {
      setNotifications({
        data: null,
        loading: false,
        error: err instanceof Error ? err.message : 'Unknown error',
      });
    }
  }, [getAuthHeaders]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleMarkRead = useCallback(
    async (id: string) => {
      setMarkingReadIds((prev) => new Set(prev).add(id));

      try {
        const res = await fetch('/api/admin/notifications/mark-read', {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({ id }),
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        // Update local state
        setNotifications((prev) => {
          if (!prev.data) return prev;
          return {
            ...prev,
            data: prev.data.map((n) =>
              n.id === id ? { ...n, read: true } : n
            ),
          };
        });
      } catch (err) {
        console.error('Failed to mark notification as read:', err);
        // Could show a toast here
      } finally {
        setMarkingReadIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      }
    },
    [getAuthHeaders]
  );

  // Apply filters client-side
  const filteredNotifications = useMemo(() => {
    if (!notifications.data) return [];

    return notifications.data.filter((n) => {
      if (filters.category !== 'all' && n.category !== filters.category) {
        return false;
      }
      if (filters.severity !== 'all' && n.severity !== filters.severity) {
        return false;
      }
      if (filters.readStatus === 'unread' && n.read) {
        return false;
      }
      if (filters.readStatus === 'read' && !n.read) {
        return false;
      }
      return true;
    });
  }, [notifications.data, filters]);

  // Calculate counts
  const counts = useMemo(() => {
    if (!notifications.data) return { total: 0, unread: 0 };
    return {
      total: notifications.data.length,
      unread: notifications.data.filter((n) => !n.read).length,
    };
  }, [notifications.data]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-sage-900">Notifications</h1>
          <p className="mt-1 text-sage-500">System alerts and important updates</p>
        </div>
        <button
          onClick={fetchNotifications}
          disabled={notifications.loading}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-sage-700 bg-white border border-sage-200 rounded-lg hover:bg-sage-50 transition-colors disabled:opacity-50"
        >
          <svg
            className={`w-4 h-4 ${notifications.loading ? 'animate-spin' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>

      {/* Stats */}
      {notifications.data && (
        <div className="flex items-center gap-6 text-sm">
          <span className="text-sage-500">
            <span className="font-medium text-sage-700">{counts.total}</span> total
          </span>
          {counts.unread > 0 && (
            <span className="inline-flex items-center gap-1.5 text-forest-600">
              <span className="w-2 h-2 rounded-full bg-forest-500" />
              <span className="font-medium">{counts.unread}</span> unread
            </span>
          )}
          {filteredNotifications.length !== counts.total && (
            <span className="text-sage-400">
              Showing {filteredNotifications.length} of {counts.total}
            </span>
          )}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl border border-sage-100 shadow-sm p-4">
        <div className="flex items-end gap-4 flex-wrap">
          <FilterSelect
            label="Category"
            value={filters.category}
            options={CATEGORIES}
            onChange={(value) => setFilters((prev) => ({ ...prev, category: value }))}
          />
          <FilterSelect
            label="Severity"
            value={filters.severity}
            options={SEVERITIES}
            onChange={(value) => setFilters((prev) => ({ ...prev, severity: value }))}
          />
          <FilterSelect
            label="Status"
            value={filters.readStatus}
            options={READ_STATUSES}
            onChange={(value) => setFilters((prev) => ({ ...prev, readStatus: value }))}
          />

          {/* Clear filters button */}
          {(filters.category !== 'all' ||
            filters.severity !== 'all' ||
            filters.readStatus !== 'all') && (
            <button
              onClick={() =>
                setFilters({ category: 'all', severity: 'all', readStatus: 'all' })
              }
              className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-sage-600 hover:text-sage-800 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Error state */}
      {notifications.error && (
        <div className="bg-coral-50 border border-coral-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-coral-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex-1">
              <p className="text-sm font-medium text-coral-800">Failed to load notifications</p>
              <p className="text-sm text-coral-600">{notifications.error}</p>
            </div>
            <button
              onClick={fetchNotifications}
              className="text-sm text-coral-700 hover:text-coral-900 font-medium"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Loading state */}
      {notifications.loading && (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-xl border border-sage-100 shadow-sm p-5"
            >
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="h-5 bg-sage-100 rounded w-48 animate-pulse" />
                  <div className="h-5 bg-sage-100 rounded w-16 animate-pulse" />
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-4 bg-sage-100 rounded w-20 animate-pulse" />
                  <div className="h-4 bg-sage-100 rounded w-16 animate-pulse" />
                  <div className="h-4 bg-sage-100 rounded w-12 animate-pulse" />
                </div>
                <div className="h-4 bg-sage-100 rounded w-full animate-pulse" />
                <div className="h-4 bg-sage-100 rounded w-3/4 animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Notifications list */}
      {!notifications.loading && notifications.data && (
        <>
          {filteredNotifications.length > 0 ? (
            <div className="space-y-4">
              {filteredNotifications.map((notification) => (
                <NotificationCard
                  key={notification.id}
                  notification={notification}
                  onMarkRead={handleMarkRead}
                  isMarkingRead={markingReadIds.has(notification.id)}
                />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-sage-100 shadow-sm px-6 py-12 text-center">
              <svg
                className="w-12 h-12 mx-auto mb-3 text-sage-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>
              <h3 className="text-sm font-medium text-sage-700 mb-1">No notifications found</h3>
              <p className="text-sm text-sage-500">
                {filters.category !== 'all' ||
                filters.severity !== 'all' ||
                filters.readStatus !== 'all'
                  ? 'Try adjusting your filters'
                  : 'You\'re all caught up!'}
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
