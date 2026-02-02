import { useState, useEffect, useCallback } from 'react';

// Types for API response
interface EmailEvent {
  id: string;
  email: string;
  template: string;
  status: 'sent' | 'bounced' | 'failed';
  created_at: string;
  metadata: Record<string, unknown> | null;
}

interface EmailEventsResponse {
  events: EmailEvent[];
}

// Filter state
interface FilterState {
  email: string;
  template: string;
  status: '' | 'sent' | 'bounced' | 'failed';
}

// Resend state per event
interface ResendState {
  loading: boolean;
  success: boolean;
  error: string | null;
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
    hour12: true,
  });
}

// Get status badge styles
function getStatusBadgeStyles(status: EmailEvent['status']): string {
  switch (status) {
    case 'sent':
      return 'bg-forest-50 text-forest-700 border-forest-200';
    case 'bounced':
      return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'failed':
      return 'bg-coral-50 text-coral-700 border-coral-200';
    default:
      return 'bg-sage-50 text-sage-700 border-sage-200';
  }
}

// Status badge component
function StatusBadge({ status }: { status: EmailEvent['status'] }) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border capitalize ${getStatusBadgeStyles(status)}`}
    >
      {status}
    </span>
  );
}

// Event row component
function EventRow({
  event,
  resendState,
  onResend,
  isAlternate,
}: {
  event: EmailEvent;
  resendState: ResendState | undefined;
  onResend: (eventId: string) => void;
  isAlternate?: boolean;
}) {
  const isLoading = resendState?.loading ?? false;
  const isSuccess = resendState?.success ?? false;
  const hasError = resendState?.error ?? null;

  const bgClass = isSuccess
    ? 'bg-forest-50/30'
    : isAlternate
      ? 'bg-sage-50/30'
      : '';

  return (
    <tr className={`hover:bg-sage-50/50 transition-colors ${bgClass}`}>
      {/* Email */}
      <td className="px-6 py-4">
        <span className="text-sm font-medium text-sage-800">{event.email}</span>
      </td>

      {/* Template */}
      <td className="px-6 py-4">
        <span className="text-sm font-mono text-sage-600">{event.template}</span>
      </td>

      {/* Status */}
      <td className="px-6 py-4">
        <StatusBadge status={event.status} />
      </td>

      {/* Created At */}
      <td className="px-6 py-4 text-sm text-sage-500 whitespace-nowrap">
        {formatTimestamp(event.created_at)}
      </td>

      {/* Metadata */}
      <td className="px-6 py-4">
        {event.metadata ? (
          <pre className="text-xs font-mono bg-sage-50 text-sage-600 p-2 rounded-lg max-w-xs overflow-auto max-h-20">
            {JSON.stringify(event.metadata, null, 2)}
          </pre>
        ) : (
          <span className="text-xs text-sage-400 italic">No metadata</span>
        )}
      </td>

      {/* Actions */}
      <td className="px-6 py-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => onResend(event.id)}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-sage-100 text-sage-700 hover:bg-sage-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <svg className="w-3.5 h-3.5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Sending...
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Resend
              </>
            )}
          </button>

          {isSuccess && (
            <span className="text-xs text-forest-600 flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Sent!
            </span>
          )}

          {hasError && (
            <span className="text-xs text-coral-600" title={hasError}>
              Error
            </span>
          )}
        </div>
      </td>
    </tr>
  );
}

export default function EmailEventsPage() {
  const [events, setEvents] = useState<EmailEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter state
  const [filters, setFilters] = useState<FilterState>({
    email: '',
    template: '',
    status: '',
  });
  const [appliedFilters, setAppliedFilters] = useState<FilterState>({
    email: '',
    template: '',
    status: '',
  });

  // Resend states per event
  const [resendStates, setResendStates] = useState<Record<string, ResendState>>({});

  // Fetch events
  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const adminSecret = import.meta.env.VITE_ADMIN_SECRET;

      if (!adminSecret) {
        throw new Error('Admin credentials not configured');
      }

      const response = await fetch('/api/admin/email-events', {
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
        throw new Error(`Failed to fetch email events (${response.status})`);
      }

      const data: EmailEventsResponse = await response.json();
      setEvents(data.events || []);
    } catch (err) {
      console.error('[EmailEvents] Failed to fetch:', err);
      setError(err instanceof Error ? err.message : 'Failed to load email events');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // Apply filters
  const handleApplyFilters = () => {
    setAppliedFilters({ ...filters });
  };

  // Clear filters
  const handleClearFilters = () => {
    const cleared: FilterState = { email: '', template: '', status: '' };
    setFilters(cleared);
    setAppliedFilters(cleared);
  };

  // Filter events client-side
  const filteredEvents = events.filter((event) => {
    if (appliedFilters.email && !event.email.toLowerCase().includes(appliedFilters.email.toLowerCase())) {
      return false;
    }
    if (appliedFilters.template && !event.template.toLowerCase().includes(appliedFilters.template.toLowerCase())) {
      return false;
    }
    if (appliedFilters.status && event.status !== appliedFilters.status) {
      return false;
    }
    return true;
  });

  // Handle resend
  const handleResend = async (eventId: string) => {
    // Set loading state
    setResendStates((prev) => ({
      ...prev,
      [eventId]: { loading: true, success: false, error: null },
    }));

    try {
      const adminSecret = import.meta.env.VITE_ADMIN_SECRET;

      if (!adminSecret) {
        throw new Error('Admin credentials not configured');
      }

      const response = await fetch('/api/admin/resend-email', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${adminSecret}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ event_id: eventId }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to resend email (${response.status})`);
      }

      // Set success state
      setResendStates((prev) => ({
        ...prev,
        [eventId]: { loading: false, success: true, error: null },
      }));

      // Clear success after 3 seconds
      setTimeout(() => {
        setResendStates((prev) => ({
          ...prev,
          [eventId]: { ...prev[eventId], success: false },
        }));
      }, 3000);
    } catch (err) {
      console.error('[EmailEvents] Failed to resend:', err);
      setResendStates((prev) => ({
        ...prev,
        [eventId]: {
          loading: false,
          success: false,
          error: err instanceof Error ? err.message : 'Resend failed',
        },
      }));
    }
  };

  // Check if filters are active
  const hasActiveFilters = appliedFilters.email || appliedFilters.template || appliedFilters.status;

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-sage-900">Email Events</h1>
          <p className="mt-1 text-sage-500">
            Inspect and debug email delivery
          </p>
        </div>
        <button
          onClick={fetchEvents}
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

      {/* Filters */}
      <div className="bg-white rounded-xl border border-sage-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-sage-100 bg-sage-50/50">
          <h2 className="text-lg font-medium text-sage-800">Filters</h2>
          <p className="text-sm text-sage-500 mt-0.5">
            Filter events by email, template, or status
          </p>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Email filter */}
            <div className="space-y-1.5">
              <label htmlFor="filter-email" className="block text-sm font-medium text-sage-700">
                Email
              </label>
              <input
                type="text"
                id="filter-email"
                value={filters.email}
                onChange={(e) => setFilters((prev) => ({ ...prev, email: e.target.value }))}
                placeholder="Search by email..."
                className="w-full px-3 py-2 text-sm border border-sage-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sage-500 focus:border-transparent"
              />
            </div>

            {/* Template filter */}
            <div className="space-y-1.5">
              <label htmlFor="filter-template" className="block text-sm font-medium text-sage-700">
                Template
              </label>
              <input
                type="text"
                id="filter-template"
                value={filters.template}
                onChange={(e) => setFilters((prev) => ({ ...prev, template: e.target.value }))}
                placeholder="Search by template..."
                className="w-full px-3 py-2 text-sm border border-sage-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sage-500 focus:border-transparent"
              />
            </div>

            {/* Status filter */}
            <div className="space-y-1.5">
              <label htmlFor="filter-status" className="block text-sm font-medium text-sage-700">
                Status
              </label>
              <select
                id="filter-status"
                value={filters.status}
                onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value as FilterState['status'] }))}
                className="w-full px-3 py-2 text-sm border border-sage-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sage-500 focus:border-transparent bg-white"
              >
                <option value="">All Statuses</option>
                <option value="sent">Sent</option>
                <option value="bounced">Bounced</option>
                <option value="failed">Failed</option>
              </select>
            </div>

            {/* Action buttons */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-sage-700 opacity-0 select-none">
                Actions
              </label>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleApplyFilters}
                  className="flex-1 px-4 py-2 text-sm font-medium text-white bg-sage-800 rounded-lg hover:bg-sage-900 transition-colors"
                >
                  Apply Filters
                </button>
                {hasActiveFilters && (
                  <button
                    onClick={handleClearFilters}
                    className="px-3 py-2 text-sm font-medium text-sage-600 bg-sage-100 rounded-lg hover:bg-sage-200 transition-colors"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Active filters indicator */}
          {hasActiveFilters && (
            <div className="mt-4 pt-4 border-t border-sage-100">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-medium text-sage-500 uppercase tracking-wider">Active filters:</span>
                {appliedFilters.email && (
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-sage-100 text-sage-700">
                    Email: {appliedFilters.email}
                  </span>
                )}
                {appliedFilters.template && (
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-sage-100 text-sage-700">
                    Template: {appliedFilters.template}
                  </span>
                )}
                {appliedFilters.status && (
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-sage-100 text-sage-700 capitalize">
                    Status: {appliedFilters.status}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="bg-coral-50 border border-coral-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-coral-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex-1">
              <p className="text-sm font-medium text-coral-800">Failed to load email events</p>
              <p className="text-sm text-coral-600">{error}</p>
            </div>
            <button
              onClick={fetchEvents}
              className="text-sm text-coral-700 hover:text-coral-900 font-medium"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Events table */}
      <div className="bg-white rounded-xl border border-sage-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-sage-100">
          <h2 className="text-lg font-medium text-sage-800">Email Events</h2>
          <p className="text-sm text-sage-500 mt-0.5">
            {loading
              ? 'Loading events...'
              : `${filteredEvents.length} event${filteredEvents.length !== 1 ? 's' : ''}${hasActiveFilters ? ' (filtered)' : ''}`}
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-sage-50/50">
                <th className="px-6 py-3 text-left text-xs font-semibold text-sage-600 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-sage-600 uppercase tracking-wider">
                  Template
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-sage-600 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-sage-600 uppercase tracking-wider">
                  Created At
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-sage-600 uppercase tracking-wider">
                  Metadata
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-sage-600 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sage-50">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className={i % 2 === 1 ? 'bg-sage-25' : ''}>
                    <td className="px-6 py-4">
                      <div className="h-4 bg-sage-100 rounded w-48 animate-pulse" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-4 bg-sage-100 rounded w-32 animate-pulse" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-5 bg-sage-100 rounded w-16 animate-pulse" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-4 bg-sage-100 rounded w-36 animate-pulse" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-12 bg-sage-100 rounded w-32 animate-pulse" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-7 bg-sage-100 rounded w-20 animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : filteredEvents.length > 0 ? (
                filteredEvents.map((event, index) => (
                  <EventRow
                    key={event.id}
                    event={event}
                    resendState={resendStates[event.id]}
                    onResend={handleResend}
                    isAlternate={index % 2 === 1}
                  />
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <svg className="w-12 h-12 mx-auto mb-3 text-sage-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <p className="text-sm text-sage-500">
                      {hasActiveFilters ? 'No events match the current filters' : 'No email events found'}
                    </p>
                    {hasActiveFilters && (
                      <button
                        onClick={handleClearFilters}
                        className="mt-2 text-sm text-sage-600 hover:text-sage-800 font-medium"
                      >
                        Clear filters
                      </button>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
