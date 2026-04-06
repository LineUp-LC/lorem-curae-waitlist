import { useState, useEffect, useCallback } from 'react';

// ============================================================================
// Types
// ============================================================================

interface IncidentSummary {
  id: string;
  title: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'investigating' | 'resolved';
  started_at: string;
  resolved_at: string | null;
}

interface EmailFailure {
  id: string;
  email: string;
  template: string;
  status: string;
  created_at: string;
}

interface RateLimitSpike {
  key: string;
  count: number;
  limit: number;
  occurred_at: string;
}

interface HealthChange {
  check: string;
  previous_status: string;
  new_status: string;
  changed_at: string;
}

interface AdminAction {
  id: string;
  admin_email: string;
  action: string;
  target: string | null;
  created_at: string;
}

interface IncidentDetail {
  id: string;
  title: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'investigating' | 'resolved';
  started_at: string;
  resolved_at: string | null;
  summary: string;
  related_events: {
    email_failures: EmailFailure[];
    rate_limit_spikes: RateLimitSpike[];
    health_changes: HealthChange[];
    admin_actions: AdminAction[];
  };
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
    hour12: true,
  });
}

function formatShortTimestamp(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

function formatStatus(status: string): string {
  return status
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function truncateEmail(email: string, maxLen = 25): string {
  if (email.length <= maxLen) return email;
  return email.substring(0, maxLen - 3) + '...';
}

// ============================================================================
// Badge Components
// ============================================================================

function SeverityBadge({ severity }: { severity: IncidentSummary['severity'] }) {
  const getStyles = () => {
    switch (severity) {
      case 'low':
        return 'bg-forest-50 text-forest-700 border-forest-200';
      case 'medium':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'high':
        return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'critical':
        return 'bg-coral-50 text-coral-700 border-coral-200';
      default:
        return 'bg-sage-100 text-sage-700 border-sage-200';
    }
  };

  const getDotColor = () => {
    switch (severity) {
      case 'low':
        return 'bg-forest-500';
      case 'medium':
        return 'bg-amber-500';
      case 'high':
        return 'bg-orange-500';
      case 'critical':
        return 'bg-coral-500';
      default:
        return 'bg-sage-500';
    }
  };

  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border ${getStyles()}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${getDotColor()}`} />
      {formatStatus(severity)}
    </span>
  );
}

function StatusBadge({ status }: { status: IncidentSummary['status'] }) {
  const getStyles = () => {
    switch (status) {
      case 'open':
        return 'bg-coral-50 text-coral-700 border-coral-200';
      case 'investigating':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'resolved':
        return 'bg-forest-50 text-forest-700 border-forest-200';
      default:
        return 'bg-sage-100 text-sage-700 border-sage-200';
    }
  };

  const getIcon = () => {
    switch (status) {
      case 'open':
        return (
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        );
      case 'investigating':
        return (
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
          </svg>
        );
      case 'resolved':
        return (
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${getStyles()}`}>
      {getIcon()}
      {formatStatus(status)}
    </span>
  );
}

