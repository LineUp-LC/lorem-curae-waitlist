import { useState, useEffect, useCallback, useRef } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

// ============================================================================
// Types
// ============================================================================

interface TimeSeriesPoint {
  timestamp: string;
  value: number;
}

interface LatencyPoint {
  timestamp: string;
  p50: number;
  p90: number;
  p99: number;
}

interface MetricsData {
  request_throughput: TimeSeriesPoint[];
  error_rate: TimeSeriesPoint[];
  latency_ms: LatencyPoint[];
  queue_depth: TimeSeriesPoint[];
  email_send_rate: TimeSeriesPoint[];
  wave_progression_rate: TimeSeriesPoint[];
}

interface FetchState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

// ============================================================================
// Constants
// ============================================================================

const REFRESH_INTERVAL_MS = 10000; // 10 seconds

const CHART_COLORS = {
  primary: '#4B7C5C', // forest-600
  secondary: '#7C9A8A', // sage-500
  tertiary: '#D4A853', // cream-600
  error: '#E57373', // coral-400
  p50: '#4B7C5C', // forest
  p90: '#D4A853', // cream
  p99: '#E57373', // coral
};

// ============================================================================
// Utility Functions
// ============================================================================

function formatTimestamp(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

function formatNumber(value: number): string {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
  return value.toFixed(value % 1 === 0 ? 0 : 1);
}

function formatPercent(value: number): string {
  return `${value.toFixed(2)}%`;
}

function formatMs(value: number): string {
  if (value >= 1000) return `${(value / 1000).toFixed(2)}s`;
  return `${value.toFixed(0)}ms`;
}

// ============================================================================
// Chart Card Component
// ============================================================================

interface ChartCardProps {
  title: string;
  subtitle?: string;
  loading?: boolean;
  error?: string | null;
  children: React.ReactNode;
  currentValue?: string;
  trend?: 'up' | 'down' | 'neutral';
}

function ChartCard({
  title,
  subtitle,
  loading,
  error,
  children,
  currentValue,
  trend,
}: ChartCardProps) {
  return (
    <div className="bg-white rounded-xl border border-sage-100 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-sage-100">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-sm font-semibold text-sage-800">{title}</h3>
            {subtitle && <p className="text-xs text-sage-500 mt-0.5">{subtitle}</p>}
          </div>
          {currentValue && (
            <div className="flex items-center gap-1.5">
              <span className="text-lg font-semibold text-sage-900">{currentValue}</span>
              {trend && trend !== 'neutral' && (
                <span className={trend === 'up' ? 'text-coral-500' : 'text-forest-500'}>
                  {trend === 'up' ? (
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="p-4">
        {loading ? (
          <div className="h-48 flex items-center justify-center">
            <div className="flex items-center gap-3 text-sage-400">
              <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span className="text-sm">Loading metrics...</span>
            </div>
          </div>
        ) : error ? (
          <div className="h-48 flex items-center justify-center">
            <div className="text-center px-4">
              <svg className="w-10 h-10 mx-auto mb-2 text-coral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-coral-600">Failed to load chart</p>
              <p className="text-xs text-sage-500 mt-1">{error}</p>
            </div>
          </div>
        ) : (
          <div className="h-48">{children}</div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Custom Tooltip Component
// ============================================================================

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    color: string;
    dataKey: string;
  }>;
  label?: string;
  formatter?: (value: number) => string;
}

function CustomTooltip({ active, payload, label, formatter = formatNumber }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="bg-sage-800 rounded-lg px-3 py-2 shadow-lg border border-sage-700">
      <p className="text-xs text-sage-300 mb-1">{label}</p>
      {payload.map((entry, index) => (
        <div key={index} className="flex items-center gap-2">
          <span
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-xs text-sage-100">
            {entry.name}: <span className="font-medium">{formatter(entry.value)}</span>
          </span>
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// Individual Chart Components
// ============================================================================

function RequestThroughputChart({ data }: { data: TimeSeriesPoint[] }) {
  const chartData = data.map((d) => ({
    time: formatTimestamp(d.timestamp),
    value: d.value,
  }));

  const latestValue = data.length > 0 ? data[data.length - 1].value : 0;
  const previousValue = data.length > 1 ? data[data.length - 2].value : latestValue;
  const trend = latestValue > previousValue ? 'up' : latestValue < previousValue ? 'down' : 'neutral';

  return (
    <ChartCard
      title="Request Throughput"
      subtitle="Requests per second"
      currentValue={`${formatNumber(latestValue)} req/s`}
      trend={trend as 'up' | 'down' | 'neutral'}
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E8EBE9" />
          <XAxis
            dataKey="time"
            tick={{ fontSize: 10, fill: '#7C9A8A' }}
            tickLine={false}
            axisLine={{ stroke: '#D4DBD7' }}
          />
          <YAxis
            tick={{ fontSize: 10, fill: '#7C9A8A' }}
            tickLine={false}
            axisLine={false}
            tickFormatter={formatNumber}
          />
          <Tooltip content={<CustomTooltip />} />
          <Line
            type="monotone"
            dataKey="value"
            name="Throughput"
            stroke={CHART_COLORS.primary}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: CHART_COLORS.primary }}
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

function ErrorRateChart({ data }: { data: TimeSeriesPoint[] }) {
  const chartData = data.map((d) => ({
    time: formatTimestamp(d.timestamp),
    value: d.value,
  }));

  const latestValue = data.length > 0 ? data[data.length - 1].value : 0;
  const previousValue = data.length > 1 ? data[data.length - 2].value : latestValue;
  const trend = latestValue > previousValue ? 'up' : latestValue < previousValue ? 'down' : 'neutral';

  return (
    <ChartCard
      title="Error Rate"
      subtitle="Percentage of failed requests"
      currentValue={formatPercent(latestValue)}
      trend={trend as 'up' | 'down' | 'neutral'}
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E8EBE9" />
          <XAxis
            dataKey="time"
            tick={{ fontSize: 10, fill: '#7C9A8A' }}
            tickLine={false}
            axisLine={{ stroke: '#D4DBD7' }}
          />
          <YAxis
            tick={{ fontSize: 10, fill: '#7C9A8A' }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => `${v}%`}
          />
          <Tooltip content={<CustomTooltip formatter={formatPercent} />} />
          <Line
            type="monotone"
            dataKey="value"
            name="Error Rate"
            stroke={CHART_COLORS.error}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: CHART_COLORS.error }}
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

function LatencyChart({ data }: { data: LatencyPoint[] }) {
  const chartData = data.map((d) => ({
    time: formatTimestamp(d.timestamp),
    p50: d.p50,
    p90: d.p90,
    p99: d.p99,
  }));

  const latestP50 = data.length > 0 ? data[data.length - 1].p50 : 0;

  return (
    <ChartCard
      title="Latency"
      subtitle="Response time percentiles (ms)"
      currentValue={`p50: ${formatMs(latestP50)}`}
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E8EBE9" />
          <XAxis
            dataKey="time"
            tick={{ fontSize: 10, fill: '#7C9A8A' }}
            tickLine={false}
            axisLine={{ stroke: '#D4DBD7' }}
          />
          <YAxis
            tick={{ fontSize: 10, fill: '#7C9A8A' }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => `${v}ms`}
          />
          <Tooltip content={<CustomTooltip formatter={formatMs} />} />
          <Legend
            wrapperStyle={{ fontSize: '10px' }}
            iconType="line"
            iconSize={10}
          />
          <Line
            type="monotone"
            dataKey="p50"
            name="p50"
            stroke={CHART_COLORS.p50}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: CHART_COLORS.p50 }}
          />
          <Line
            type="monotone"
            dataKey="p90"
            name="p90"
            stroke={CHART_COLORS.p90}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: CHART_COLORS.p90 }}
          />
          <Line
            type="monotone"
            dataKey="p99"
            name="p99"
            stroke={CHART_COLORS.p99}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: CHART_COLORS.p99 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

function QueueDepthChart({ data }: { data: TimeSeriesPoint[] }) {
  const chartData = data.map((d) => ({
    time: formatTimestamp(d.timestamp),
    value: d.value,
  }));

  const latestValue = data.length > 0 ? data[data.length - 1].value : 0;
  const previousValue = data.length > 1 ? data[data.length - 2].value : latestValue;
  const trend = latestValue > previousValue ? 'up' : latestValue < previousValue ? 'down' : 'neutral';

  return (
    <ChartCard
      title="Queue Depth"
      subtitle="Items waiting in queue"
      currentValue={formatNumber(latestValue)}
      trend={trend as 'up' | 'down' | 'neutral'}
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E8EBE9" />
          <XAxis
            dataKey="time"
            tick={{ fontSize: 10, fill: '#7C9A8A' }}
            tickLine={false}
            axisLine={{ stroke: '#D4DBD7' }}
          />
          <YAxis
            tick={{ fontSize: 10, fill: '#7C9A8A' }}
            tickLine={false}
            axisLine={false}
            tickFormatter={formatNumber}
          />
          <Tooltip content={<CustomTooltip />} />
          <Line
            type="monotone"
            dataKey="value"
            name="Queue Depth"
            stroke={CHART_COLORS.secondary}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: CHART_COLORS.secondary }}
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

function EmailSendRateChart({ data }: { data: TimeSeriesPoint[] }) {
  const chartData = data.map((d) => ({
    time: formatTimestamp(d.timestamp),
    value: d.value,
  }));

  const latestValue = data.length > 0 ? data[data.length - 1].value : 0;
  const previousValue = data.length > 1 ? data[data.length - 2].value : latestValue;
  const trend = latestValue > previousValue ? 'up' : latestValue < previousValue ? 'down' : 'neutral';

  return (
    <ChartCard
      title="Email Send Rate"
      subtitle="Emails sent per minute"
      currentValue={`${formatNumber(latestValue)}/min`}
      trend={trend as 'up' | 'down' | 'neutral'}
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E8EBE9" />
          <XAxis
            dataKey="time"
            tick={{ fontSize: 10, fill: '#7C9A8A' }}
            tickLine={false}
            axisLine={{ stroke: '#D4DBD7' }}
          />
          <YAxis
            tick={{ fontSize: 10, fill: '#7C9A8A' }}
            tickLine={false}
            axisLine={false}
            tickFormatter={formatNumber}
          />
          <Tooltip content={<CustomTooltip />} />
          <Line
            type="monotone"
            dataKey="value"
            name="Send Rate"
            stroke={CHART_COLORS.tertiary}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: CHART_COLORS.tertiary }}
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

function WaveProgressionChart({ data }: { data: TimeSeriesPoint[] }) {
  const chartData = data.map((d) => ({
    time: formatTimestamp(d.timestamp),
    value: d.value,
  }));

  const latestValue = data.length > 0 ? data[data.length - 1].value : 0;
  const previousValue = data.length > 1 ? data[data.length - 2].value : latestValue;
  const trend = latestValue > previousValue ? 'up' : latestValue < previousValue ? 'down' : 'neutral';

  return (
    <ChartCard
      title="Wave Progression Rate"
      subtitle="Users promoted per hour"
      currentValue={`${formatNumber(latestValue)}/hr`}
      trend={trend as 'up' | 'down' | 'neutral'}
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E8EBE9" />
          <XAxis
            dataKey="time"
            tick={{ fontSize: 10, fill: '#7C9A8A' }}
            tickLine={false}
            axisLine={{ stroke: '#D4DBD7' }}
          />
          <YAxis
            tick={{ fontSize: 10, fill: '#7C9A8A' }}
            tickLine={false}
            axisLine={false}
            tickFormatter={formatNumber}
          />
          <Tooltip content={<CustomTooltip />} />
          <Line
            type="monotone"
            dataKey="value"
            name="Progression Rate"
            stroke={CHART_COLORS.primary}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: CHART_COLORS.primary }}
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export default function MetricsPage() {
  const [metrics, setMetrics] = useState<FetchState<MetricsData>>({
    data: null,
    loading: true,
    error: null,
  });
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const getAuthHeaders = useCallback(() => {
    const adminSecret = import.meta.env.VITE_ADMIN_SECRET;
    return {
      Authorization: `Bearer ${adminSecret}`,
      'Content-Type': 'application/json',
    };
  }, []);

  const fetchMetrics = useCallback(async () => {
    // Don't set loading to true on subsequent fetches to avoid flickering
    if (!metrics.data) {
      setMetrics((prev) => ({ ...prev, loading: true }));
    }

    try {
      const res = await fetch('/api/admin/metrics', { headers: getAuthHeaders() });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      setMetrics({ data, loading: false, error: null });
      setLastUpdated(new Date());
    } catch (err) {
      setMetrics((prev) => ({
        ...prev,
        loading: false,
        error: err instanceof Error ? err.message : 'Unknown error',
      }));
    }
  }, [getAuthHeaders, metrics.data]);

  // Initial fetch
  useEffect(() => {
    fetchMetrics();
  }, []);

  // Auto-refresh interval
  useEffect(() => {
    if (autoRefresh) {
      intervalRef.current = setInterval(() => {
        fetchMetrics();
      }, REFRESH_INTERVAL_MS);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [autoRefresh, fetchMetrics]);

  const toggleAutoRefresh = () => {
    setAutoRefresh((prev) => !prev);
  };

  const formatLastUpdated = () => {
    if (!lastUpdated) return 'Never';
    return lastUpdated.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-sage-900">System Metrics</h1>
          <p className="mt-1 text-sage-500">Real-time operational performance</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Last updated indicator */}
          <div className="text-sm text-sage-500">
            <span className="hidden sm:inline">Last updated: </span>
            <span className="font-medium">{formatLastUpdated()}</span>
          </div>

          {/* Auto-refresh toggle */}
          <button
            onClick={toggleAutoRefresh}
            className={`inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg border transition-colors ${
              autoRefresh
                ? 'bg-forest-50 text-forest-700 border-forest-200 hover:bg-forest-100'
                : 'bg-white text-sage-700 border-sage-200 hover:bg-sage-50'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${autoRefresh ? 'bg-forest-500 animate-pulse' : 'bg-sage-400'}`} />
            Auto-refresh {autoRefresh ? 'On' : 'Off'}
          </button>

          {/* Manual refresh */}
          <button
            onClick={fetchMetrics}
            disabled={metrics.loading}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-sage-700 bg-white border border-sage-200 rounded-lg hover:bg-sage-50 transition-colors disabled:opacity-50"
          >
            <svg
              className={`w-4 h-4 ${metrics.loading ? 'animate-spin' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>
      </div>

      {/* Status bar */}
      {autoRefresh && (
        <div className="flex items-center gap-2 text-xs text-sage-500">
          <svg className="w-3.5 h-3.5 text-forest-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
          </svg>
          <span>Refreshing every {REFRESH_INTERVAL_MS / 1000} seconds</span>
        </div>
      )}

      {/* Error banner */}
      {metrics.error && !metrics.data && (
        <div className="bg-coral-50 border border-coral-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-coral-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex-1">
              <p className="text-sm font-medium text-coral-800">Failed to load metrics</p>
              <p className="text-sm text-coral-600">{metrics.error}</p>
            </div>
            <button
              onClick={fetchMetrics}
              className="text-sm text-coral-700 hover:text-coral-900 font-medium"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {metrics.loading && !metrics.data ? (
          // Loading skeleton
          <>
            {[...Array(6)].map((_, i) => (
              <ChartCard key={i} title="Loading..." loading>
                <div />
              </ChartCard>
            ))}
          </>
        ) : metrics.data ? (
          <>
            <RequestThroughputChart data={metrics.data.request_throughput} />
            <ErrorRateChart data={metrics.data.error_rate} />
            <LatencyChart data={metrics.data.latency_ms} />
            <QueueDepthChart data={metrics.data.queue_depth} />
            <EmailSendRateChart data={metrics.data.email_send_rate} />
            <WaveProgressionChart data={metrics.data.wave_progression_rate} />
          </>
        ) : null}
      </div>

      {/* Chart Legend */}
      {metrics.data && (
        <div className="bg-white rounded-xl border border-sage-100 shadow-sm px-5 py-4">
          <div className="flex flex-wrap items-center gap-6 text-xs text-sage-600">
            <div className="flex items-center gap-2">
              <span className="w-3 h-0.5 rounded-full" style={{ backgroundColor: CHART_COLORS.primary }} />
              <span>Primary metrics</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-0.5 rounded-full" style={{ backgroundColor: CHART_COLORS.error }} />
              <span>Error indicators</span>
            </div>
            <div className="flex items-center gap-2">
              <span>Latency percentiles:</span>
              <span className="inline-flex items-center gap-1">
                <span className="w-2 h-0.5 rounded-full" style={{ backgroundColor: CHART_COLORS.p50 }} />
                p50
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="w-2 h-0.5 rounded-full" style={{ backgroundColor: CHART_COLORS.p90 }} />
                p90
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="w-2 h-0.5 rounded-full" style={{ backgroundColor: CHART_COLORS.p99 }} />
                p99
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
