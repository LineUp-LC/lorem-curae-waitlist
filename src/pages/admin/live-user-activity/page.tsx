import { useState, useEffect, useRef, useCallback } from 'react';

// Types for activity entries
interface ActivityEntry {
  id: string;
  timestamp: string;
  event_type: string;
  email: string | null;
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

// Format event type for display
function formatEventType(eventType: string): string {
  return eventType
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

// Get event type category for styling
function getEventCategory(eventType: string): string {
  if (eventType === 'signup' || eventType === 'user_signup') return 'signup';
  if (eventType === 'login' || eventType === 'user_login') return 'login';
  if (eventType === 'magic_link_requested' || eventType === 'magic_link_sent') return 'magic_link';
  if (eventType === 'wave_promoted' || eventType === 'wave_assigned') return 'wave';
  if (eventType === 'email_sent' || eventType === 'email_delivered') return 'email';
  if (eventType === 'anonymized' || eventType === 'user_anonymized') return 'anonymized';
  if (eventType === 'deleted' || eventType === 'user_deleted') return 'deleted';
  if (eventType.startsWith('system_') || eventType.startsWith('admin_')) return 'system';
  return 'default';
}

// Get event badge styles
function getEventBadgeStyles(eventType: string): string {
  const category = getEventCategory(eventType);
  switch (category) {
    case 'signup':
      return 'bg-forest-50 text-forest-700 border-forest-200';
    case 'login':
      return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'magic_link':
      return 'bg-purple-50 text-purple-700 border-purple-200';
    case 'wave':
      return 'bg-teal-50 text-teal-700 border-teal-200';
    case 'email':
      return 'bg-indigo-50 text-indigo-700 border-indigo-200';
    case 'anonymized':
      return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'deleted':
      return 'bg-coral-50 text-coral-700 border-coral-200';
    case 'system':
      return 'bg-sage-100 text-sage-700 border-sage-200';
    default:
      return 'bg-sage-50 text-sage-600 border-sage-200';
  }
}

// Get event dot color
function getEventDotColor(eventType: string): string {
  const category = getEventCategory(eventType);
  switch (category) {
    case 'signup':
      return 'bg-forest-500';
    case 'login':
      return 'bg-blue-500';
    case 'magic_link':
      return 'bg-purple-500';
    case 'wave':
      return 'bg-teal-500';
    case 'email':
      return 'bg-indigo-500';
    case 'anonymized':
      return 'bg-amber-500';
    case 'deleted':
      return 'bg-coral-500';
    case 'system':
      return 'bg-sage-500';
    default:
      return 'bg-sage-400';
  }
}

// Activity entry component
function ActivityEntryRow({ entry }: { entry: ActivityEntry }) {
  const [expanded, setExpanded] = useState(false);
  const hasMetadata = entry.metadata && Object.keys(entry.metadata).length > 0;

  return (
    <div className="group px-4 py-3 hover:bg-sage-50/50 transition-colors border-b border-sage-50 last:border-0">
      <div className="flex items-start gap-3">
        {/* Timestamp */}
        <span
          className="text-xs font-mono text-sage-400 flex-shrink-0 pt-0.5 w-16"
          title={formatFullTimestamp(entry.timestamp)}
        >
          {formatTimestamp(entry.timestamp)}
        </span>

        {/* Event type badge */}
        <span
          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium border flex-shrink-0 ${getEventBadgeStyles(entry.event_type)}`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${getEventDotColor(entry.event_type)}`} />
          {formatEventType(entry.event_type)}
        </span>

        {/* Email */}
        <span className="text-sm flex-shrink-0 min-w-[180px]">
          {entry.email ? (
            <span className="font-mono text-xs bg-sage-50 px-2 py-0.5 rounded text-sage-700">
              {entry.email}
            </span>
          ) : (
            <span className="text-sage-400">—</span>
          )}
        </span>

        {/* Spacer */}
        <span className="flex-1" />

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
        <div className="mt-2 ml-[76px]">
          <pre className="text-xs font-mono bg-sage-800 text-sage-100 p-3 rounded-lg overflow-x-auto">
            {JSON.stringify(entry.metadata, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

export default function LiveUserActivityPage() {
  const [activities, setActivities] = useState<ActivityEntry[]>([]);
  const [isPaused, setIsPaused] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [reconnectCountdown, setReconnectCountdown] = useState<number | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const isPausedRef = useRef(isPaused);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Keep isPausedRef in sync
  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  // Auto-scroll to bottom
  const scrollToBottom = useCallback(() => {
    if (containerRef.current && !isPausedRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
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
      const url = `/api/admin/live-user-activity?token=${encodeURIComponent(adminSecret)}`;
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
          const activityEntry: ActivityEntry = JSON.parse(event.data);
          setActivities((prev) => [...prev.slice(-499), activityEntry]); // Keep last 500
          setTimeout(scrollToBottom, 10);
        } catch (err) {
          console.error('[LiveUserActivity] Failed to parse activity:', err);
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
      console.error('[LiveUserActivity] Failed to connect:', err);
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

  // Handle clear
  const handleClear = () => {
    setActivities([]);
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

  // Count events by type for summary
  const eventCounts = activities.reduce((acc, activity) => {
    const category = getEventCategory(activity.event_type);
    acc[category] = (acc[category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6 h-full flex flex-col">
      {/* Page header */}
      <div className="flex items-center justify-between flex-shrink-0">
        <div>
          <h1 className="text-2xl font-semibold text-sage-900">Live User Activity</h1>
          <p className="mt-1 text-sage-500">
            Real-time stream of user events
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
            onClick={handleClear}
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
              Stream paused — new events are being buffered but not displayed
            </p>
          </div>
        </div>
      )}

      {/* Event type summary */}
      {activities.length > 0 && (
        <div className="flex flex-wrap gap-3 flex-shrink-0">
          {eventCounts.signup && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-forest-50 text-forest-700">
              <span className="w-1.5 h-1.5 rounded-full bg-forest-500" />
              {eventCounts.signup} signup{eventCounts.signup !== 1 ? 's' : ''}
            </span>
          )}
          {eventCounts.login && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              {eventCounts.login} login{eventCounts.login !== 1 ? 's' : ''}
            </span>
          )}
          {eventCounts.magic_link && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-purple-50 text-purple-700">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
              {eventCounts.magic_link} magic link{eventCounts.magic_link !== 1 ? 's' : ''}
            </span>
          )}
          {eventCounts.wave && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-teal-50 text-teal-700">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />
              {eventCounts.wave} wave event{eventCounts.wave !== 1 ? 's' : ''}
            </span>
          )}
          {eventCounts.email && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
              {eventCounts.email} email{eventCounts.email !== 1 ? 's' : ''}
            </span>
          )}
          {eventCounts.deleted && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-coral-50 text-coral-700">
              <span className="w-1.5 h-1.5 rounded-full bg-coral-500" />
              {eventCounts.deleted} deleted
            </span>
          )}
          {eventCounts.anonymized && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              {eventCounts.anonymized} anonymized
            </span>
          )}
          {eventCounts.system && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-sage-100 text-sage-700">
              <span className="w-1.5 h-1.5 rounded-full bg-sage-500" />
              {eventCounts.system} system
            </span>
          )}
        </div>
      )}

      {/* Activity container */}
      <div className="bg-white rounded-xl border border-sage-100 overflow-hidden flex-1 flex flex-col min-h-0">
        {/* Header */}
        <div className="px-4 py-3 bg-sage-50/50 border-b border-sage-100 flex items-center justify-between flex-shrink-0">
          <span className="text-sm font-medium text-sage-700">
            {activities.length} event{activities.length !== 1 ? 's' : ''}
          </span>
          <div className="flex items-center gap-4 text-xs text-sage-500">
            <span className="inline-flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-forest-500" />
              Signup
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              Login
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-purple-500" />
              Magic Link
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-coral-500" />
              Deleted
            </span>
          </div>
        </div>

        {/* Activity list */}
        <div
          ref={containerRef}
          className="flex-1 overflow-y-auto min-h-0"
          style={{ maxHeight: 'calc(100vh - 400px)' }}
        >
          {activities.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-12 text-center">
              <div className="w-16 h-16 rounded-full bg-sage-100 flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-sage-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <p className="text-sm text-sage-500">Waiting for user activity...</p>
              <p className="text-xs text-sage-400 mt-1">
                {isConnected ? 'Connected and listening' : 'Connecting to activity stream'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-sage-50">
              {activities.map((entry) => (
                <ActivityEntryRow key={entry.id} entry={entry} />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {activities.length > 0 && (
          <div className="px-4 py-2 bg-sage-50/50 border-t border-sage-100 flex-shrink-0">
            <p className="text-xs text-sage-400 text-center">
              Showing last {activities.length} events (max 500)
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
