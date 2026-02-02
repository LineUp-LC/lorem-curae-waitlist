import { useState, FormEvent } from 'react';

interface CreateFeatureFlagPanelProps {
  onFlagCreated: () => void;
}

type FlagType = 'boolean' | 'string' | 'number';

interface FormState {
  key: string;
  type: FlagType;
  booleanValue: boolean;
  stringValue: string;
  numberValue: number;
}

// Validate key format
function isValidKey(key: string): boolean {
  return /^[a-zA-Z][a-zA-Z0-9_]*$/.test(key);
}

// Get key validation error
function getKeyError(key: string): string | null {
  if (!key.trim()) {
    return 'Key is required';
  }
  if (!/^[a-zA-Z]/.test(key)) {
    return 'Key must start with a letter';
  }
  if (!/^[a-zA-Z0-9_]+$/.test(key)) {
    return 'Key can only contain letters, numbers, and underscores';
  }
  return null;
}

export function CreateFeatureFlagPanel({ onFlagCreated }: CreateFeatureFlagPanelProps) {
  const [formState, setFormState] = useState<FormState>({
    key: '',
    type: 'boolean',
    booleanValue: false,
    stringValue: '',
    numberValue: 0,
  });
  const [isExpanded, setIsExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [touched, setTouched] = useState(false);

  // Get current value based on type
  const getCurrentValue = (): string | number | boolean => {
    switch (formState.type) {
      case 'boolean':
        return formState.booleanValue;
      case 'string':
        return formState.stringValue;
      case 'number':
        return formState.numberValue;
    }
  };

  // Validate form
  const keyError = touched ? getKeyError(formState.key) : null;
  const isKeyValid = isValidKey(formState.key);
  const isFormValid = isKeyValid && formState.key.trim().length > 0;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setTouched(true);

    if (!isFormValid) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(false);

      const adminSecret = import.meta.env.VITE_ADMIN_SECRET;

      if (!adminSecret) {
        throw new Error('Admin credentials not configured');
      }

      const response = await fetch('/api/admin/create-feature-flag', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${adminSecret}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          key: formState.key,
          type: formState.type,
          value: getCurrentValue(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to create flag (${response.status})`);
      }

      setSuccess(true);
      setFormState({
        key: '',
        type: 'boolean',
        booleanValue: false,
        stringValue: '',
        numberValue: 0,
      });
      setTouched(false);

      // Notify parent to refresh
      onFlagCreated();

      // Clear success after 3 seconds
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    } catch (err) {
      console.error('[CreateFeatureFlag] Failed to create:', err);
      setError(err instanceof Error ? err.message : 'Failed to create flag');
    } finally {
      setLoading(false);
    }
  };

  const handleTypeChange = (newType: FlagType) => {
    setFormState((prev) => ({ ...prev, type: newType }));
  };

  const handleKeyChange = (key: string) => {
    setFormState((prev) => ({ ...prev, key }));
    if (!touched) setTouched(true);
  };

  if (!isExpanded) {
    return (
      <button
        onClick={() => setIsExpanded(true)}
        className="w-full bg-white rounded-xl border border-dashed border-sage-300 p-6 flex items-center justify-center gap-3 hover:bg-sage-50 hover:border-sage-400 transition-colors group"
      >
        <div className="w-10 h-10 rounded-full bg-sage-100 group-hover:bg-sage-200 flex items-center justify-center transition-colors">
          <svg className="w-5 h-5 text-sage-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </div>
        <span className="text-sm font-medium text-sage-600 group-hover:text-sage-800">
          Create New Feature Flag
        </span>
      </button>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-sage-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-sage-100 flex items-center justify-between bg-sage-50/50">
        <div>
          <h2 className="text-lg font-medium text-sage-800">Create New Feature Flag</h2>
          <p className="text-sm text-sage-500 mt-0.5">Add a new configuration flag to the system</p>
        </div>
        <button
          onClick={() => {
            setIsExpanded(false);
            setError(null);
            setSuccess(false);
            setTouched(false);
          }}
          className="text-sage-400 hover:text-sage-600 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {/* Error message */}
        {error && (
          <div className="bg-coral-50 border border-coral-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-coral-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-coral-700">{error}</p>
            </div>
          </div>
        )}

        {/* Success message */}
        {success && (
          <div className="bg-forest-50 border border-forest-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-forest-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <p className="text-sm text-forest-700">Feature flag created successfully!</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {/* Key input */}
          <div className="space-y-1.5">
            <label htmlFor="flag-key" className="block text-sm font-medium text-sage-700">
              Flag Key <span className="text-coral-500">*</span>
            </label>
            <input
              type="text"
              id="flag-key"
              value={formState.key}
              onChange={(e) => handleKeyChange(e.target.value)}
              disabled={loading}
              placeholder="my_feature_flag"
              className={`w-full px-3 py-2 text-sm font-mono border rounded-lg focus:outline-none focus:ring-2 focus:ring-sage-500 focus:border-transparent disabled:bg-sage-50 disabled:text-sage-500 transition-shadow ${
                keyError ? 'border-coral-300 bg-coral-50/50' : 'border-sage-200'
              }`}
            />
            {keyError && (
              <p className="text-xs text-coral-600">{keyError}</p>
            )}
            {!keyError && formState.key && (
              <p className="text-xs text-forest-600 flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Valid key format
              </p>
            )}
          </div>

          {/* Type select */}
          <div className="space-y-1.5">
            <label htmlFor="flag-type" className="block text-sm font-medium text-sage-700">
              Value Type
            </label>
            <select
              id="flag-type"
              value={formState.type}
              onChange={(e) => handleTypeChange(e.target.value as FlagType)}
              disabled={loading}
              className="w-full px-3 py-2 text-sm border border-sage-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sage-500 focus:border-transparent bg-white disabled:bg-sage-50 disabled:text-sage-500"
            >
              <option value="boolean">Boolean</option>
              <option value="string">String</option>
              <option value="number">Number</option>
            </select>
          </div>

          {/* Value input - changes based on type */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-sage-700">
              Default Value
            </label>
            {formState.type === 'boolean' ? (
              <div className="flex items-center gap-3 h-[38px]">
                <button
                  type="button"
                  onClick={() => setFormState((prev) => ({ ...prev, booleanValue: !prev.booleanValue }))}
                  disabled={loading}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-sage-500 focus:ring-offset-2 disabled:opacity-50 ${
                    formState.booleanValue ? 'bg-forest-500' : 'bg-sage-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      formState.booleanValue ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
                <span className="text-sm text-sage-600">
                  {formState.booleanValue ? 'Enabled' : 'Disabled'}
                </span>
              </div>
            ) : formState.type === 'number' ? (
              <input
                type="number"
                value={formState.numberValue}
                onChange={(e) =>
                  setFormState((prev) => ({ ...prev, numberValue: parseFloat(e.target.value) || 0 }))
                }
                disabled={loading}
                className="w-full px-3 py-2 text-sm font-mono border border-sage-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sage-500 focus:border-transparent disabled:bg-sage-50 disabled:text-sage-500"
              />
            ) : (
              <input
                type="text"
                value={formState.stringValue}
                onChange={(e) => setFormState((prev) => ({ ...prev, stringValue: e.target.value }))}
                disabled={loading}
                placeholder="Enter value..."
                className="w-full px-3 py-2 text-sm font-mono border border-sage-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sage-500 focus:border-transparent disabled:bg-sage-50 disabled:text-sage-500"
              />
            )}
          </div>
        </div>

        {/* Preview */}
        <div className="bg-sage-50 rounded-lg p-4">
          <p className="text-xs font-medium text-sage-500 uppercase tracking-wider mb-2">Preview</p>
          <pre className="text-sm font-mono text-sage-700">
            {JSON.stringify(
              {
                key: formState.key || '<key>',
                type: formState.type,
                value: getCurrentValue(),
              },
              null,
              2
            )}
          </pre>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-sage-100">
          <p className="text-xs text-sage-400">
            {isFormValid ? 'Ready to create' : 'Fill in required fields'}
          </p>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                setIsExpanded(false);
                setError(null);
                setSuccess(false);
                setTouched(false);
              }}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-sage-600 hover:text-sage-800 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!isFormValid || loading}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-sage-800 rounded-lg hover:bg-sage-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Creating...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Create Flag
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
