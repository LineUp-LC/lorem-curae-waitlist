import { useState, useEffect, useCallback } from 'react';

// Types for API response
interface DatabaseHealth {
  ok: boolean;
  latency_ms: number;
}

interface EmailHealth {
  ok: boolean;
  provider: string;
  last_bounce_check: string;
}

interface MagicLinkHealth {
  ok: boolean;
  last_token_created: string;
}

interface FeatureFlagHealth {
  ok: boolean;
  missing_flags: string[];
  invalid_type_flags: Array<{ key: string; expected: string; actual: string }>;
  unexpected_flags: string[];
}

interface HealthCheckResponse {
  database: DatabaseHealth;
  email: EmailHealth;
  magic_link: MagicLinkHealth;
  feature_flags: FeatureFlagHealth;
  timestamp: string;
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

// Status badge component
function StatusBadge({ ok }: { ok: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
        ok
          ? 'bg-forest-50 text-forest-700'
          : 'bg-coral-50 text-coral-700'
      }`}
    >
      <span
        className={`w-2 h-2 rounded-full ${
          ok ? 'bg-forest-500' : 'bg-coral-500'
        }`}
      />
      {ok ? 'Healthy' : 'Unhealthy'}
    </span>
  );
}

// Status card component
function StatusCard({
  title,
  description,
  ok,
  isLoading,
}: {
  title: string;
  description: string;
  ok: boolean | undefined;
  isLoading: boolean;
}) {
  return (
    <div
      className={`bg-white rounded-xl border-2 p-6 transition-colors ${
        isLoading
          ? 'border-sage-100'
          : ok
          ? 'border-forest-200'
          : 'border-coral-200'
      }`}
    >
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-sm font-medium text-sage-800">{title}</h3>
          <p className="text-xs text-sage-500 mt-0.5">{description}</p>
        </div>
        {isLoading ? (
          <div className="h-6 w-20 bg-sage-100 rounded-full animate-pulse" />
        ) : (
          <StatusBadge ok={ok ?? false} />
        )}
      </div>
      {!isLoading && (
        <div className="mt-4">
          <div
            className={`w-full h-1.5 rounded-full ${
              ok ? 'bg-forest-200' : 'bg-coral-200'
            }`}
          >
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                ok ? 'bg-forest-500 w-full' : 'bg-coral-500 w-1/3'
              }`}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default function HealthChecksPage() {
  const [health, setHealth] = useState<HealthCheckResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHealth = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const adminSecret = import.meta.env.VITE_ADMIN_SECRET;

      if (!adminSecret) {
        throw new Error('Admin credentials not configured');
      }

      const response = await fetch('/api/admin/health-checks', {
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
        throw new Error(`Failed to fetch health checks (${response.status})`);
      }

      const data: HealthCheckResponse = await response.json();
      setHealth(data);
    } catch (err) {
      console.error('[HealthChecks] Failed to fetch:', err);
      setError(err instanceof Error ? err.message : 'Failed to load health checks');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHealth();
  }, [fetchHealth]);

  // Calculate overall health
  const overallHealth = health
    ? health.database.ok &&
      health.email.ok &&
      health.magic_link.ok &&
      health.feature_flags.ok
    : undefined;

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-sage-900">System Health Checks</h1>
          <p className="mt-1 text-sage-500">
            Live status of core platform services
          </p>
        </div>
        <button
          onClick={fetchHealth}
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

