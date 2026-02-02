import { useState, FormEvent } from 'react';

const CONFIRMATION_PHRASE = 'DELETE FALLBACK USERS';

export function BulkDeleteFallbackPanel() {
  const [limit, setLimit] = useState(25);
  const [confirmPhrase, setConfirmPhrase] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ deleted: number } | null>(null);

  const isValidLimit = limit >= 1 && limit <= 100;
  const isConfirmed = confirmPhrase === CONFIRMATION_PHRASE;
  const canSubmit = isValidLimit && isConfirmed && !loading;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!canSubmit) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setResult(null);

      const adminSecret = import.meta.env.VITE_ADMIN_SECRET;

      if (!adminSecret) {
        throw new Error('Admin credentials not configured');
      }

      const response = await fetch('/api/admin/bulk-delete-fallback-users', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${adminSecret}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ limit }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Unauthorized - check admin credentials');
        }
        if (response.status === 429) {
          throw new Error('Rate limit exceeded - please wait before trying again');
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Bulk delete failed (${response.status})`);
      }

      const data = await response.json();
      setResult({ deleted: data.deleted || data.count || 0 });
      setConfirmPhrase('');
    } catch (err) {
      console.error('[BulkDeleteFallbackPanel] Delete failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete fallback users');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setError(null);
    setConfirmPhrase('');
  };

  return (
    <div className="bg-white rounded-xl border-2 border-coral-200 overflow-hidden">
      <div className="px-6 py-4 bg-coral-50 border-b border-coral-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-coral-100 flex items-center justify-center">
            <svg className="w-5 h-5 text-coral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-medium text-coral-800">Bulk Delete Fallback Users</h2>
            <p className="text-sm text-coral-600">Remove users with no wave assignment</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {/* Warning messages */}
        <div className="bg-coral-50 border border-coral-200 rounded-lg p-4 space-y-2">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-coral-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div className="space-y-1">
              <p className="text-sm font-medium text-coral-800">
                This action permanently deletes fallback users (wave_number = null).
              </p>
              <p className="text-sm text-coral-700">
                This cannot be undone.
              </p>
              <p className="text-sm text-coral-700">
                This action is rate-limited and logged.
              </p>
              <p className="text-sm text-coral-700">
                Maximum 100 users per request.
              </p>
            </div>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="bg-coral-50 border border-coral-300 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-coral-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-coral-700">{error}</p>
            </div>
          </div>
        )}

        {/* Success message */}
        {result && (
          <div className="bg-forest-50 border border-forest-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-forest-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <div>
                <p className="text-sm font-medium text-forest-700">
                  Successfully deleted {result.deleted} fallback user{result.deleted !== 1 ? 's' : ''}
                </p>
                <button
                  type="button"
                  onClick={handleReset}
                  className="text-sm text-forest-600 hover:text-forest-800 font-medium mt-2 transition-colors"
                >
                  Delete more users
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Form fields (hidden after success) */}
        {!result && (
          <>
            {/* Limit input */}
            <div className="space-y-2">
              <label htmlFor="limit" className="block text-sm font-medium text-sage-700">
                Number of users to delete
              </label>
              <input
                type="number"
                id="limit"
                value={limit}
                onChange={(e) => setLimit(Math.min(100, Math.max(1, parseInt(e.target.value) || 1)))}
                min={1}
                max={100}
                disabled={loading}
                className="w-full px-3 py-2 text-sm border border-sage-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-coral-500 focus:border-transparent disabled:bg-sage-50 disabled:text-sage-500 transition-shadow"
              />
              {!isValidLimit && (
                <p className="text-xs text-coral-600">
                  Limit must be between 1 and 100
                </p>
              )}
            </div>

            {/* Confirmation input */}
            <div className="space-y-2">
              <label htmlFor="confirm_phrase" className="block text-sm font-medium text-sage-700">
                Type <span className="font-mono bg-sage-100 px-1.5 py-0.5 rounded text-sage-800">{CONFIRMATION_PHRASE}</span> to confirm
              </label>
              <input
                type="text"
                id="confirm_phrase"
                value={confirmPhrase}
                onChange={(e) => setConfirmPhrase(e.target.value.toUpperCase())}
                disabled={loading}
                placeholder="Type confirmation phrase"
                className="w-full px-3 py-2 text-sm font-mono border border-sage-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-coral-500 focus:border-transparent disabled:bg-sage-50 disabled:text-sage-500 transition-shadow uppercase"
              />
              {confirmPhrase && !isConfirmed && (
                <p className="text-xs text-coral-600">
                  Phrase does not match. Please type exactly: {CONFIRMATION_PHRASE}
                </p>
              )}
              {isConfirmed && (
                <p className="text-xs text-forest-600 flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Confirmation phrase accepted
                </p>
              )}
            </div>

            {/* Submit button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={!canSubmit}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-white bg-coral-600 rounded-lg hover:bg-coral-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-coral-600"
              >
                {loading ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Deleting...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Bulk Delete {limit} Fallback User{limit !== 1 ? 's' : ''}
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </form>
    </div>
  );
}
