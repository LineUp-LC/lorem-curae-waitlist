import { useState, useEffect, useCallback } from 'react';

// Types for API response
interface EnvVariable {
  key: string;
  value: string;
  is_sensitive: boolean;
  updated_at: string;
}

interface EnvResponse {
  env: EnvVariable[];
}

// Track editing state per row
interface EditState {
  value: string;
  isVisible: boolean;
  isSaving: boolean;
  error: string | null;
  success: boolean;
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

// Mask sensitive value
function maskValue(value: string): string {
  if (value.length <= 4) {
    return '••••••••';
  }
  return '••••••••' + value.slice(-4);
}

export default function EnvVariablesPage() {
  const [envVars, setEnvVars] = useState<EnvVariable[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editStates, setEditStates] = useState<Record<string, EditState>>({});

  const getAdminSecret = () => import.meta.env.VITE_ADMIN_SECRET;

  // Initialize edit states from env vars
  const initializeEditStates = useCallback((vars: EnvVariable[]) => {
    const states: Record<string, EditState> = {};
    vars.forEach((v) => {
      states[v.key] = {
        value: v.value,
        isVisible: !v.is_sensitive,
        isSaving: false,
        error: null,
        success: false,
      };
    });
    setEditStates(states);
  }, []);

  // Fetch environment variables
  const fetchEnvVars = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const adminSecret = getAdminSecret();
      if (!adminSecret) throw new Error('Admin credentials not configured');

      const response = await fetch('/api/admin/env', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${adminSecret}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 401) throw new Error('Unauthorized');
        throw new Error(`Failed to fetch environment variables (${response.status})`);
      }

