import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';

interface DeleteUserPanelProps {
  email: string;
}

export function DeleteUserPanel({ email }: DeleteUserPanelProps) {
  const navigate = useNavigate();
  const [confirmEmail, setConfirmEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const isConfirmed = confirmEmail === email;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!isConfirmed) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const adminSecret = import.meta.env.VITE_ADMIN_SECRET;

      if (!adminSecret) {
        throw new Error('Admin credentials not configured');
      }

      const response = await fetch('/api/admin/delete-waitlist-user', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${adminSecret}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Unauthorized - check admin credentials');
        }
        if (response.status === 404) {
          throw new Error('User not found');
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Delete failed (${response.status})`);
      }

      setSuccess(true);

      // Redirect to search after a short delay
      setTimeout(() => {
        navigate('/admin/search');
      }, 2000);
    } catch (err) {
      console.error('[DeleteUserPanel] Delete failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete user');
    } finally {
      setLoading(false);
    }
  };

  // If successfully deleted, show success state
  if (success) {
    return (
      <div className="bg-forest-50 border border-forest-200 rounded-xl p-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-forest-100 flex items-center justify-center">
            <svg className="w-6 h-6 text-forest-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-medium text-forest-800">User Deleted</h3>
            <p className="text-sm text-forest-600 mt-1">
              The user has been permanently deleted. Redirecting to search...
            </p>
          </div>
        </div>
      </div>
    );
  }

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
            <h2 className="text-lg font-medium text-coral-800">Delete User</h2>
            <p className="text-sm text-coral-600">Permanently remove this user from the waitlist</p>
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
                This action is permanent and cannot be undone.
              </p>
              <p className="text-sm text-coral-700">
                All waitlist data for this user will be removed.
              </p>
              <p className="text-sm text-coral-700">
                This will be logged in the activity log.
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

        {/* Confirmation input */}
        <div className="space-y-2">
          <label htmlFor="confirm_email" className="block text-sm font-medium text-sage-700">
            Type <span className="font-mono bg-sage-100 px-1.5 py-0.5 rounded text-sage-800">{email}</span> to confirm
          </label>
          <input
            type="text"
            id="confirm_email"
            value={confirmEmail}
            onChange={(e) => setConfirmEmail(e.target.value)}
            disabled={loading}
            placeholder="Enter email to confirm deletion"
            className="w-full px-3 py-2 text-sm font-mono border border-sage-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-coral-500 focus:border-transparent disabled:bg-sage-50 disabled:text-sage-500 transition-shadow"
          />
          {confirmEmail && !isConfirmed && (
            <p className="text-xs text-coral-600">
              Email does not match. Please type the exact email address.
            </p>
          )}
          {isConfirmed && (
            <p className="text-xs text-forest-600 flex items-center gap-1">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Email confirmed
            </p>
          )}
        </div>

        {/* Submit button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={loading || !isConfirmed}
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
                Permanently Delete User
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
