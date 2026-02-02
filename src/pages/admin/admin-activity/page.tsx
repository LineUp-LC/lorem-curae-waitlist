import { useState, useEffect, useCallback, useMemo } from 'react';

// Types for API response
interface AdminActivityEvent {
  id: string;
  admin_email: string;
  action: string;
  target: string | null;
  created_at: string;
  metadata: Record<string, unknown> | null;
}

interface AdminActivityResponse {
  events: AdminActivityEvent[];
}

// Filter state
interface FilterState {
  adminEmail: string;
  action: string;
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

// Get action badge color
function getActionColor(action: string): string {
  const actionLower = action.toLowerCase();
  if (actionLower.includes('delete') || actionLower.includes('remove')) {
    return 'bg-coral-50 text-coral-700 border-coral-200';
  }
  if (actionLower.includes('create') || actionLower.includes('add')) {
    return 'bg-forest-50 text-forest-700 border-forest-200';
  }
  if (actionLower.includes('update') || actionLower.includes('edit') || actionLower.includes('modify')) {
    return 'bg-cream-50 text-cream-700 border-cream-200';
  }
  return 'bg-sage-50 text-sage-700 border-sage-200';
}

export default function AdminActivityPage() {
  const [events, setEvents] = useState<AdminActivityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterState>({
    adminEmail: '',
    action: '',
  });
  const [appliedFilters, setAppliedFilters] = useState<FilterState>({
    adminEmail: '',
    action: '',
  });

  // Fetch admin activity events
  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const adminSecret = import.meta.env.VITE_ADMIN_SECRET;

      if (!adminSecret) {
        throw new Error('Admin credentials not configured');
      }

      const response = await fetch('/api/admin/admin-activity', {
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
        throw new Error(`Failed to fetch admin activity (${response.status})`);
      }

      const data: AdminActivityResponse = await response.json();
      setEvents(data.events || []);
    } catch (err) {
      console.error('[AdminActivity] Failed to fetch:', err);
      setError(err instanceof Error ? err.message : 'Failed to load admin activity');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // Filter events client-side
  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      const emailMatch =
        !appliedFilters.adminEmail ||
        event.admin_email.toLowerCase().includes(appliedFilters.adminEmail.toLowerCase());
      const actionMatch =
        !appliedFilters.action ||
        event.action.toLowerCase().includes(appliedFilters.action.toLowerCase());
      return emailMatch && actionMatch;
    });
  }, [events, appliedFilters]);

  // Handle apply filters
  const handleApplyFilters = () => {
    setAppliedFilters({ ...filters });
  };

  // Handle clear filters
  const handleClearFilters = () => {
    setFilters({ adminEmail: '', action: '' });
    setAppliedFilters({ adminEmail: '', action: '' });
  };

  // Check if filters are active
  const hasActiveFilters = appliedFilters.adminEmail || appliedFilters.action;

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-sage-900">Admin Activity Log</h1>
          <p className="mt-1 text-sage-500">
            Audit trail of administrative actions
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

      {/* Error banner */}
      {error && (
        <div className="bg-coral-50 border border-coral-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-coral-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex-1">
              <p className="text-sm font-medium text-coral-800">Failed to load admin activity</p>
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

      {/* Filters */}
      <div className="bg-white rounded-xl border border-sage-100 p-4">
        <div className="flex flex-wrap items-end gap-4">
          {/* Admin Email filter */}
          <div className="flex-1 min-w-[200px]">
            <label htmlFor="filter-email" className="block text-sm font-medium text-sage-700 mb-1.5">
              Admin Email
            </label>
            <input
              type="text"
              id="filter-email"
              value={filters.adminEmail}
              onChange={(e) => setFilters((prev) => ({ ...prev, adminEmail: e.target.value }))}
              placeholder="Filter by email..."
              className="w-full px-3 py-2 text-sm border border-sage-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sage-500 focus:border-transparent"
            />
          </div>

          {/* Action filter */}
          <div className="flex-1 min-w-[200px]">
            <label htmlFor="filter-action" className="block text-sm font-medium text-sage-700 mb-1.5">
              Action
            </label>
            <input
              type="text"
              id="filter-action"
              value={filters.action}
              onChange={(e) => setFilters((prev) => ({ ...prev, action: e.target.value }))}
              placeholder="Filter by action..."
              className="w-full px-3 py-2 text-sm border border-sage-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sage-500 focus:border-transparent"
            />
          </div>

          {/* Filter buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleApplyFilters}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-sage-800 rounded-lg hover:bg-sage-900 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              Apply Filters
            </button>
            {hasActiveFilters && (
              <button
                onClick={handleClearFilters}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-sage-600 bg-white border border-sage-200 rounded-lg hover:bg-sage-50 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Clear Filters
              </button>
            )}
          </div>
        </div>

        {/* Active filters indicator */}
        {hasActiveFilters && (
          <div className="mt-3 pt-3 border-t border-sage-100">
            <div className="flex items-center gap-2 text-sm text-sage-600">
              <span className="font-medium">Active filters:</span>
              {appliedFilters.adminEmail && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-sage-100 text-sage-700">
                  Email: {appliedFilters.adminEmail}
                </span>
              )}
              {appliedFilters.action && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-sage-100 text-sage-700">
                  Action: {appliedFilters.action}
                </span>
              )}
              <span className="text-sage-400">
                ({filteredEvents.length} of {events.length} events)
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Events table */}
      <div className="bg-white rounded-xl border border-sage-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-sage-100">
          <h2 className="text-lg font-medium text-sage-800">Activity Events</h2>
          <p className="text-sm text-sage-500 mt-0.5">
            {loading ? 'Loading...' : `${filteredEvents.length} event${filteredEvents.length !== 1 ? 's' : ''}`}
          </p>
        </div>

        {loading ? (
          <div className="p-6">
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="h-4 bg-sage-100 rounded w-40 animate-pulse" />
                  <div className="h-4 bg-sage-100 rounded w-24 animate-pulse" />
                  <div className="h-4 bg-sage-100 rounded w-32 animate-pulse" />
                  <div className="h-4 bg-sage-100 rounded w-36 animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="p-12 text-center">
            <svg className="w-12 h-12 mx-auto mb-4 text-sage-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
            {hasActiveFilters ? (
              <>
                <p className="text-sage-600 font-medium">No matching events</p>
                <p className="text-sm text-sage-500 mt-1">Try adjusting your filters</p>
              </>
            ) : (
              <>
                <p className="text-sage-600 font-medium">No activity events</p>
                <p className="text-sm text-sage-500 mt-1">Admin actions will appear here</p>
              </>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-sage-50/50">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-sage-600 uppercase tracking-wider">
                    Admin Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-sage-600 uppercase tracking-wider">
                    Action
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-sage-600 uppercase tracking-wider">
                    Target
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-sage-600 uppercase tracking-wider">
                    Created At
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-sage-600 uppercase tracking-wider">
                    Metadata
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sage-100">
                {filteredEvents.map((event, index) => (
                  <tr
                    key={event.id}
                    className={`${
                      index % 2 === 0 ? 'bg-white' : 'bg-sage-50/30'
                    } hover:bg-sage-50 transition-colors`}
                  >
                    {/* Admin Email */}
                    <td className="px-6 py-4">
                      <span className="text-sm text-sage-800">{event.admin_email}</span>
                    </td>

                    {/* Action */}
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getActionColor(
                          event.action
                        )}`}
                      >
                        {event.action}
                      </span>
                    </td>

                    {/* Target */}
                    <td className="px-6 py-4">
                      {event.target ? (
                        <span className="font-mono text-sm text-sage-700 break-all">
                          {event.target}
                        </span>
                      ) : (
                        <span className="text-xs text-sage-400 italic">None</span>
                      )}
                    </td>

                    {/* Created At */}
                    <td className="px-6 py-4">
                      <span className="text-sm text-sage-600">
                        {formatTimestamp(event.created_at)}
                      </span>
                    </td>

                    {/* Metadata */}
                    <td className="px-6 py-4">
                      {event.metadata ? (
                        <pre className="text-xs font-mono text-sage-600 bg-sage-50 rounded px-2 py-1 max-w-xs overflow-auto whitespace-pre-wrap">
                          {JSON.stringify(event.metadata, null, 2)}
                        </pre>
                      ) : (
                        <span className="text-xs text-sage-400 italic">None</span>
                      )}
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
        Showing {filteredEvents.length} of {events.length} total events
      </div>
    </div>
  );
}
