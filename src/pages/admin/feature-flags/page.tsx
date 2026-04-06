import { useState, useEffect, useCallback } from 'react';
import { CreateFeatureFlagPanel } from './CreateFeatureFlagPanel';

// Types for API response
interface FeatureFlag {
  key: string;
  value: string | number | boolean;
  type: 'boolean' | 'string' | 'number';
  updated_at: string;
}

interface FeatureFlagsResponse {
  flags: FeatureFlag[];
  missing_flags: string[];
  unexpected_flags: string[];
}

// Editable flag state
interface EditableFlag extends FeatureFlag {
  editedValue: string | number | boolean;
  isSaving: boolean;
  saveError: string | null;
  saveSuccess: boolean;
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

// Get type badge styles
function getTypeBadgeStyles(type: FeatureFlag['type']): string {
  switch (type) {
    case 'boolean':
      return 'bg-purple-50 text-purple-700 border-purple-200';
    case 'string':
      return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'number':
      return 'bg-teal-50 text-teal-700 border-teal-200';
    default:
      return 'bg-sage-50 text-sage-700 border-sage-200';
  }
}

// Toggle switch component
function ToggleSwitch({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      disabled={disabled}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-sage-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
        checked ? 'bg-forest-500' : 'bg-sage-300'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );
}

// Flag row component
function FlagRow({
  flag,
  onValueChange,
  onSave,
}: {
  flag: EditableFlag;
  onValueChange: (key: string, value: string | number | boolean) => void;
  onSave: (key: string) => void;
}) {
  const hasChanged = flag.editedValue !== flag.value;

  return (
    <tr className={`hover:bg-sage-50/50 transition-colors ${hasChanged ? 'bg-cream-50/50' : ''}`}>
      {/* Key */}
      <td className="px-6 py-4">
        <span className="font-mono text-sm text-sage-800">{flag.key}</span>
      </td>

      {/* Type */}
      <td className="px-6 py-4">
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getTypeBadgeStyles(flag.type)}`}
        >
          {flag.type}
        </span>
      </td>

      {/* Current Value */}
      <td className="px-6 py-4">
        {flag.type === 'boolean' ? (
          <ToggleSwitch
            checked={flag.editedValue as boolean}
            onChange={(checked) => onValueChange(flag.key, checked)}
            disabled={flag.isSaving}
          />
        ) : flag.type === 'number' ? (
          <input
            type="number"
            value={flag.editedValue as number}
            onChange={(e) => onValueChange(flag.key, parseFloat(e.target.value) || 0)}
            disabled={flag.isSaving}
            className={`w-32 px-3 py-1.5 text-sm font-mono border rounded-lg focus:outline-none focus:ring-2 focus:ring-sage-500 focus:border-transparent disabled:bg-sage-50 disabled:text-sage-500 transition-shadow ${
              hasChanged ? 'border-cream-400 bg-cream-50' : 'border-sage-200'
            }`}
          />
        ) : (
          <input
            type="text"
            value={flag.editedValue as string}
            onChange={(e) => onValueChange(flag.key, e.target.value)}
            disabled={flag.isSaving}
            className={`w-full max-w-xs px-3 py-1.5 text-sm font-mono border rounded-lg focus:outline-none focus:ring-2 focus:ring-sage-500 focus:border-transparent disabled:bg-sage-50 disabled:text-sage-500 transition-shadow ${
              hasChanged ? 'border-cream-400 bg-cream-50' : 'border-sage-200'
            }`}
          />
        )}
      </td>

      {/* Updated At */}
      <td className="px-6 py-4 text-sm text-sage-500 whitespace-nowrap">
        {formatTimestamp(flag.updated_at)}
      </td>

      {/* Actions */}
      <td className="px-6 py-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => onSave(flag.key)}
            disabled={!hasChanged || flag.isSaving}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              hasChanged && !flag.isSaving
                ? 'bg-forest-600 text-white hover:bg-forest-700'
                : 'bg-sage-100 text-sage-400 cursor-not-allowed'
            }`}
          >
            {flag.isSaving ? (
              <>
                <svg className="w-3.5 h-3.5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Saving
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Save
              </>
            )}
          </button>

          {flag.saveSuccess && (
            <span className="text-xs text-forest-600">Saved!</span>
          )}

          {flag.saveError && (
            <span className="text-xs text-coral-600" title={flag.saveError}>
              Error
            </span>
          )}
        </div>
      </td>
    </tr>
  );
}