      {/* Overall status banner */}
      {!loading && health && (
        <div
          className={`rounded-lg p-4 ${
            overallHealth
              ? 'bg-forest-50 border border-forest-200'
              : 'bg-coral-50 border border-coral-200'
          }`}
        >
          <div className="flex items-center gap-3">
            {overallHealth ? (
              <svg className="w-6 h-6 text-forest-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : (
              <svg className="w-6 h-6 text-coral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
            <div>
              <p className={`text-sm font-medium ${overallHealth ? 'text-forest-800' : 'text-coral-800'}`}>
                {overallHealth ? 'All Systems Operational' : 'Some Systems Need Attention'}
              </p>
              <p className={`text-xs ${overallHealth ? 'text-forest-600' : 'text-coral-600'}`}>
                Last checked: {formatTimestamp(health.timestamp)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Error banner */}
      {error && (
        <div className="bg-coral-50 border border-coral-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-coral-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex-1">
              <p className="text-sm font-medium text-coral-800">Failed to load health checks</p>
              <p className="text-sm text-coral-600">{error}</p>
            </div>
            <button
              onClick={fetchHealth}
              className="text-sm text-coral-700 hover:text-coral-900 font-medium"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Status cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatusCard
          title="Database Health"
          description="PostgreSQL connection status"
          ok={health?.database.ok}
          isLoading={loading}
        />
        <StatusCard
          title="Email Provider"
          description="Email delivery service status"
          ok={health?.email.ok}
          isLoading={loading}
        />
        <StatusCard
          title="Magic Link System"
          description="Authentication token generation"
          ok={health?.magic_link.ok}
          isLoading={loading}
        />
        <StatusCard
          title="Feature Flags"
          description="Configuration integrity"
          ok={health?.feature_flags.ok}
          isLoading={loading}
        />
      </div>

      {/* Detailed sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Database Section */}
        <div className="bg-white rounded-xl border border-sage-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-sage-100 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-medium text-sage-800">Database</h2>
              <p className="text-sm text-sage-500 mt-0.5">Connection and performance metrics</p>
            </div>
            {!loading && health && <StatusBadge ok={health.database.ok} />}
          </div>
          <div className="p-6">
            {loading ? (
              <div className="space-y-4">
                <div className="h-4 bg-sage-100 rounded w-32 animate-pulse" />
                <div className="h-4 bg-sage-100 rounded w-48 animate-pulse" />
              </div>
            ) : health ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between py-2 border-b border-sage-50">
                  <span className="text-sm text-sage-600">Status</span>
                  <span className={`text-sm font-medium ${health.database.ok ? 'text-forest-700' : 'text-coral-700'}`}>
                    {health.database.ok ? 'Connected' : 'Disconnected'}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-sage-600">Latency</span>
                  <span className={`text-sm font-mono font-medium ${
                    health.database.latency_ms < 100
                      ? 'text-forest-700'
                      : health.database.latency_ms < 500
                      ? 'text-cream-700'
                      : 'text-coral-700'
                  }`}>
                    {health.database.latency_ms}ms
                  </span>
                </div>
              </div>
            ) : null}
          </div>
        </div>

        {/* Email Section */}
        <div className="bg-white rounded-xl border border-sage-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-sage-100 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-medium text-sage-800">Email Service</h2>
              <p className="text-sm text-sage-500 mt-0.5">Delivery and bounce monitoring</p>
            </div>
            {!loading && health && <StatusBadge ok={health.email.ok} />}
          </div>
          <div className="p-6">
            {loading ? (
              <div className="space-y-4">
                <div className="h-4 bg-sage-100 rounded w-32 animate-pulse" />
                <div className="h-4 bg-sage-100 rounded w-48 animate-pulse" />
                <div className="h-4 bg-sage-100 rounded w-40 animate-pulse" />
              </div>
            ) : health ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between py-2 border-b border-sage-50">
                  <span className="text-sm text-sage-600">Status</span>
                  <span className={`text-sm font-medium ${health.email.ok ? 'text-forest-700' : 'text-coral-700'}`}>
                    {health.email.ok ? 'Operational' : 'Degraded'}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-sage-50">
                  <span className="text-sm text-sage-600">Provider</span>
                  <span className="text-sm font-medium text-sage-800">{health.email.provider}</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-sage-600">Last Bounce Check</span>
                  <span className="text-sm text-sage-700">{formatTimestamp(health.email.last_bounce_check)}</span>
                </div>
              </div>
            ) : null}
          </div>
        </div>

        {/* Magic Link Section */}
        <div className="bg-white rounded-xl border border-sage-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-sage-100 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-medium text-sage-800">Magic Link System</h2>
              <p className="text-sm text-sage-500 mt-0.5">Token generation and validation</p>
            </div>
            {!loading && health && <StatusBadge ok={health.magic_link.ok} />}
          </div>
          <div className="p-6">
            {loading ? (
              <div className="space-y-4">
                <div className="h-4 bg-sage-100 rounded w-32 animate-pulse" />
                <div className="h-4 bg-sage-100 rounded w-48 animate-pulse" />
              </div>
            ) : health ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between py-2 border-b border-sage-50">
                  <span className="text-sm text-sage-600">Status</span>
                  <span className={`text-sm font-medium ${health.magic_link.ok ? 'text-forest-700' : 'text-coral-700'}`}>
                    {health.magic_link.ok ? 'Operational' : 'Degraded'}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-sage-600">Last Token Created</span>
                  <span className="text-sm text-sage-700">{formatTimestamp(health.magic_link.last_token_created)}</span>
                </div>
              </div>
            ) : null}
          </div>
        </div>

        {/* Feature Flags Section */}
        <div className="bg-white rounded-xl border border-sage-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-sage-100 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-medium text-sage-800">Feature Flags</h2>
              <p className="text-sm text-sage-500 mt-0.5">Configuration validation</p>
            </div>
            {!loading && health && <StatusBadge ok={health.feature_flags.ok} />}
          </div>
          <div className="p-6">
            {loading ? (
              <div className="space-y-4">
                <div className="h-4 bg-sage-100 rounded w-32 animate-pulse" />
                <div className="h-4 bg-sage-100 rounded w-48 animate-pulse" />
              </div>
            ) : health ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between py-2 border-b border-sage-50">
                  <span className="text-sm text-sage-600">Status</span>
                  <span className={`text-sm font-medium ${health.feature_flags.ok ? 'text-forest-700' : 'text-coral-700'}`}>
                    {health.feature_flags.ok ? 'Valid' : 'Issues Detected'}
                  </span>
                </div>
                <div className="flex items-start justify-between py-2 border-b border-sage-50">
                  <span className="text-sm text-sage-600">Missing Flags</span>
                  <span className="text-sm text-sage-700 text-right">
                    {health.feature_flags.missing_flags.length === 0 ? (
                      <span className="text-forest-600">None</span>
                    ) : (
                      <span className="text-coral-600">{health.feature_flags.missing_flags.length} missing</span>
                    )}
                  </span>
                </div>
                <div className="flex items-start justify-between py-2">
                  <span className="text-sm text-sage-600">Unexpected Flags</span>
                  <span className="text-sm text-sage-700 text-right">
                    {health.feature_flags.unexpected_flags.length === 0 ? (
                      <span className="text-forest-600">None</span>
                    ) : (
                      <span className="text-cream-700">{health.feature_flags.unexpected_flags.length} found</span>
                    )}
                  </span>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* Feature Flag Details (if issues) */}
      {health && !health.feature_flags.ok && (
        <div className="bg-white rounded-xl border border-sage-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-sage-100">
            <h2 className="text-lg font-medium text-sage-800">Feature Flag Issues</h2>
            <p className="text-sm text-sage-500 mt-0.5">Details of configuration problems</p>
          </div>
          <div className="p-6 space-y-6">
            {/* Missing flags */}
            {health.feature_flags.missing_flags.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-coral-700 mb-2">Missing Flags</h3>
                <div className="flex flex-wrap gap-2">
                  {health.feature_flags.missing_flags.map((flag) => (
                    <span
                      key={flag}
                      className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-mono bg-coral-50 text-coral-700 border border-coral-200"
                    >
                      {flag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Invalid type flags */}
            {health.feature_flags.invalid_type_flags.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-coral-700 mb-2">Invalid Type Flags</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-sage-50/50">
                        <th className="px-4 py-2 text-left text-xs font-semibold text-sage-600 uppercase">Key</th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-sage-600 uppercase">Expected</th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-sage-600 uppercase">Actual</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-sage-50">
                      {health.feature_flags.invalid_type_flags.map((flag, index) => (
                        <tr key={index}>
                          <td className="px-4 py-2 font-mono text-sage-800">{flag.key}</td>
                          <td className="px-4 py-2 text-forest-600">{flag.expected}</td>
                          <td className="px-4 py-2 text-coral-600">{flag.actual}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Unexpected flags */}
            {health.feature_flags.unexpected_flags.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-cream-700 mb-2">Unexpected Flags</h3>
                <div className="flex flex-wrap gap-2">
                  {health.feature_flags.unexpected_flags.map((flag) => (
                    <span
                      key={flag}
                      className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-mono bg-cream-50 text-cream-700 border border-cream-200"
                    >
                      {flag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Footer with timestamp */}
      {health && (
        <div className="text-center text-xs text-sage-400 py-4">
          Last updated: {formatTimestamp(health.timestamp)}
        </div>
      )}
    </div>
  );
}
