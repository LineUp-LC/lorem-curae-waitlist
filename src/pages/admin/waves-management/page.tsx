import { useState, useEffect, useCallback } from 'react';

// Types for API response
interface Wave {
  wave_number: number;
  total_users: number;
  active_users: number;
  pending_users: number;
  last_promoted_at: string | null;
}

interface WavesResponse {
  waves: Wave[];
}

// Promotion state
interface PromotionState {
  fromWave: number;
  limit: number;
  confirmPhrase: string;
  isLoading: boolean;
  error: string | null;
  success: { count: number } | null;
}

const CONFIRMATION_PHRASE = 'PROMOTE USERS';

// Format timestamp for display
function formatTimestamp(dateStr: string | null): string {
  if (!dateStr) return 'Never';
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

// Format number with commas
function formatNumber(num: number): string {
  return num.toLocaleString();
}

// Promotion panel component
function PromotionPanel({
  wave,
  onClose,
  onSuccess,
}: {
  wave: Wave;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [state, setState] = useState<PromotionState>({
    fromWave: wave.wave_number,
    limit: 25,
    confirmPhrase: '',
    isLoading: false,
    error: null,
    success: null,
  });

  const isValidLimit = state.limit >= 1 && state.limit <= 500;
  const isConfirmed = state.confirmPhrase === CONFIRMATION_PHRASE;
  const canSubmit = isValidLimit && isConfirmed && !state.isLoading;

  const handlePromote = async () => {
    if (!canSubmit) return;

    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const adminSecret = import.meta.env.VITE_ADMIN_SECRET;

      if (!adminSecret) {
        throw new Error('Admin credentials not configured');
      }

      const response = await fetch('/api/admin?action=promoteWave', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${adminSecret}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          target_wave: wave.wave_number + 1,
          limit: state.limit,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Promotion failed (${response.status})`);
      }

      const data = await response.json();
      setState((prev) => ({
        ...prev,
        isLoading: false,
        success: { count: data.promoted || data.count || 0 },
      }));

      // Refresh parent data after short delay
      setTimeout(() => {
        onSuccess();
      }, 2000);
    } catch (err) {
      console.error('[WaveManagement] Promotion failed:', err);
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: err instanceof Error ? err.message : 'Promotion failed',
      }));
    }
  };

  if (state.success) {
    return (
      <div className="bg-forest-50 border border-forest-200 rounded-lg p-4 mt-4">
        <div className="flex items-center gap-3">
          <svg className="w-5 h-5 text-forest-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <div className="flex-1">
            <p className="text-sm font-medium text-forest-700">
              Successfully promoted {state.success.count} user{state.success.count !== 1 ? 's' : ''} to Wave {wave.wave_number + 1}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-sm text-forest-600 hover:text-forest-800 font-medium"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-sm font-medium text-blue-800">
            Promote Users from Wave {wave.wave_number} to Wave {wave.wave_number + 1}
          </h3>
          <p className="text-xs text-blue-600 mt-0.5">
            {wave.pending_users} pending user{wave.pending_users !== 1 ? 's' : ''} available for promotion
          </p>
        </div>
        <button
          onClick={onClose}
          className="text-blue-400 hover:text-blue-600 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {state.error && (
        <div className="bg-coral-50 border border-coral-200 rounded-lg p-3 mb-4">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-coral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-coral-700">{state.error}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Limit input */}
        <div className="space-y-1.5">
          <label htmlFor={`limit-${wave.wave_number}`} className="block text-xs font-medium text-blue-700">
            Number of users to promote (1-500)
          </label>
          <input
            type="number"
            id={`limit-${wave.wave_number}`}
            value={state.limit}
            onChange={(e) =>
              setState((prev) => ({
                ...prev,
                limit: Math.min(500, Math.max(1, parseInt(e.target.value) || 1)),
              }))
            }
            min={1}
            max={500}
            disabled={state.isLoading}
            className="w-full px-3 py-2 text-sm border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-blue-100 disabled:text-blue-500"
          />
        </div>

        {/* Confirmation input */}
        <div className="space-y-1.5">
          <label htmlFor={`confirm-${wave.wave_number}`} className="block text-xs font-medium text-blue-700">
            Type <span className="font-mono bg-blue-100 px-1 rounded">{CONFIRMATION_PHRASE}</span> to confirm
          </label>
          <input
            type="text"
            id={`confirm-${wave.wave_number}`}
            value={state.confirmPhrase}
            onChange={(e) =>
              setState((prev) => ({ ...prev, confirmPhrase: e.target.value.toUpperCase() }))
            }
            disabled={state.isLoading}
            placeholder="Type confirmation phrase"
            className="w-full px-3 py-2 text-sm font-mono border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-blue-100 disabled:text-blue-500 uppercase"
          />
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div className="text-xs text-blue-600">
          {isConfirmed ? (
            <span className="flex items-center gap-1 text-forest-600">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Confirmed
            </span>
          ) : state.confirmPhrase ? (
            <span className="text-coral-600">Phrase does not match</span>
          ) : null}
        </div>
        <button
          onClick={handlePromote}
          disabled={!canSubmit}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {state.isLoading ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Promoting...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
              Promote {state.limit} User{state.limit !== 1 ? 's' : ''}
            </>
          )}
        </button>
      </div>
    </div>
  );
}

// Wave row component
function WaveRow({
  wave,
  isExpanded,
  onToggleExpand,
  onPromotionSuccess,
}: {
  wave: Wave;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onPromotionSuccess: () => void;
}) {
  return (
    <>
      <tr className="hover:bg-sage-50/50 transition-colors">
        {/* Wave Number */}
        <td className="px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-sage-100 flex items-center justify-center">
              <span className="text-lg font-semibold text-sage-700">{wave.wave_number}</span>
            </div>
            <span className="text-sm font-medium text-sage-800">Wave {wave.wave_number}</span>
          </div>
        </td>

        {/* Total Users */}
        <td className="px-6 py-4 text-sm text-sage-700 font-medium">
          {formatNumber(wave.total_users)}
        </td>

        {/* Active Users */}
        <td className="px-6 py-4">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-forest-50 text-forest-700">
            <span className="w-1.5 h-1.5 rounded-full bg-forest-500" />
            {formatNumber(wave.active_users)} active
          </span>
        </td>

        {/* Pending Users */}
        <td className="px-6 py-4">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-cream-100 text-cream-800">
            <span className="w-1.5 h-1.5 rounded-full bg-cream-600" />
            {formatNumber(wave.pending_users)} pending
          </span>
        </td>

        {/* Last Promoted At */}
        <td className="px-6 py-4 text-sm text-sage-500">
          {formatTimestamp(wave.last_promoted_at)}
        </td>

        {/* Actions */}
        <td className="px-6 py-4">
          <button
            onClick={onToggleExpand}
            disabled={wave.pending_users === 0}
            className={`inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              wave.pending_users > 0
                ? isExpanded
                  ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                  : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                : 'bg-sage-100 text-sage-400 cursor-not-allowed'
            }`}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
            {isExpanded ? 'Cancel' : 'Promote to Wave ' + (wave.wave_number + 1)}
          </button>
        </td>
      </tr>

      {/* Promotion Panel */}
      {isExpanded && (
        <tr>
          <td colSpan={6} className="px-6 pb-4">
            <PromotionPanel
              wave={wave}
              onClose={onToggleExpand}
              onSuccess={onPromotionSuccess}
            />
          </td>
        </tr>
      )}
    </>
  );
}

export default function WaveManagementPage() {
  const [waves, setWaves] = useState<Wave[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedWave, setExpandedWave] = useState<number | null>(null);

  const fetchWaves = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const adminSecret = import.meta.env.VITE_ADMIN_SECRET;

      if (!adminSecret) {
        throw new Error('Admin credentials not configured');
      }

      const response = await fetch('/api/admin/waves', {
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
        throw new Error(`Failed to fetch waves (${response.status})`);
      }

      const data: WavesResponse = await response.json();
      setWaves(data.waves || []);
    } catch (err) {
      console.error('[WaveManagement] Failed to fetch:', err);
      setError(err instanceof Error ? err.message : 'Failed to load waves');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWaves();
  }, [fetchWaves]);

  // Calculate totals
  const totalUsers = waves.reduce((sum, w) => sum + w.total_users, 0);
  const totalActive = waves.reduce((sum, w) => sum + w.active_users, 0);
  const totalPending = waves.reduce((sum, w) => sum + w.pending_users, 0);

  const handleToggleExpand = (waveNumber: number) => {
    setExpandedWave((prev) => (prev === waveNumber ? null : waveNumber));
  };

  const handlePromotionSuccess = () => {
    setExpandedWave(null);
    fetchWaves();
  };

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-sage-900">Wave Management</h1>
          <p className="mt-1 text-sage-500">
            Control onboarding waves and user progression
          </p>
        </div>
        <button
          onClick={fetchWaves}
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

      {/* Summary cards */}
      {!loading && waves.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-sage-100 p-4">
            <p className="text-sm text-sage-500">Total Users</p>
            <p className="text-2xl font-semibold text-sage-800 mt-1">{formatNumber(totalUsers)}</p>
          </div>
          <div className="bg-white rounded-xl border border-sage-100 p-4">
            <p className="text-sm text-sage-500">Active Users</p>
            <p className="text-2xl font-semibold text-forest-700 mt-1">{formatNumber(totalActive)}</p>
          </div>
          <div className="bg-white rounded-xl border border-sage-100 p-4">
            <p className="text-sm text-sage-500">Pending Promotion</p>
            <p className="text-2xl font-semibold text-cream-700 mt-1">{formatNumber(totalPending)}</p>
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
              <p className="text-sm font-medium text-coral-800">Failed to load waves</p>
              <p className="text-sm text-coral-600">{error}</p>
            </div>
            <button
              onClick={fetchWaves}
              className="text-sm text-coral-700 hover:text-coral-900 font-medium"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Waves table */}
      <div className="bg-white rounded-xl border border-sage-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-sage-100">
          <h2 className="text-lg font-medium text-sage-800">Waves</h2>
          <p className="text-sm text-sage-500 mt-0.5">
            {waves.length} wave{waves.length !== 1 ? 's' : ''} configured
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-sage-50/50">
                <th className="px-6 py-3 text-left text-xs font-semibold text-sage-600 uppercase tracking-wider">
                  Wave
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-sage-600 uppercase tracking-wider">
                  Total Users
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-sage-600 uppercase tracking-wider">
                  Active
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-sage-600 uppercase tracking-wider">
                  Pending
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-sage-600 uppercase tracking-wider">
                  Last Promoted
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-sage-600 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sage-50">
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-sage-100 animate-pulse" />
                        <div className="h-4 bg-sage-100 rounded w-20 animate-pulse" />
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-4 bg-sage-100 rounded w-16 animate-pulse" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-6 bg-sage-100 rounded w-24 animate-pulse" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-6 bg-sage-100 rounded w-24 animate-pulse" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-4 bg-sage-100 rounded w-32 animate-pulse" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="h-7 bg-sage-100 rounded w-32 animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : waves.length > 0 ? (
                waves.map((wave) => (
                  <WaveRow
                    key={wave.wave_number}
                    wave={wave}
                    isExpanded={expandedWave === wave.wave_number}
                    onToggleExpand={() => handleToggleExpand(wave.wave_number)}
                    onPromotionSuccess={handlePromotionSuccess}
                  />
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <svg className="w-12 h-12 mx-auto mb-3 text-sage-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <p className="text-sm text-sage-500">No waves configured yet</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Info section */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="space-y-1">
            <p className="text-sm font-medium text-blue-800">How Wave Promotion Works</p>
            <p className="text-sm text-blue-700">
              Promoting users moves them from a lower wave to the next wave, giving them earlier access to the platform.
              Only pending users can be promoted. Active users have already been onboarded.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