      const data: EnvResponse = await response.json();
      setEnvVars(data.env || []);
      initializeEditStates(data.env || []);
    } catch (err) {
      console.error('[EnvVars] Fetch failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to load environment variables');
    } finally {
      setLoading(false);
    }
  }, [initializeEditStates]);

  useEffect(() => {
    fetchEnvVars();
  }, [fetchEnvVars]);

  // Toggle visibility for a key
  const toggleVisibility = (key: string) => {
    setEditStates((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        isVisible: !prev[key]?.isVisible,
      },
    }));
  };

  // Update edit value for a key
  const updateValue = (key: string, value: string) => {
    setEditStates((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        value,
        error: null,
        success: false,
      },
    }));
  };

  // Reset value to original
  const resetValue = (key: string) => {
    const original = envVars.find((v) => v.key === key);
    if (original) {
      setEditStates((prev) => ({
        ...prev,
        [key]: {
          ...prev[key],
          value: original.value,
          error: null,
          success: false,
        },
      }));
    }
  };

  // Save value
  const saveValue = async (key: string) => {
    const editState = editStates[key];
    if (!editState) return;

    try {
      setEditStates((prev) => ({
        ...prev,
        [key]: { ...prev[key], isSaving: true, error: null, success: false },
      }));

      const adminSecret = getAdminSecret();
      if (!adminSecret) throw new Error('Admin credentials not configured');

      const response = await fetch('/api/admin/update-env', {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${adminSecret}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ key, value: editState.value }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to update (${response.status})`);
      }

      // Update the original value and timestamp
      const newTimestamp = new Date().toISOString();
      setEnvVars((prev) =>
        prev.map((v) =>
          v.key === key
            ? { ...v, value: editState.value, updated_at: newTimestamp }
            : v
        )
      );

      setEditStates((prev) => ({
        ...prev,
        [key]: { ...prev[key], isSaving: false, success: true },
      }));

      // Clear success after 3 seconds
      setTimeout(() => {
        setEditStates((prev) => ({
          ...prev,
          [key]: { ...prev[key], success: false },
        }));
      }, 3000);
    } catch (err) {
      console.error('[EnvVars] Save failed:', err);
      setEditStates((prev) => ({
        ...prev,
        [key]: {
          ...prev[key],
          isSaving: false,
          error: err instanceof Error ? err.message : 'Failed to save',
        },
      }));
    }
  };

  // Check if value has changed
  const hasChanged = (key: string): boolean => {
    const original = envVars.find((v) => v.key === key);
    const editState = editStates[key];
    return original?.value !== editState?.value;
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-sage-900">Environment Variables</h1>
          <p className="mt-1 text-sage-500">
            Manage runtime configuration safely
          </p>
        </div>
        <button
          onClick={fetchEnvVars}
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

      {/* Warning banner */}
      <div className="bg-cream-50 border border-cream-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-cream-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div>
            <p className="text-sm font-medium text-cream-800">Proceed with caution</p>
            <p className="text-sm text-cream-700 mt-0.5">
              Editing environment variables can affect system behavior. Changes take effect immediately.
              Sensitive values are masked by default for security.
            </p>
          </div>
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
              <p className="text-sm font-medium text-coral-800">Failed to load environment variables</p>
              <p className="text-sm text-coral-600">{error}</p>
            </div>
            <button
              onClick={fetchEnvVars}
              className="text-sm text-coral-700 hover:text-coral-900 font-medium"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Env vars table */}
      <div className="bg-white rounded-xl border border-sage-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-sage-100">
          <h2 className="text-lg font-medium text-sage-800">Variables</h2>
          <p className="text-sm text-sage-500 mt-0.5">
            {loading ? 'Loading...' : `${envVars.length} variable${envVars.length !== 1 ? 's' : ''} configured`}
          </p>
        </div>

        {loading ? (
          <div className="p-6">
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="h-4 bg-sage-100 rounded w-40 animate-pulse" />
                  <div className="h-4 bg-sage-100 rounded w-64 animate-pulse" />
                  <div className="h-4 bg-sage-100 rounded w-32 animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        ) : envVars.length === 0 ? (
          <div className="p-12 text-center">
            <svg className="w-12 h-12 mx-auto mb-4 text-sage-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <p className="text-sage-600 font-medium">No environment variables found</p>
            <p className="text-sm text-sage-500 mt-1">Environment variables will appear here when configured</p>
          </div>
        ) : (
          <div className="divide-y divide-sage-100">
            {envVars.map((envVar, index) => {
              const editState = editStates[envVar.key];
              const isChanged = hasChanged(envVar.key);
              const isVisible = editState?.isVisible ?? !envVar.is_sensitive;

              return (
                <div
                  key={envVar.key}
                  className={`p-4 ${index % 2 === 0 ? 'bg-white' : 'bg-sage-50/30'} ${
                    isChanged ? 'ring-1 ring-inset ring-cream-300 bg-cream-50/30' : ''
                  }`}
                >
                  <div className="flex items-start gap-4">
                    {/* Key column */}
                    <div className="w-48 flex-shrink-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-medium text-sage-800 break-all">
                          {envVar.key}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span
                          className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${
                            envVar.is_sensitive
                              ? 'bg-coral-50 text-coral-700'
                              : 'bg-sage-100 text-sage-600'
                          }`}
                        >
                          {envVar.is_sensitive ? 'Sensitive' : 'Public'}
                        </span>
                      </div>
                    </div>

                    {/* Value column */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {envVar.is_sensitive && !isVisible ? (
                          <div className="flex-1 flex items-center gap-2">
                            <span className="font-mono text-sm text-sage-500 tracking-wider">
                              {maskValue(envVar.value)}
                            </span>
                            <button
                              onClick={() => toggleVisibility(envVar.key)}
                              className="text-xs text-sage-500 hover:text-sage-700 font-medium"
                            >
                              Show
                            </button>
                          </div>
                        ) : (
                          <div className="flex-1 flex items-center gap-2">
                            <input
                              type="text"
                              value={editState?.value ?? envVar.value}
                              onChange={(e) => updateValue(envVar.key, e.target.value)}
                              disabled={editState?.isSaving}
                              className={`flex-1 px-3 py-1.5 text-sm font-mono border rounded-lg focus:outline-none focus:ring-2 focus:ring-sage-500 focus:border-transparent disabled:bg-sage-50 disabled:text-sage-500 transition-all ${
                                isChanged
                                  ? 'border-cream-300 bg-cream-50'
                                  : 'border-sage-200 bg-white'
                              }`}
                            />
                            {envVar.is_sensitive && (
                              <button
                                onClick={() => toggleVisibility(envVar.key)}
                                className="text-xs text-sage-500 hover:text-sage-700 font-medium"
                              >
                                Hide
                              </button>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Error message */}
                      {editState?.error && (
                        <p className="text-xs text-coral-600 mt-1">{editState.error}</p>
                      )}

                      {/* Success message */}
                      {editState?.success && (
                        <p className="text-xs text-forest-600 mt-1 flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Saved successfully
                        </p>
                      )}

                      {/* Updated at */}
                      <p className="text-xs text-sage-400 mt-1">
                        Updated: {formatTimestamp(envVar.updated_at)}
                      </p>
                    </div>

                    {/* Actions column */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {isChanged && (
                        <>
                          <button
                            onClick={() => resetValue(envVar.key)}
                            disabled={editState?.isSaving}
                            className="px-3 py-1.5 text-xs font-medium text-sage-600 hover:text-sage-800 disabled:opacity-50"
                          >
                            Reset
                          </button>
                          <button
                            onClick={() => saveValue(envVar.key)}
                            disabled={editState?.isSaving}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-sage-800 rounded-lg hover:bg-sage-900 transition-colors disabled:opacity-50"
                          >
                            {editState?.isSaving ? (
                              <>
                                <svg className="w-3 h-3 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                                Saving...
                              </>
                            ) : (
                              <>
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                Save
                              </>
                            )}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 text-xs text-sage-400">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-coral-50 text-coral-700 font-medium">
            Sensitive
          </span>
          <span>Masked by default</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-sage-100 text-sage-600 font-medium">
            Public
          </span>
          <span>Always visible</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded bg-cream-300" />
          <span>Modified</span>
        </div>
      </div>
    </div>
  );
}
