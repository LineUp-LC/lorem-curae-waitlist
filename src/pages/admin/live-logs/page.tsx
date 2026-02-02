import { useState, useEffect, useRef, useCallback } from 'react';

// Types for log entries
interface LogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error';
  message: string;
  metadata: Record<string, unknown> | null;
}

// Format timestamp for display
function formatTimestamp(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

// Format full timestamp for tooltip
function formatFullTimestamp(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });
}

// Get level badge styles
function getLevelStyles(level: LogEntry['level']): string {
  switch (level) {
    case 'info':
      return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'warn':
      return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'error':
      return 'bg-coral-50 text-coral-700 border-coral-200';
    default:
      return 'bg-sage-50 text-sage-700 border-sage-200';
  }
}

// Get level dot color
function getLevelDotColor(level: LogEntry['level']): string {
  switch (level) {
    case 'info':
      return 'bg-blue-500';
    case 'warn':
      return 'bg-amber-500';
    case 'error':
      return 'bg-coral-500';
    default:
      return 'bg-sage-500';
  }
}

// Log entry component
function LogEntryRow({ entry }: { entry: LogEntry }) {
  const [expanded, setExpanded] = useState(false);
  const hasMetadata = entry.metadata && Object.keys(entry.metadata).length > 0;

  return (
    <div className="group px-4 py-2 hover:bg-sage-50/50 transition-colors border-b border-sage-50 last:border-0">
      <div className="flex items-start gap-3">
        {/* Timestamp */}
        <span
          className="text-xs font-mono text-sage-400 flex-shrink-0 pt-0.5"
          title={formatFullTimestamp(entry.timestamp)}
        >
          {formatTimestamp(entry.timestamp)}
        </span>

        {/* Level badge */}
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium border flex-shrink-0 ${getLevelStyles(entry.level)}`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${getLevelDotColor(entry.level)}`} />
          {entry.level.toUpperCase()}
        </span>

        {/* Message */}
        <span className="text-sm text-sage-700 flex-1 break-words">{entry.message}</span>

        {/* Metadata toggle */}
        {hasMetadata && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-xs text-sage-400 hover:text-sage-600 transition-colors flex-shrink-0"
          >
            {expanded ? 'Hide' : 'Show'} data
          </button>
        )}
      </div>

      {/* Expanded metadata */}
      {expanded && hasMetadata && (
        <div className="mt-2 ml-[72px]">
          <pre className="text-xs font-mono bg-sage-800 text-sage-100 p-3 rounded-lg overflow-x-auto">
            {JSON.stringify(entry.metadata, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

export default function LiveLogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isPaused, setIsPaused] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [reconnectCountdown, setReconnectCountdown] = useState<number | null>(null);

  const logsContainerRef = useRef<HTMLDivElement>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const isPausedRef = useRef(isPaused);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Keep isPausedRef in sync
  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  // Auto-scroll to bottom
  const scrollToBottom = useCallback(() => {
    if (logsContainerRef.current && !isPausedRef.current) {
      logsContainerRef.current.scrollTop = logsContainerRef.current.scrollHeight;
    }
  }, []);

  // Connect to SSE
  const connect = useCallback(() => {
    const adminSecret = import.meta.env.VITE_ADMIN_SECRET;

    if (!adminSecret) {
      setConnectionError('Admin credentials not configured');
      return;
    }

    // Close existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    // Clear reconnect state
    setReconnectCountdown(null);
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    try {
      // Create SSE connection with auth
      const url = `/api/admin/live-logs?token=${encodeURIComponent(adminSecret)}`;
      const eventSource = new EventSource(url);
      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        setIsConnected(true);
        setConnectionError(null);
        setReconnectCountdown(null);
      };

      eventSource.onmessage = (event) => {
        if (isPausedRef.current) return;

        try {
          const logEntry: LogEntry = JSON.parse(event.data);
          setLogs((prev) => [...prev.slice(-499), logEntry]); // Keep last 500 logs
          setTimeout(scrollToBottom, 10);
        } catch (err) {
          console.error('[LiveLogs] Failed to parse log entry:', err);
        }
      };

      eventSource.onerror = () => {
        setIsConnected(false);
        setConnectionError('Connection lost');
        eventSource.close();
        eventSourceRef.current = null;

        // Start reconnection countdown
        let countdown = 3;
        setReconnectCountdown(countdown);

        const countdownInterval = setInterval(() => {
          countdown -= 1;
          setReconnectCountdown(countdown);

          if (countdown <= 0) {
            clearInterval(countdownInterval);
            connect();
          }
        }, 1000);

        reconnectTimeoutRef.current = countdownInterval as unknown as NodeJS.Timeout;
      };
    } catch (err) {
      console.error('[LiveLogs] Failed to connect:', err);
      setConnectionError('Failed to establish connection');
    }
  }, [scrollToBottom]);

  // Connect on mount
  useEffect(() => {
    connect();

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [connect]);

  // Handle clear logs
  const handleClearLogs = () => {
    setLogs([]);
  };

  // Handle pause toggle
  const handleTogglePause = () => {
    setIsPaused((prev) => !prev);
  };

  // Handle manual reconnect
  const handleReconnect = () => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    setReconnectCountdown(null);
    connect();
  };

  return (
    <div className="space-y-6 h-full flex flex-col">
      {/* Page header */}
      <div className="flex items-center justify-between flex-shrink-0">
        <div>
          <h1 className="text-2xl font-semibold text-sage-900">Live System Logs</h1>
          <p className="mt-1 text-sage-500">
            Real-time stream of backend events
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Connection status */}
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${
              isConnected
                ? 'bg-forest-50 text-forest-700'
                : 'bg-sage-100 text-sage-600'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isConnected ? 'bg-forest-500 animate-pulse' : 'bg-sage-400'
              }`}
            />
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>

          {/* Pause button */}
          <button
            onClick={handleTogglePause}
            className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              isPaused
                ? 'bg-forest-600 text-white hover:bg-forest-700'
                : 'bg-cream-100 text-cream-800 hover:bg-cream-200'
            }`}
          >
            {isPaused ? (
              <>
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                </svg>
                Resume
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                Pause
              </>
            )}
          </button>

          {/* Clear button */}
          <button
            onClick={handleClearLogs}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-sage-700 bg-white border border-sage-200 rounded-lg hover:bg-sage-50 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Clear
          </button>
        </div>
      </div>

      {/* Connection error banner */}
      {connectionError && (
        <div className="bg-coral-50 border border-coral-200 rounded-lg p-4 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-coral-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="text-sm font-medium text-coral-800">{connectionError}</p>
                {reconnectCountdown !== null && (
                  <p className="text-xs text-coral-600">
                    Reconnecting in {reconnectCountdown} second{reconnectCountdown !== 1 ? 's' : ''}...
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={handleReconnect}
              className="text-sm font-medium text-coral-700 hover:text-coral-900 transition-colors"
            >
              Reconnect now
            </button>
          </div>
        </div>
      )}

      {/* Pause indicator */}
      {isPaused && (
        <div className="bg-cream-50 border border-cream-200 rounded-lg p-3 flex-shrink-0">
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-cream-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-cream-800">
              Stream paused — new logs are being buffered but not displayed
            </p>
          </div>
        </div>
      )}

      {/* Logs container */}
      <div className="bg-white rounded-xl border border-sage-100 overflow-hidden flex-1 flex flex-col min-h-0">
        {/* Header */}
        <div className="px-4 py-3 bg-sage-50/50 border-b border-sage-100 flex items-center justify-between flex-shrink-0">
          <span className="text-sm font-medium text-sage-700">
            {logs.length} log{logs.length !== 1 ? 's' : ''}
          </span>
          <div className="flex items-center gap-4 text-xs text-sage-500">
            <span className="inline-flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              Info
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              Warn
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-coral-500" />
              Error
            </span>
          </div>
        </div>

        {/* Logs list */}
        <div
          ref={logsContainerRef}
          className="flex-1 overflow-y-auto min-h-0"
          style={{ maxHeight: 'calc(100vh - 350px)' }}
        >
          {logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-12 text-center">
              <div className="w-16 h-16 rounded-full bg-sage-100 flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-sage-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-sm text-sage-500">Waiting for log entries...</p>
              <p className="text-xs text-sage-400 mt-1">
                {isConnected ? 'Connected and listening' : 'Connecting to log stream'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-sage-50">
              {logs.map((entry) => (
                <LogEntryRow key={entry.id} entry={entry} />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {logs.length > 0 && (
          <div className="px-4 py-2 bg-sage-50/50 border-t border-sage-100 flex-shrink-0">
            <p className="text-xs text-sage-400 text-center">
              Showing last {logs.length} entries (max 500)
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