function HealthStatusBadge({ status }: { status: string }) {
  const s = status.toLowerCase();
  const isHealthy = s === 'healthy' || s === 'ok' || s === 'up';
  const isDegraded = s === 'degraded' || s === 'warning';

  const getStyles = () => {
    if (isHealthy) return 'bg-forest-50 text-forest-700';
    if (isDegraded) return 'bg-amber-50 text-amber-700';
    return 'bg-coral-50 text-coral-700';
  };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getStyles()}`}>
      {formatStatus(status)}
    </span>
  );
}

// ============================================================================
// Section Components
// ============================================================================

function DetailSection({
  title,
  children,
  isEmpty,
  emptyMessage,
}: {
  title: string;
  children: React.ReactNode;
  isEmpty?: boolean;
  emptyMessage?: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-sage-100 overflow-hidden">
      <div className="px-5 py-3 border-b border-sage-100 bg-sage-50/50">
        <h3 className="text-sm font-semibold text-sage-700">{title}</h3>
      </div>
      {isEmpty ? (
        <div className="px-5 py-8 text-center">
          <p className="text-sm text-sage-400">{emptyMessage || 'No data'}</p>
        </div>
      ) : (
        children
      )}
    </div>
  );
}

// ============================================================================
// Incident List Item Component
// ============================================================================

function IncidentListItem({
  incident,
  isSelected,
  onClick,
}: {
  incident: IncidentSummary;
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-4 py-3 border-b border-sage-100 transition-colors ${
        isSelected
          ? 'bg-forest-50 border-l-2 border-l-forest-500'
          : 'hover:bg-sage-50 border-l-2 border-l-transparent'
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className={`text-sm font-medium ${isSelected ? 'text-forest-800' : 'text-sage-800'} line-clamp-2`}>
          {incident.title}
        </h3>
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <SeverityBadge severity={incident.severity} />
        <StatusBadge status={incident.status} />
      </div>
      <p className="text-xs text-sage-500 mt-2">
        {formatShortTimestamp(incident.started_at)}
      </p>
    </button>
  );
}

// ============================================================================
// Incident Detail Panel Component
// ============================================================================

function IncidentDetailPanel({
  incidentId,
  getAuthHeaders,
}: {
  incidentId: string | null;
  getAuthHeaders: () => Record<string, string>;
}) {
  const [detail, setDetail] = useState<FetchState<IncidentDetail>>({
    data: null,
    loading: false,
    error: null,
  });

  const fetchDetail = useCallback(async () => {
    if (!incidentId) return;

    setDetail({ data: null, loading: true, error: null });

    try {
      const res = await fetch(
        `/api/admin/incident?id=${encodeURIComponent(incidentId)}`,
        { headers: getAuthHeaders() }
      );

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      setDetail({ data, loading: false, error: null });
    } catch (err) {
      setDetail({
        data: null,
        loading: false,
        error: err instanceof Error ? err.message : 'Unknown error',
      });
    }
  }, [incidentId, getAuthHeaders]);

  useEffect(() => {
    if (incidentId) {
      fetchDetail();
    } else {
      setDetail({ data: null, loading: false, error: null });
    }
  }, [incidentId, fetchDetail]);

  // No incident selected
  if (!incidentId) {
    return (
      <div className="flex-1 flex items-center justify-center bg-sage-50/50 rounded-xl border border-sage-100">
        <div className="text-center px-6 py-12">
          <svg className="w-16 h-16 mx-auto mb-4 text-sage-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
          <h3 className="text-lg font-medium text-sage-700 mb-1">Select an incident</h3>
          <p className="text-sm text-sage-500">Choose an incident from the list to view details</p>
        </div>
      </div>
    );
  }

  // Loading state
  if (detail.loading) {
    return (
      <div className="flex-1 bg-white rounded-xl border border-sage-100 overflow-hidden">
        <div className="p-6 space-y-6">
          {/* Header skeleton */}
          <div className="space-y-3">
            <div className="h-6 bg-sage-100 rounded w-3/4 animate-pulse" />
            <div className="flex gap-2">
              <div className="h-6 bg-sage-100 rounded w-20 animate-pulse" />
              <div className="h-6 bg-sage-100 rounded w-24 animate-pulse" />
            </div>
          </div>

          {/* Summary skeleton */}
          <div className="space-y-2">
            <div className="h-4 bg-sage-100 rounded w-full animate-pulse" />
            <div className="h-4 bg-sage-100 rounded w-5/6 animate-pulse" />
            <div className="h-4 bg-sage-100 rounded w-4/6 animate-pulse" />
          </div>

          {/* Tables skeleton */}
          {[1, 2].map((i) => (
            <div key={i} className="space-y-2">
              <div className="h-5 bg-sage-100 rounded w-32 animate-pulse" />
              <div className="h-24 bg-sage-100 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (detail.error) {
    return (
      <div className="flex-1 bg-white rounded-xl border border-sage-100 overflow-hidden">
        <div className="p-6">
          <div className="flex items-center gap-3 text-coral-600 bg-coral-50 border border-coral-200 rounded-lg px-4 py-3">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="text-sm font-medium">Failed to load incident details</p>
              <p className="text-xs text-coral-500 mt-0.5">{detail.error}</p>
            </div>
            <button
              onClick={fetchDetail}
              className="ml-auto text-sm font-medium text-coral-700 hover:text-coral-900"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!detail.data) return null;

  const { related_events } = detail.data;

  return (
    <div className="flex-1 bg-white rounded-xl border border-sage-100 overflow-hidden flex flex-col">
      {/* Header */}
      <div className="px-6 py-5 border-b border-sage-100">
        <h2 className="text-xl font-semibold text-sage-900 mb-3">{detail.data.title}</h2>
        <div className="flex items-center gap-3 flex-wrap">
          <SeverityBadge severity={detail.data.severity} />
          <StatusBadge status={detail.data.status} />
          <span className="text-sm text-sage-500">
            Started: {formatTimestamp(detail.data.started_at)}
          </span>
          {detail.data.resolved_at ? (
            <span className="text-sm text-forest-600">
              Resolved: {formatTimestamp(detail.data.resolved_at)}
            </span>
          ) : (
            <span className="text-sm text-coral-600 font-medium">Unresolved</span>
          )}
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Summary */}
        <div>
          <h3 className="text-sm font-semibold text-sage-700 mb-2">Summary</h3>
          <div className="bg-sage-50 rounded-lg p-4 border border-sage-100">
            <p className="text-sm text-sage-700 whitespace-pre-wrap">{detail.data.summary}</p>
          </div>
        </div>

        {/* Email Failures */}
        <DetailSection
          title={`Email Failures (${related_events.email_failures.length})`}
          isEmpty={related_events.email_failures.length === 0}
          emptyMessage="No email failures related to this incident"
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-sage-50/50">
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-sage-600 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-sage-600 uppercase tracking-wider">
                    Template
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-sage-600 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-sage-600 uppercase tracking-wider">
                    Time
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sage-50">
                {related_events.email_failures.map((failure, idx) => (
                  <tr
                    key={failure.id}
                    className={`${idx % 2 === 0 ? 'bg-white' : 'bg-sage-50/30'}`}
                  >
                    <td className="px-4 py-2.5 text-sm font-mono text-sage-700" title={failure.email}>
                      {truncateEmail(failure.email)}
                    </td>
                    <td className="px-4 py-2.5 text-sm text-sage-700">
                      {formatStatus(failure.template)}
                    </td>
                    <td className="px-4 py-2.5">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-coral-50 text-coral-700">
                        {formatStatus(failure.status)}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-sm text-sage-500 whitespace-nowrap">
                      {formatShortTimestamp(failure.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </DetailSection>

        {/* Rate Limit Spikes */}
        <DetailSection
          title={`Rate Limit Spikes (${related_events.rate_limit_spikes.length})`}
          isEmpty={related_events.rate_limit_spikes.length === 0}
          emptyMessage="No rate limit spikes related to this incident"
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-sage-50/50">
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-sage-600 uppercase tracking-wider">
                    Key
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-sage-600 uppercase tracking-wider">
                    Usage
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-sage-600 uppercase tracking-wider">
                    Time
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sage-50">
                {related_events.rate_limit_spikes.map((spike, idx) => {
                  const usagePercent = (spike.count / spike.limit) * 100;
                  const isOverLimit = spike.count >= spike.limit;

                  return (
                    <tr
                      key={`${spike.key}-${idx}`}
                      className={`${idx % 2 === 0 ? 'bg-white' : 'bg-sage-50/30'}`}
                    >
                      <td className="px-4 py-2.5 text-sm font-mono text-sage-700">
                        {spike.key}
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-2 bg-sage-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${isOverLimit ? 'bg-coral-500' : 'bg-amber-500'}`}
                              style={{ width: `${Math.min(usagePercent, 100)}%` }}
                            />
                          </div>
                          <span className={`text-sm font-medium ${isOverLimit ? 'text-coral-600' : 'text-amber-600'}`}>
                            {spike.count} / {spike.limit}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-sm text-sage-500 whitespace-nowrap">
                        {formatShortTimestamp(spike.occurred_at)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </DetailSection>

        {/* Health Changes */}
        <DetailSection
          title={`Health Changes (${related_events.health_changes.length})`}
          isEmpty={related_events.health_changes.length === 0}
          emptyMessage="No health changes related to this incident"
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-sage-50/50">
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-sage-600 uppercase tracking-wider">
                    Check
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-sage-600 uppercase tracking-wider">
                    Status Change
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-sage-600 uppercase tracking-wider">
                    Time
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sage-50">
                {related_events.health_changes.map((change, idx) => (
                  <tr
                    key={`${change.check}-${idx}`}
                    className={`${idx % 2 === 0 ? 'bg-white' : 'bg-sage-50/30'}`}
                  >
                    <td className="px-4 py-2.5 text-sm font-medium text-sage-700">
                      {formatStatus(change.check)}
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <HealthStatusBadge status={change.previous_status} />
                        <svg className="w-4 h-4 text-sage-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                        <HealthStatusBadge status={change.new_status} />
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-sm text-sage-500 whitespace-nowrap">
                      {formatShortTimestamp(change.changed_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </DetailSection>

        {/* Admin Actions */}
        <DetailSection
          title={`Admin Actions (${related_events.admin_actions.length})`}
          isEmpty={related_events.admin_actions.length === 0}
          emptyMessage="No admin actions related to this incident"
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-sage-50/50">
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-sage-600 uppercase tracking-wider">
                    Admin
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-sage-600 uppercase tracking-wider">
                    Action
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-sage-600 uppercase tracking-wider">
                    Target
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-sage-600 uppercase tracking-wider">
                    Time
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sage-50">
                {related_events.admin_actions.map((action, idx) => (
                  <tr
                    key={action.id}
                    className={`${idx % 2 === 0 ? 'bg-white' : 'bg-sage-50/30'}`}
                  >
                    <td className="px-4 py-2.5 text-sm font-mono text-sage-700" title={action.admin_email}>
                      {truncateEmail(action.admin_email)}
                    </td>
                    <td className="px-4 py-2.5">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-50 text-purple-700">
                        {formatStatus(action.action)}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-sm text-sage-600">
                      {action.target || <span className="text-sage-400">—</span>}
                    </td>
                    <td className="px-4 py-2.5 text-sm text-sage-500 whitespace-nowrap">
                      {formatShortTimestamp(action.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </DetailSection>
      </div>
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export default function IncidentsPage() {
  const [incidents, setIncidents] = useState<FetchState<IncidentSummary[]>>({
    data: null,
    loading: true,
    error: null,
  });
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const getAuthHeaders = useCallback(() => {
    const adminSecret = import.meta.env.VITE_ADMIN_SECRET;
    return {
      Authorization: `Bearer ${adminSecret}`,
      'Content-Type': 'application/json',
    };
  }, []);

  const fetchIncidents = useCallback(async () => {
    setIncidents((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const res = await fetch('/api/admin/incidents', { headers: getAuthHeaders() });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      setIncidents({ data: data.incidents || [], loading: false, error: null });

      // Auto-select first incident if none selected
      if (data.incidents?.length > 0 && !selectedId) {
        setSelectedId(data.incidents[0].id);
      }
    } catch (err) {
      setIncidents({
        data: null,
        loading: false,
        error: err instanceof Error ? err.message : 'Unknown error',
      });
    }
  }, [getAuthHeaders, selectedId]);

  useEffect(() => {
    fetchIncidents();
  }, [fetchIncidents]);

  // Count by status for summary
  const statusCounts = incidents.data?.reduce(
    (acc, inc) => {
      acc[inc.status] = (acc[inc.status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  ) || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-sage-900">Incidents</h1>
          <p className="mt-1 text-sage-500">Review and understand operational issues</p>
        </div>
        <button
          onClick={fetchIncidents}
          disabled={incidents.loading}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-sage-700 bg-white border border-sage-200 rounded-lg hover:bg-sage-50 transition-colors disabled:opacity-50"
        >
          <svg
            className={`w-4 h-4 ${incidents.loading ? 'animate-spin' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>

      {/* Status summary */}
      {incidents.data && incidents.data.length > 0 && (
        <div className="flex items-center gap-6 text-sm">
          <span className="text-sage-500">
            <span className="font-medium text-sage-700">{incidents.data.length}</span> total incidents
          </span>
          {statusCounts.open > 0 && (
            <span className="inline-flex items-center gap-1.5 text-coral-600">
              <span className="w-2 h-2 rounded-full bg-coral-500" />
              {statusCounts.open} open
            </span>
          )}
          {statusCounts.investigating > 0 && (
            <span className="inline-flex items-center gap-1.5 text-amber-600">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              {statusCounts.investigating} investigating
            </span>
          )}
          {statusCounts.resolved > 0 && (
            <span className="inline-flex items-center gap-1.5 text-forest-600">
              <span className="w-2 h-2 rounded-full bg-forest-500" />
              {statusCounts.resolved} resolved
            </span>
          )}
        </div>
      )}

      {/* Error state */}
      {incidents.error && (
        <div className="bg-coral-50 border border-coral-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-coral-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex-1">
              <p className="text-sm font-medium text-coral-800">Failed to load incidents</p>
              <p className="text-sm text-coral-600">{incidents.error}</p>
            </div>
            <button
              onClick={fetchIncidents}
              className="text-sm text-coral-700 hover:text-coral-900 font-medium"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Main layout */}
      <div className="flex gap-6 h-[calc(100vh-280px)] min-h-[500px]">
        {/* Sidebar - Incident List */}
        <div className="w-80 flex-shrink-0 bg-white rounded-xl border border-sage-100 overflow-hidden flex flex-col">
          <div className="px-4 py-3 border-b border-sage-100 bg-sage-50/50">
            <h2 className="text-sm font-semibold text-sage-700">Incident List</h2>
          </div>

          <div className="flex-1 overflow-y-auto">
            {incidents.loading ? (
              <div className="p-4 space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="space-y-2">
                    <div className="h-4 bg-sage-100 rounded w-3/4 animate-pulse" />
                    <div className="flex gap-2">
                      <div className="h-5 bg-sage-100 rounded w-16 animate-pulse" />
                      <div className="h-5 bg-sage-100 rounded w-20 animate-pulse" />
                    </div>
                    <div className="h-3 bg-sage-100 rounded w-24 animate-pulse" />
                  </div>
                ))}
              </div>
            ) : incidents.data && incidents.data.length > 0 ? (
              <div>
                {incidents.data.map((incident) => (
                  <IncidentListItem
                    key={incident.id}
                    incident={incident}
                    isSelected={selectedId === incident.id}
                    onClick={() => setSelectedId(incident.id)}
                  />
                ))}
              </div>
            ) : !incidents.error ? (
              <div className="flex flex-col items-center justify-center h-full px-4 py-12 text-center">
                <svg className="w-12 h-12 mb-3 text-sage-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="text-sm font-medium text-sage-700 mb-1">No incidents recorded</h3>
                <p className="text-xs text-sage-500">All systems are operating normally</p>
              </div>
            ) : null}
          </div>
        </div>

        {/* Main Panel - Incident Detail */}
        <IncidentDetailPanel
          incidentId={selectedId}
          getAuthHeaders={getAuthHeaders}
        />
      </div>
    </div>
  );
}