export default function FeatureFlagsPage() {
  const [flags, setFlags] = useState<EditableFlag[]>([]);
  const [missingFlags, setMissingFlags] = useState<string[]>([]);
  const [unexpectedFlags, setUnexpectedFlags] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFlags = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const adminSecret = import.meta.env.VITE_ADMIN_SECRET;

      if (!adminSecret) {
        throw new Error('Admin credentials not configured');
      }

      const response = await fetch('/api/admin/feature-flags', {
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
        throw new Error(`Failed to fetch feature flags (${response.status})`);
      }

      const data: FeatureFlagsResponse = await response.json();

      // Convert to editable flags
      const editableFlags: EditableFlag[] = data.flags.map((flag) => ({
        ...flag,
        editedValue: flag.value,
        isSaving: false,
        saveError: null,
        saveSuccess: false,
      }));

      setFlags(editableFlags);
      setMissingFlags(data.missing_flags || []);
      setUnexpectedFlags(data.unexpected_flags || []);
    } catch (err) {
      console.error('[FeatureFlags] Failed to fetch:', err);
      setError(err instanceof Error ? err.message : 'Failed to load feature flags');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFlags();
  }, [fetchFlags]);

  // Handle value change
  const handleValueChange = (key: string, value: string | number | boolean) => {
    setFlags((prev) =>
      prev.map((flag) =>
        flag.key === key
          ? { ...flag, editedValue: value, saveSuccess: false, saveError: null }
          : flag
      )
    );
  };

  // Handle save
  const handleSave = async (key: string) => {
    const flag = flags.find((f) => f.key === key);
    if (!flag) return;

    // Update saving state
    setFlags((prev) =>
      prev.map((f) =>
        f.key === key ? { ...f, isSaving: true, saveError: null, saveSuccess: false } : f
      )
    );

    try {
      const adminSecret = import.meta.env.VITE_ADMIN_SECRET;

      if (!adminSecret) {
        throw new Error('Admin credentials not configured');
      }

      const response = await fetch('/api/admin/update-feature-flag', {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${adminSecret}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          key: flag.key,
          value: flag.editedValue,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to update flag (${response.status})`);
      }

      // Update the flag with new value and timestamp
      setFlags((prev) =>
        prev.map((f) =>
          f.key === key
            ? {
                ...f,
                value: f.editedValue,
                updated_at: new Date().toISOString(),
                isSaving: false,
                saveSuccess: true,
              }
            : f
        )
      );

      // Clear success message after 3 seconds
      setTimeout(() => {
        setFlags((prev) =>
          prev.map((f) => (f.key === key ? { ...f, saveSuccess: false } : f))
        );
      }, 3000);
    } catch (err) {
      console.error('[FeatureFlags] Failed to save:', err);
      setFlags((prev) =>
        prev.map((f) =>
          f.key === key
            ? { ...f, isSaving: false, saveError: err instanceof Error ? err.message : 'Save failed' }
            : f
        )
      );
    }
  };

  // Count changed flags
  const changedCount = flags.filter((f) => f.editedValue !== f.value).length;

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-sage-900">Feature Flags</h1>
          <p className="mt-1 text-sage-500">
            Control platform behavior without redeploying
          </p>
        </div>
        <button
          onClick={fetchFlags}
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

      {/* Changed indicator */}
      {changedCount > 0 && (
        <div className="bg-cream-50 border border-cream-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-cream-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p className="text-sm text-cream-800">
              You have {changedCount} unsaved change{changedCount !== 1 ? 's' : ''}
            </p>
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
              <p className="text-sm font-medium text-coral-800">Failed to load feature flags</p>
              <p className="text-sm text-coral-600">{error}</p>
            </div>
            <button
              onClick={fetchFlags}
              className="text-sm text-coral-700 hover:text-coral-900 font-medium"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Create new flag panel */}
      <CreateFeatureFlagPanel onFlagCreated={fetchFlags} />

      {/* Flags table */}
      <div className="bg-white rounded-xl border border-sage-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-sage-100">
          <h2 className="text-lg font-medium text-sage-800">Active Flags</h2>
          <p className="text-sm text-sage-500 mt-0.5">
            {flags.length} flag{flags.length !== 1 ? 's' : ''} configured
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-sage-50/50">
                <th className="px-6 py-3 text-left text-xs font-semibold text-sage-600 uppercase tracking-wider">
                  Key
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-sage-600 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-sage-600 uppercase tracking-wider">
                  Value
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-sage-600 uppercase tracking-wider">
                  Updated At
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-sage-600 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sage-50">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-6 py-4">
                      <div className="h-4 bg-sage-100 rounded w-40 animate-pulse" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-5 bg-sage-100 rounded w-16 animate-pulse" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-8 bg-sage-100 rounded w-32 animate-pulse" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-4 bg-sage-100 rounded w-32 animate-pulse" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-7 bg-sage-100 rounded w-16 animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : flags.length > 0 ? (
                flags.map((flag) => (
                  <FlagRow
                    key={flag.key}
                    flag={flag}
                    onValueChange={handleValueChange}
                    onSave={handleSave}
                  />
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <svg className="w-12 h-12 mx-auto mb-3 text-sage-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
                    </svg>
                    <p className="text-sm text-sage-500">No feature flags configured</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Missing and Unexpected Flags */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Missing Flags */}
        <div className="bg-white rounded-xl border border-sage-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-sage-100 bg-amber-50/50">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <h2 className="text-lg font-medium text-amber-800">Missing Flags</h2>
            </div>
            <p className="text-sm text-amber-600 mt-0.5">
              Expected flags not found in configuration
            </p>
          </div>
          <div className="p-6">
            {loading ? (
              <div className="space-y-2">
                <div className="h-6 bg-sage-100 rounded w-32 animate-pulse" />
                <div className="h-6 bg-sage-100 rounded w-40 animate-pulse" />
              </div>
            ) : missingFlags.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {missingFlags.map((flag) => (
                  <span
                    key={flag}
                    className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-mono bg-amber-50 text-amber-700 border border-amber-200"
                  >
                    {flag}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-forest-600 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                None — all expected flags are present
              </p>
            )}
          </div>
        </div>

        {/* Unexpected Flags */}
        <div className="bg-white rounded-xl border border-sage-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-sage-100 bg-sage-50/50">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-sage-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h2 className="text-lg font-medium text-sage-800">Unexpected Flags</h2>
            </div>
            <p className="text-sm text-sage-500 mt-0.5">
              Flags found that are not in the expected schema
            </p>
          </div>
          <div className="p-6">
            {loading ? (
              <div className="space-y-2">
                <div className="h-6 bg-sage-100 rounded w-32 animate-pulse" />
                <div className="h-6 bg-sage-100 rounded w-40 animate-pulse" />
              </div>
            ) : unexpectedFlags.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {unexpectedFlags.map((flag) => (
                  <span
                    key={flag}
                    className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-mono bg-sage-100 text-sage-700 border border-sage-200"
                  >
                    {flag}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-forest-600 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                None — no unexpected flags found
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
