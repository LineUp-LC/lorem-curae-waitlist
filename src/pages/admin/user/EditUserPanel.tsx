import { useState, FormEvent, useEffect } from 'react';

interface UserData {
  email: string;
  wave_number: number | null;
  status: string;
  is_founding_member: boolean;
  is_founding_member_creator: boolean;
}

interface EditUserPanelProps {
  user: UserData;
  onUserUpdated?: () => void;
}

interface FormState {
  new_email: string;
  wave_number: string;
  status: string;
  is_founding_member: boolean;
  is_founding_member_creator: boolean;
}

export function EditUserPanel({ user, onUserUpdated }: EditUserPanelProps) {
  const [formState, setFormState] = useState<FormState>({
    new_email: user.email,
    wave_number: user.wave_number !== null ? String(user.wave_number) : 'null',
    status: user.status,
    is_founding_member: user.is_founding_member,
    is_founding_member_creator: user.is_founding_member_creator,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Reset form when user prop changes
  useEffect(() => {
    setFormState({
      new_email: user.email,
      wave_number: user.wave_number !== null ? String(user.wave_number) : 'null',
      status: user.status,
      is_founding_member: user.is_founding_member,
      is_founding_member_creator: user.is_founding_member_creator,
    });
    setSuccess(false);
    setError(null);
  }, [user]);

  // Check if any field has changed
  const hasChanges = (): boolean => {
    if (formState.new_email !== user.email) return true;

    const currentWaveNumber = user.wave_number !== null ? String(user.wave_number) : 'null';
    if (formState.wave_number !== currentWaveNumber) return true;

    if (formState.status !== user.status) return true;
    if (formState.is_founding_member !== user.is_founding_member) return true;
    if (formState.is_founding_member_creator !== user.is_founding_member_creator) return true;

    return false;
  };

  // Build the update payload with only changed fields
  const buildUpdatePayload = (): Record<string, unknown> => {
    const payload: Record<string, unknown> = {
      email: user.email, // Always include original email
    };

    if (formState.new_email !== user.email) {
      payload.new_email = formState.new_email;
    }

    const currentWaveNumber = user.wave_number !== null ? String(user.wave_number) : 'null';
    if (formState.wave_number !== currentWaveNumber) {
      payload.wave_number = formState.wave_number === 'null' ? null : parseInt(formState.wave_number, 10);
    }

    if (formState.status !== user.status) {
      payload.status = formState.status;
    }

    if (formState.is_founding_member !== user.is_founding_member) {
      payload.is_founding_member = formState.is_founding_member;
    }

    if (formState.is_founding_member_creator !== user.is_founding_member_creator) {
      payload.is_founding_member_creator = formState.is_founding_member_creator;
    }

    return payload;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!hasChanges()) {
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

      const payload = buildUpdatePayload();

      const response = await fetch('/api/admin/update-waitlist-user', {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${adminSecret}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Unauthorized - check admin credentials');
        }
        if (response.status === 404) {
          throw new Error('User not found');
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Update failed (${response.status})`);
      }

      setSuccess(true);

      // Notify parent to refresh data
      if (onUserUpdated) {
        onUserUpdated();
      }
    } catch (err) {
      console.error('[EditUserPanel] Update failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to update user');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof FormState, value: string | boolean) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
    // Clear success message when user makes changes
    if (success) {
      setSuccess(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-sage-100 overflow-hidden">
      <div className="px-6 py-4 border-b border-sage-100">
        <h2 className="text-lg font-medium text-sage-800">Edit User</h2>
        <p className="text-sm text-sage-500 mt-0.5">Update user information</p>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {/* Error message */}
        {error && (
          <div className="bg-coral-50 border border-coral-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-coral-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
              <svg className="w-5 h-5 text-forest-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <p className="text-sm text-forest-700">User updated successfully</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* New Email field */}
          <div className="space-y-1.5 sm:col-span-2">
            <label htmlFor="new_email" className="block text-sm font-medium text-sage-700">
              Email Address
            </label>
            <input
              type="email"
              id="new_email"
              value={formState.new_email}
              onChange={(e) => handleInputChange('new_email', e.target.value)}
              disabled={loading}
              className="w-full px-3 py-2 text-sm font-mono border border-sage-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sage-500 focus:border-transparent disabled:bg-sage-50 disabled:text-sage-500 transition-shadow"
            />
            {formState.new_email !== user.email && (
              <p className="text-xs text-cream-700">
                Email will be changed from {user.email}
              </p>
            )}
          </div>

          {/* Wave Number field */}
          <div className="space-y-1.5">
            <label htmlFor="wave_number" className="block text-sm font-medium text-sage-700">
              Wave Number
            </label>
            <select
              id="wave_number"
              value={formState.wave_number}
              onChange={(e) => handleInputChange('wave_number', e.target.value)}
              disabled={loading}
              className="w-full px-3 py-2 text-sm border border-sage-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sage-500 focus:border-transparent bg-white disabled:bg-sage-50 disabled:text-sage-500 transition-shadow"
            >
              <option value="1">Wave 1</option>
              <option value="2">Wave 2</option>
              <option value="3">Wave 3</option>
              <option value="null">Fallback (Unassigned)</option>
            </select>
          </div>

          {/* Status field */}
          <div className="space-y-1.5">
            <label htmlFor="status" className="block text-sm font-medium text-sage-700">
              Status
            </label>
            <select
              id="status"
              value={formState.status}
              onChange={(e) => handleInputChange('status', e.target.value)}
              disabled={loading}
              className="w-full px-3 py-2 text-sm border border-sage-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sage-500 focus:border-transparent bg-white disabled:bg-sage-50 disabled:text-sage-500 transition-shadow"
            >
              <option value="active">Active</option>
              <option value="waiting_for_next_wave">Waiting for Next Wave</option>
            </select>
          </div>

          {/* Founding Member checkbox */}
          <div className="space-y-1.5 sm:col-span-2">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="is_founding_member"
                checked={formState.is_founding_member}
                onChange={(e) => handleInputChange('is_founding_member', e.target.checked)}
                disabled={loading}
                className="w-4 h-4 text-sage-600 border-sage-300 rounded focus:ring-sage-500 disabled:opacity-50"
              />
              <label htmlFor="is_founding_member" className="text-sm font-medium text-sage-700">
                Founding Member
              </label>
            </div>
            <p className="text-xs text-sage-500 ml-7">
              Founding members receive priority access and special benefits (general pool, cap 50)
            </p>
          </div>

          {/* Founding Member Creator checkbox */}
          <div className="space-y-1.5 sm:col-span-2">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="is_founding_member_creator"
                checked={formState.is_founding_member_creator}
                onChange={(e) => handleInputChange('is_founding_member_creator', e.target.checked)}
                disabled={loading}
                className="w-4 h-4 text-sage-600 border-sage-300 rounded focus:ring-sage-500 disabled:opacity-50"
              />
              <label htmlFor="is_founding_member_creator" className="text-sm font-medium text-sage-700">
                Founding Member Creator
              </label>
            </div>
            <p className="text-xs text-sage-500 ml-7">
              Creator founding members receive priority creator access and exclusive creator benefits (separate pool, cap 20)
            </p>
          </div>
        </div>

        {/* Form actions */}
        <div className="flex items-center justify-between pt-4 border-t border-sage-100">
          <p className="text-xs text-sage-400">
            {hasChanges() ? 'You have unsaved changes' : 'No changes to save'}
          </p>
          <button
            type="submit"
            disabled={loading || !hasChanges()}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-sage-800 rounded-lg hover:bg-sage-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Saving...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Save Changes
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
